// @flow
"use strict";

import VertexShader from "./vertexShader";
import FragmentShader from "./fragmentShader";
import Program from "./gl/program";

/**
 * The `glUtils` class contains useful static functions
 */
class glUtils {

	/**
	 * Creates a `Program` object from sources
	 * @param {GLContext} gl A WebGLRenderingContext object
	 * @param {string} vertexShaderSrc The vertex shader source
	 * @param {string} fragmentShaderSrc The fragment shader source
	 * @return {Program} The Program object
	 */
	static createProgramFromSources(gl: GLContext, vertexShaderSrc: string,
		fragmentShaderSrc: string) {

		const vertexShader = new VertexShader(gl, vertexShaderSrc);
		const fragmentShader = new FragmentShader(gl, fragmentShaderSrc);

		return new Program(gl, vertexShader, fragmentShader);

	}

	/**
	 * Creates a float array with the coordinates of a clip space quad
	 * @return {Float32Array} The vertices array
	 */
	static createClipSpaceQuadVertices() {

		return new Float32Array([-1, 1,		// |--/
								1, 1,		// | /
								-1, -1,		// |/
								1, 1,		//   /|
								1, -1,		//  / |
								-1, -1]);	// /__|

	}

	/**
	 * Creates an empty RGBA pixel buffer
	 * @param {number} width The pixel buffer width
	 * @param {number} height The pixel buffer height
	 * @return {Uint8Array} The pixels array
	 */
	static createRGBAPixelBuffer(width: number, height: number) {

		return glUtils.createPixelBuffer(width, height, 4);

	}

	/**
	 * Creates an empty pixel buffer
	 * @param {number} width The pixel buffer width
	 * @param {number} height The pixel buffer height
	 * @param {number} components The per pixel components number
	 * @return {Uint8Array} The pixels array
	 */
	static createPixelBuffer(width: number, height: number, components: number) {

		return new Uint8Array(width * height * components);

	}

}

export default glUtils;
