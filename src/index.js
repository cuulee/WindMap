// @flow
"use strict";

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
    renderParticlesProgram: Program;
    accumulationProgram: Program;
    updateParticlesProgram: Program;
    quadBuffer: StaticDrawArrayBuffer;
    frameBuffer: FrameBuffer;

    /**
     * Constructor
     *
     * @param {GLContext} gl A WebGLRenderingContext object
     * @example
     *
     */
    constructor(gl: GLContext) {

        this.context = gl;
        this.renderParticlesProgram = glUtils.createProgramFromSources(gl,
            renderParticlesVert, renderParticlesFrag);
        this.accumulationProgram = glUtils.createProgramFromSources(gl,
            quadVert, accumulationFrag);
        this.updateParticlesProgram = glUtils.createProgramFromSources(gl,
            quadVert, updateParticlesFrag);

        this.quadBuffer = new StaticDrawArrayBuffer(
            glUtils.createClipSpaceQuadVertices());
        this.frameBuffer = new FrameBuffer(gl);

        this.resize();

    }

    /**
     * Resize callback
     */
    resize() {

        this.rebuildScreenTextures();

    }

    /**
     * Rebuilds the screen textures
     */
    rebuildScreenTextures() {

        const gl = this.context;
        const emptyBuffer = glUtils.createPixelBuffer(
            gl.canvas.width, gl.canvas.height, 4);

        this.offscreenTexture = new Texture2D(gl, emptyBuffer,
            gl.canvas.width, gl.canvas.height);
        this.screenTexture = new Texture2D(gl, emptyBuffer,
            gl.canvas.width, gl.canvas.height);

    }

    /**
     * Sets the wind data texture
     *
     * @param {Image} data A texture with the wind data encoded
     */
    set windData(data: Image) {

        this.windTexture = new Texture2D(this.context, data,
            this.context.LINEAR);

    }

    /**
     * Sets the noise texture
     *
     * @param {Image} data A noise texture used to generate random positions
     */
    set noiseData(data: Image) {

        this.noiseTexture = new Texture2D(this.context, data,
            this.context.NEAREST);

    }

    /**
     * Renders the wind layer
     */
    render() {

        this.setup();
        this.bindTextures();
        this.drawLayer();
        this.updateParticles();

    }

    /**
     * Setups the WebGL status
     */
    setup() {

        const gl = this.context;
        gl.disable(GL.DEPTH_TEST);
        gl.disable(GL.STENCIL_TEST);

    }

    /**
     * Binds the textures used by the shaders
     */
    bindTextures() {

        this.windTexture.bind(0);
        this.particleStateTexture.bind(1);
        this.noiseTexture.bind(2);

    }

    /**
     * Draws the layer
     */
    drawLayer() {

        draw2OffscreenBuffer();
        blendOffscreenBuffer2Screen();
        swapTextureIds();

    }

    /**
     * Draws the particles to the offscreen buffer
     */
    draw2OffscreenBuffer() {

        const gl = this.context;

        this.frameBuffer.bindColorBuffer(this.screenTexture);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        this.drawPreviousFrame();
        this.drawParticles();

        this.frameBuffer.unbind();

    }

    /**
     * Blends the offscreen buffer to the screen
     */
    blendOffscreenBuffer2Screen() {

        const gl = this.context;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.drawTexture(this.screenTexture, 1.0);
        gl.disable(gl.BLEND);

    }

    /**
     * Renders the previous frame texture to the screen
     */
    drawPreviousFrame() {

        this.drawTexture(this.offscreenTexture, this.fadeOpacity);

    }

    /**
     * Renders the particles
     */
    drawParticles() {

        const gl = this.gl;
        const program = this.renderParticlesProgram;

        program.bind();
        this.particleIndexBuffer.bindAttribPointer(program.a_index, 1);
        this.colorRampTexture.bind(2);

        gl.uniform1i(program.u_wind, 0);
        gl.uniform1i(program.u_particles, 1);
        gl.uniform1i(program.u_color_ramp, 2);
        gl.uniform1f(program.u_particles_res,
            this.particleStateResolution);
        gl.uniform2f(program.u_wind_min, this.windData.uMin,
            this.windData.vMin);
        gl.uniform2f(program.u_wind_max, this.windData.uMax,
            this.windData.vMax);

        gl.drawArrays(gl.POINTS, 0, this._numParticles);

    }

    /**
     * Renders a full screen quad with a texture with opacity
     * @param {Texture} texture The texture to draw
     * @param {number} opacity The opacity of the quad
     */
    drawTexture(texture: Texture, opacity: number) {

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

    /**
     * Swaps the offscreen and screen buffer
     */
    swapTextureIds() {

        const tmp = this.offscreenTexture.content;
        this.offscreenTexture.content = this.screenTexture.content;
        this.screenTexture.content = tmp;

    }

    /**
     * Sets the number of particles used in the layer
     * @param {number} numParticles The number of particles
     */
    set numParticles(numParticles) {

        const gl = this.gl;

        // we create a square texture where each pixel will hold
        // a particle position encoded as RGBA
        const particleRes = this.particleStateResolution =
            Math.ceil(Math.sqrt(numParticles));
        this._numParticles = particleRes * particleRes;

        const particleState = new Uint8Array(this._numParticles * 4);
        for (let i = 0; i < particleState.length; i++) {

            particleState[i] = Math.floor(Math.random() * 256);
            // randomize the initial particle positions

        }
        // textures to hold the particle state for the current an
        // the next frame
        this.particleStateTexture0 = util.createTexture(gl, gl.NEAREST,
            particleState, particleRes, particleRes);
        this.particleStateTexture1 = util.createTexture(gl, gl.NEAREST,
            particleState, particleRes, particleRes);

        const particleIndices = new Float32Array(this._numParticles);
        for (let i = 0; i < this._numParticles; i++) particleIndices[i] = i;
        this.particleIndexBuffer = util.createBuffer(gl, particleIndices);

    }

}

export default WindLayer;
