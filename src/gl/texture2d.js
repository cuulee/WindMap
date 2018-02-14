// @flow
'use strict';

class Texture2D {
    context: GLContext;
    width: number;
    height: number;
    maxFilter: number;
    minFilter: number;
    wrapSMode: number;
    wrapTMode: number;
    content: GLTexture;


    constructor(gl: GLContext, data: Uint8Array, width: number, height: number, minFilter?: number, 
        maxFilter?: number, wrapSMode?: number, wrapTMode?: number) {

        this.context = gl;
        this.width = width;
        this.height = height;
        this.maxFilter = maxFilter || gl.NEAREST;
        this.minFilter = minFilter || gl.NEAREST;
        this.wrapSMode = wrapSMode || gl.CLAMP_TO_EDGE;
        this.wrapTMode = wrapTMode || gl.CLAMP_TO_EDGE;

        this.content = gl.createTexture();
        this.setTextureData(data);

    }

    setTextureData(data: Uint8Array) {

        gl.bindTexture(gl.TEXTURE_2D, this.content);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapSMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapTMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.maxFilter);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.bindTexture(gl.TEXTURE_2D, null);

    }

    bind(textureUnit: number) {

        const gl = this.context;
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.content);

    }

}

exports default Texture2D;