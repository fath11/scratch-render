/* eslint-disable */
const twgl = require('twgl.js');
const GandiShader = require('./GandiShader');
class GandiShadow extends GandiShader {
    constructor (gl, bufferInfo, render){
        super(gl, bufferInfo, render, GandiShadow.vertexShader, GandiShadow.fragmentShader);
        this.uniforms = GandiShadow.uniforms;

        this.damp = .95;

    }

    static get uniforms (){
        return {
            byp: 1,
            // tOld: 0,
            // tNew: 0,
            damp: .9,
        };
    }

    static get vertexShader (){
        return /* glsl */`
varying vec2 vUv;
attribute vec2 a_position;
attribute vec2 uv;
attribute vec2 a_texCoord;
void main() {
  vUv = uv;
  vec2 fixedPosition = a_position;
  fixedPosition.y = -fixedPosition.y;
  gl_Position = vec4(-fixedPosition * 2.0, 0.0, 1.0);
}
`;
    }

    static get fragmentShader () {
        return /* glsl */`
#ifdef GL_ES
precision mediump float;
#endif
uniform int byp;
uniform float damp;
uniform sampler2D tOld;
uniform sampler2D tNew;
varying vec2 vUv;
vec4 when_gt( vec4 x, float y ) {
  return max( sign( x - y ), 0.0 );
}
void main() {
  if(byp < 1) {
    vec2 uvOld = vUv;
    uvOld.y = - uvOld.y;
    vec4 texelOld = texture2D( tOld, uvOld );
    vec4 texelNew = texture2D( tNew, vUv );
    texelOld *= damp * when_gt( texelOld, 0.1 );
    gl_FragColor = max(texelNew, texelOld);
  }
  else{
    gl_FragColor = texture2D( tNew, vUv );
  }
}
`;
    }

    render (){
        if(this.bypass > 0 || !this.trySetupProgram()){
            this.dirty = false;
            return false;
        }

        if (this.tOld === undefined) {
          this.tOld = twgl.createTexture(this._gl, {
            // target: this._gl.TEXTURE_2D,
            src: this._gl.canvas
          });
        }
        twgl.setUniforms(this._program, {
            tNew: this._render.fbo.attachments[0],
            tOld: this.tOld,
            damp: this.damp,
            byp: this.bypass,
            // defaultColor: [1.0, 0.0, 1.0],
        });

        twgl.drawBufferInfo(this._gl, this._bufferInfo);
        this._gl.deleteTexture(this.tOld);

        this.tOld = twgl.createTexture(this._gl, {
          src: this._gl.canvas
        });
        this.dirty = true;
        return true;
    }
}
module.exports = GandiShadow;
