"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-bleed WebGL2 shader hero (adapted from Matthias Hurrle's @atzedent
 * shader). `ShaderBackground` is the canvas the page's space backdrop draws
 * with.
 *
 * The shader has been retinted to the site palette and extended with a
 * depth-layered starfield plus a few uniforms so callers (e.g. a scroll
 * timeline) can fly the camera forward through it, pan it sideways, and
 * bend its stars around a black hole.
 */

export type ShaderUniforms = {
  /** Forward distance flown through the star layers (1 = one full layer). */
  travel: number;
  /** 0..1 — how far stars are smeared into radial warp streaks. */
  streak: number;
  /** 0..1 — pulls the light field toward the viewer. */
  zoom: number;
  /** 0..1 — fades the clouds, lights and stars so content can sit on top. */
  dim: number;
  /** 0..1 — caps the brightness of the drifting light cores (keeping their
   *  hue), so text can sit over them without the clouds dimming further. */
  soften: number;
  /** Sideways camera travel, in screen widths; nearer star layers slide
   *  further, so the sky has depth. */
  pan: number;
  /** A black hole: [x, y (viewport fraction, y down), horizon radius (in
   *  viewport heights), 0..1 strength]. The stars bend around it and its
   *  horizon is black. */
  hole: [number, number, number, number];
};

const DEFAULT_UNIFORMS: ShaderUniforms = {
  travel: 0,
  streak: 0,
  zoom: 0,
  dim: 0,
  soften: 0,
  pan: 0,
  hole: [0.5, 0.5, 0, 0],
};

const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);

type UniformName = "resolution" | "time" | keyof ShaderUniforms;
const UNIFORM_NAMES: UniformName[] = ["resolution", "time", "travel", "streak", "zoom", "dim", "soften", "pan", "hole"];

class ShaderRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private uniforms: Record<UniformName, WebGLUniformLocation | null>;

  constructor(private canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, fragmentSrc: string) {
    this.gl = gl;
    const vs = this.compile(gl.VERTEX_SHADER, vertexSrc);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragmentSrc);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
    }
    // Shaders can be flagged for deletion once linked; the program keeps them.
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(this.program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = Object.fromEntries(
      UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(this.program, name)]),
    ) as Record<UniformName, WebGLUniformLocation | null>;
  }

  private compile(type: number, source: string) {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  render(seconds: number, u: ShaderUniforms) {
    const gl = this.gl;
    const { width, height } = this.canvas;

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    gl.uniform2f(this.uniforms.resolution, width, height);
    gl.uniform1f(this.uniforms.time, seconds);
    gl.uniform1f(this.uniforms.travel, u.travel);
    gl.uniform1f(this.uniforms.streak, u.streak);
    gl.uniform1f(this.uniforms.zoom, u.zoom);
    gl.uniform1f(this.uniforms.dim, u.dim);
    gl.uniform1f(this.uniforms.soften, u.soften);
    gl.uniform1f(this.uniforms.pan, u.pan);
    gl.uniform4fv(this.uniforms.hole, u.hole);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}

/** Read once per frame (with that frame's rAF timestamp) — returns
 *  whichever uniforms it wants to drive. */
export type ShaderUniformSource = (now: number) => Partial<ShaderUniforms>;

type ShaderBackgroundProps = {
  className?: string;
  getUniforms?: ShaderUniformSource;
};

/**
 * Renders the shader into a canvas that fills its positioned parent. Pauses
 * while offscreen, and freezes time under prefers-reduced-motion (only
 * re-rendering when the caller's uniforms change). If WebGL2 is unavailable
 * the canvas stays transparent, so whatever sits behind it shows through.
 */
export function ShaderBackground({ className, getUniforms }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getUniformsRef = useRef(getUniforms);

  useEffect(() => {
    getUniformsRef.current = getUniforms;
  }, [getUniforms]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2");
    if (!canvas || !gl) return;

    const renderer = new ShaderRenderer(canvas, gl, defaultShaderSource);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let running = false;
    let lastKey = "";

    const resize = () => {
      // Half-res on retina: the fragment shader is heavy and soft by nature.
      const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      lastKey = "";
    };

    const loop = (now: number) => {
      const u = { ...DEFAULT_UNIFORMS, ...getUniformsRef.current?.(now) };
      const seconds = reduceMotion ? 0 : now * 1e-3;

      const key = reduceMotion ? JSON.stringify(u) : "";
      if (!reduceMotion || key !== lastKey) {
        renderer.render(seconds, u);
        lastKey = key;
      }
      if (running) rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    resize();
    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(([entry]) =>
      entry.isIntersecting ? start() : stop(),
    );
    observer.observe(canvas);

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden
    />
  );
}

const defaultShaderSource = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*
*	To explore strange new worlds, to seek out new life
*	and new civilizations, to boldly go where no man has
*	gone before.
*
* Retinted to the site palette; starfield, warp, pan and black hole added.
*/
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform float travel;
uniform float streak;
uniform float zoom;
uniform float dim;
uniform float soften;
uniform float pan;
uniform vec4 hole;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
const vec3 C1=vec3(.486,.549,1.);  // #7c8cff
const vec3 C2=vec3(1.,.541,.361);  // #ff8a5c
const vec3 C3=vec3(.298,.839,.69); // #4cd6b0
vec3 palette(float i) {
  float k=mod(i,3.);
  return k<1.?C1:k<2.?C2:C3;
}
// A viewport fraction (y down) in shader space.
vec2 toUV(vec2 f) {
  return vec2(f.x-.5,.5-f.y)*R/MN;
}

// Returns a pseudo random number for a given point (white noise)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
// Returns a pseudo random number for a given point (value noise)
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float
  a=rnd(i),
  b=rnd(i+vec2(1,0)),
  c=rnd(i+vec2(0,1)),
  d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
// Returns a pseudo random number for a given point (fractal noise)
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}
float clouds(vec2 p) {
	float d=1., t=.0;
	for (float i=.0; i<3.; i++) {
		float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
		t=mix(t,d,a);
		d=a;
		p*=2./(i+1.);
	}
	return t;
}
// One layer of stars on a jittered grid; ~1 in 4 cells holds a star.
vec3 starLayer(vec2 p, float seed) {
  vec2 id=floor(p), gv=fract(p)-.5;
  float n=rnd(id+seed);
  if (n<.75) return vec3(0);
  vec2 off=vec2(rnd(id+seed+.1),rnd(id+seed+.2))-.5;
  float d=length(gv-off*.6);
  float m=.01/max(d,1e-3)*(1.-smoothstep(.0,.15,d));
  return m*mix(vec3(1),palette(floor(n*40.)),.45);
}
// Depth-layered starfield, sampled at w[k] (weighted m[k]) for each of its
// four streak samples. Advancing travel moves every layer toward the camera
// (stars spread out from the center).
vec3 stars(vec2 w[4], float m[4]) {
  vec3 col=vec3(0);
  for (int j=0; j<6; j++) {
    float i=float(j)/6.;
    float depth=fract(i+travel+T*.01);
    float scale=mix(18.,.6,depth);
    float fade=depth*(1.-smoothstep(.85,1.,depth));
    vec3 s=vec3(0);
    for (int k=0; k<4; k++) {
      s+=starLayer(w[k]*scale+vec2(pan*8.,0),i*97.3)*m[k];
    }
    col+=s*.25*(1.+2.5*streak)*fade;
  }
  return col;
}
// Where the stars are sampled for screen point p. The warp streak resamples
// at slightly nearer depths so stars smear outward along their flight path.
// Near the black hole, light bends: each point samples the sky pushed
// outward from the hole (more strongly closer in), so stars smear into arcs
// around it and the sky right behind it shows as a ring.
void starSamples(vec2 p, out vec2 w[4], out float m[4]) {
  vec2 d=p-toUV(hole.xy);
  float rh=hole.z*R.y/MN, r=max(length(d),1e-4);
  vec2 bend=d/r*hole.w*rh*rh*2./r;
  float shadow=1.-hole.w*smoothstep(rh*1.05,rh*.95,r);
  for (int k=0; k<4; k++) {
    w[k]=(p+bend)*(1.-float(k)*.07*streak);
    m[k]=shadow;
  }
}
// The black hole's horizon swallows whatever light is behind it, rimmed by
// a thin, bright photon ring.
vec3 holeLight(vec3 col, vec2 p) {
  if (hole.w<=0.) return col;
  float rh=hole.z*R.y/MN, r=length(p-toUV(hole.xy));
  col*=1.-hole.w*smoothstep(rh*1.02,rh*.98,r);
  float ring=exp(-pow((r-rh*1.04)/(rh*.03+.001),2.));
  return col+hole.w*ring*vec3(1.,.9,.75)*.8;
}
void main(void) {
	vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1),sp=uv;
	vec3 col=vec3(0);
	float bg=clouds(vec2(st.x+T*.5,-st.y));
	uv*=1.-.3*(sin(T*.2)*.5+.5);
	uv/=1.+zoom*2.5;
	for (float i=1.; i<12.; i++) {
		uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
		vec2 p=uv;
		float d=length(p);
		col+=.0022/d*palette(i);
		float b=noise(i+p+bg*1.731);
		col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
		col=mix(col,vec3(bg*.09,bg*.1,bg*.24),d);
	}
	// Clouds stay below ~.3, so capping the brightest channel only clips
	// the hot light cores; scaling all channels keeps their hue.
	float peak=max(col.r,max(col.g,col.b));
	col*=min(1.,mix(64.,.3,soften)/max(peak,1e-3));
	col*=1.-.75*dim;
	vec2 w[4];
	float m[4];
	starSamples(sp,w,m);
	col+=stars(w,m)*(1.-dim);
	col=holeLight(col,sp);
	O=vec4(col,1);
}`;
