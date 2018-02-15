// @flow
"use strict";

/**
 * A `Buffer` class
 */
class Buffer {

    context: GLContext;
    target: GLEnum;
    usage: GLEnum;
    content: GLBuffer;

    /**
     * Constructor
     * @param {GLContext} gl The WebGLRenderingContext object
     * @param {GLEnum} target
     * @param {Float32Array} data
     * @param {GLEnum} usage
     */
    constructor(gl: GLContext, target: GLEnum, data: Float32Array,
        usage: GLEnum) {

        this.context = gl;
        this.target = target;
        this.usage = usage;

        this.content = gl.createBuffer();
        gl.bindBuffer(target, this.content);
        gl.bufferData(target, data, usage);

    }

}

export default Buffer;
