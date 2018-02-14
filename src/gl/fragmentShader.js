// @flow
'use strict';

import Shader from "./shader"

class FragmentShader extends Shader {

    constructor(gl: GLContext, shaderSource: string) {

        super(gl, shaderSource);
        
    }

    getShaderType() {

        return this.context.FRAGMENT_SHADER;

    }

}

exports default Shader;