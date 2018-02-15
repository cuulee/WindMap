// @flow
"use strict";

class Program {

    context: GLContext;
    content: GLProgram;

    constructor(gl: GLContext, vertexShader: VertexShader,
        fragmentShader: FragmentShader) {

        this.context = gl;
        this.content = gl.createProgram();

        gl.attachShader(this.content, vertexShader.binaryData);
        gl.attachShader(this.content, fragmentShader.binaryData);
        gl.linkProgram(this.content);

        const ok = gl.getProgramParameter(this.content, gl.LINK_STATUS);
        if (!ok) {

            const errorText = gl.getProgramInfoLog(this.content);
            gl.deleteProgram(this.content);
            this.content = null;

            throw new Exception(errorText);

        }

    }

    bind() {

        const gl = this.context;
        gl.useProgram(this.content.program);

    }

}

export default Program;
