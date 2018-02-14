// @flow
'use strict';

import Buffer from "./buffer"

class StaticDrawArrayBuffer extends Buffer {

    constructor(gl: GLContext, data: Float32Array) {

        super(gl, gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        
    }

    bindAttribPointer(attribute: number, components: number) {

        const gl = this.context;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.content);
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, components, gl.FLOAT, false, 0, 0);

    }

}

exports default StaticDrawArrayBuffer;