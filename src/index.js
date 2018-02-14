// @flow
'use strict';

import glUtils from "./glUtils";
import StaticDrawArrayBuffer from "./staticDrawArrayBuffer";
import FrameBuffer from "./frameBuffer";
import Texture2D from "./texture2d";

/**
 * A `WindLayer` object renders wind data into a canvas
 *
 * @param {number} lat Latitude, measured in degrees.
 * @param {number} lon Longitude, measured in degrees.
 * @example
 * 
 */
class WindLayer {
    context: GLContext;

    constructor(gl: GLContext) {

        this.context = gl;
        this.renderParticlesProgram = glUtils.createProgramFromSources(gl, renderParticlesVert, renderParticlesFrag);
        this.accumulationProgram = glUtils.createProgramFromSources(gl, quadVert, accumulationFrag);
        this.updateParticlesProgram = glUtils.createProgramFromSources(gl, quadVert, updateParticlesFrag);

        this.quadBuffer = new StaticDrawArrayBuffer(glUtils.createClipSpaceQuadVertices());
        this.frameBuffer = new FrameBuffer(gl);

        this.resize();

    }

    resize() {

        this.rebuildScreenTextures();

    }

    rebuildScreenTextures() {

        const gl = this.context;
        const emptyBuffer = glUtils.createPixelBuffer(gl.canvas.width, gl.canvas.height, 4);

        this.offscreenTexture = new Texture2D(gl, emptyBuffer, gl.canvas.width, gl.canvas.height);
        this.screenTexture = new Texture2D(gl, emptyBuffer, gl.canvas.width, gl.canvas.height);

    }

    set windData(data: Image) {

        this.windTexture = new Texture2D(this.context, data, this.context.LINEAR);

    }

    set noiseData(data: Image) {

        this.noiseTexture = new Texture2D(this.context, data, this.context.NEAREST);

    }

    render() {

        this.setup();
        this.bindTextures();
        this.drawLayer();
        this.updateParticles();

    }

    setup() {

        const gl = this.context;
        gl.disable(GL.DEPTH_TEST);
        gl.disable(GL.STENCIL_TEST);

    }

    bindTextures() {

        this.windTexture.bind(0);
        this.particleStateTexture.bind(1);
        this.noiseTexture.bind(2);

    }

    drawLayer() {

        const gl = this.context;

        draw2OffscreenBuffer();
        blendOffscreenBuffer2Screen();
        swapTextureIds();

    }

    draw2OffscreenBuffer() {

        const gl = this.context;

        this.frameBuffer.bindColorBuffer(this.screenTexture);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        this.drawPreviousFrame();
        this.drawParticles();

        this.frameBuffer.unbind();

    }

    blendOffscreenBuffer2Screen() {

        const gl = this.context;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.drawTexture(this.screenTexture, 1.0);
        gl.disable(gl.BLEND);

    }

    drawPreviousFrame() {

        this.drawTexture(this.offscreenTexture, this.fadeOpacity);

    }

    drawParticles() {

        const gl = this.gl;
        const program = this.renderParticlesProgram;

        program.bind();
        this.particleIndexBuffer.bindAttribPointer(program.a_index, 1);
        this.colorRampTexture.bind(2);

        gl.uniform1i(program.u_wind, 0);
        gl.uniform1i(program.u_particles, 1);
        gl.uniform1i(program.u_color_ramp, 2);
        gl.uniform1f(program.u_particles_res, this.particleStateResolution);
        gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
        gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);

        gl.drawArrays(gl.POINTS, 0, this._numParticles);

    }

    drawTexture(texture, opacity) {

        const gl = this.context;
        const program = this.accumulationProgram;
        const programContent = program.content;

        program.bind();
        this.quadBuffer.bindAttribPointer(programContent.a_pos, 2);
        texture.bind(3);

        gl.uniform1i(programContent.u_screen, 3);
        gl.uniform1f(programContent.u_opacity, opacity);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    swapTextureIds() {

        const tmp = this.offscreenTexture.content;
        this.offscreenTexture.content = this.screenTexture.content;
        this.screenTexture.content = tmp;

    }

    set numParticles(numParticles) {
        const gl = this.gl;

        // we create a square texture where each pixel will hold a particle position encoded as RGBA
        const particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
        this._numParticles = particleRes * particleRes;

        const particleState = new Uint8Array(this._numParticles * 4);
        for (let i = 0; i < particleState.length; i++) {
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }
        // textures to hold the particle state for the current and the next frame
        this.particleStateTexture0 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
        this.particleStateTexture1 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);

        const particleIndices = new Float32Array(this._numParticles);
        for (let i = 0; i < this._numParticles; i++) particleIndices[i] = i;
        this.particleIndexBuffer = util.createBuffer(gl, particleIndices);
    }

}

exports default WindLayer;