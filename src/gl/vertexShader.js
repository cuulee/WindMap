// @flow
'use strict';

import Shader from "./shader"

class VertexShader extends Shader {

    constructor(gl: GLContext, shaderSource: string) {

        super(gl, shaderSource);
        
    }

    getShaderType() {

        return this.context.VERTEX_SHADER;

    }

}

exports default Shader;