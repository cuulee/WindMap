// @flow
'use strict';

class Shader {
    context: GLContext;
    source: String;
    content: GLShader;

    constructor(gl: GLContext, shaderSource: string) {

        this.context = gl;
        this.source = shaderSource;
        this.content = null;

    }

    get binaryData() {

        if (!this.content) {

            this.content = this.compile();

        }

        return this.content;

    }

    compile() {

        const gl = this.context;
        this.content = gl.createShader(this.getShaderType());
	    gl.shaderSource(this.content, this.source);
	    gl.compileShader(this.content);

	    const ok = gl.getShaderParameter(this.content, gl.COMPILE_STATUS);
        if(!ok) {

            const errorText = gl.getShaderInfoLog(this.content);
            gl.deleteShader(this.content);
            this.content = null;

            throw new Exception(errorText);

        }

    }

    getShaderType() {

        throw new Exception("Subclass should implement the getShaderType method")

    }

}

exports default Shader;