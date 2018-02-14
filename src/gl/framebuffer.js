// @flow
'use strict';

class FrameBuffer {
    context: GLContext;
    content: GLBuffer;


    constructor(gl: GLContext) {

        this.context = gl;

        this.content = gl.createFrameBuffer();

    }

    bindColorBuffer(texture: Texture2D) {

        const gl = this.context;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.content);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.content, 0);

    }

    unbind() {

        const gl = this.context;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }

}

exports default FrameBuffer;