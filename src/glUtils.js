"use strict";

import VertexShader from "./vertexShader"
import FragmentShader from "./fragmentShader"
import Program from "./program"

class glUtils {

    static createProgramFromSources(gl: GLContext, vertexShaderSrc: string, fragmentShaderSrc: string) {

        const vertexShader = new VertexShader(gl, vertexShaderSrc);
        const fragmentShader = new FragmentShader(gl, fragmentShaderSrc);

        return new Program(gl, vertexShader, fragmentShader);

    }

    static createClipSpaceQuadVertices() {

        return new Float32Array([-1, 1,     // |--/
                                1, 1,       // | /
                                -1, -1,     // |/
                                1, 1,       //   /|
                                1, -1,      //  / |
                                -1, -1]);   // /__|

    }

    static createRGBAPixelBuffer(width: number, height: number) {

        return glUtils.createPixelBuffer(width, height, 4);

    }

    static createPixelBuffer(width: number, height: number, components: number) {

        return new Uint8Array(width * height * components)

    }

}

exports default glUtils;