// @flow
'use strict';

class Buffer {
    context: GLContext;
    target: number;
    usage: number;
    content: GLBuffer;


    constructor(gl: GLContext, target: number, data: Float32Array, usage: number) {

        this.context = gl;
        this.target = target;
        this.usage = usage;

        this.content = gl.createBuffer();
        gl.bindBuffer(target, this.content);
        gl.bufferData(target, data, usage);

    }

}

exports default Buffer;