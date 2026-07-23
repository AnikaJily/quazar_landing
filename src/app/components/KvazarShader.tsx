import { useEffect, useRef } from "react";
import { SHADER_BEAM } from "./kvazarBeam";

// ---- GLSL sources ----

const VS_QUAD = `#version 300 es
in vec2 aPos;
out vec2 vTextureCoord;
void main() {
  vTextureCoord = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FS_REPLICATE = `#version 300 es
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
out vec4 fragColor;
void main() {
  vec2 uv = vTextureCoord;
  float rotation = -0.25 * 2.0 * 3.141592653;
  float aspectRatio = uResolution.x / uResolution.y;
  float repeatSpacing = 1.8 * 0.35 * mix(1.0, aspectRatio, 0.5);
  float time = (uTime * 0.025) / (repeatSpacing + 0.001);
  vec2 dir = vec2(sin(rotation), cos(rotation));
  float baseOffset = fract(time) - 0.5 * 16.0;
  vec4 col = vec4(0);
  for (int i = 0; i < 16; ++i) {
    float offset = repeatSpacing * (float(i) + baseOffset);
    vec2 sampleUV = uv + offset * dir;
    if (any(lessThan(sampleUV, vec2(0))) || any(greaterThan(sampleUV, vec2(1)))) continue;
    col += texture(uTexture, sampleUV) * (1.0 - col.a);
    if (col.a >= 0.999) break;
  }
  fragColor = col;
}`;

const FS_SHATTER = `#version 300 es
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
out vec4 fragColor;
const float PI = 3.14159265359;
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float easeInOutCirc(float t) {
  return t < 0.5
    ? (1.0 - sqrt(1.0 - 4.0 * t * t)) * 0.5
    : (sqrt(-((2.0 * t) - 3.0) * ((2.0 * t) - 1.0)) + 1.0) * 0.5;
}
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
vec2 voronoiNoise(vec2 st) {
  vec2 i_st = floor(st);
  vec2 f_st = fract(st);
  float nearestDist = 15.0;
  vec2 nearestPoint = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 neighbor = vec2(float(i), float(j));
      vec2 p = hash2(i_st + neighbor);
      p = 0.5 + 0.5 * sin(5.0 + uTime * 0.2 + 6.2831 * p);
      vec2 diff = neighbor + p - f_st;
      float dist = dot(diff, diff);
      if (dist < nearestDist) { nearestDist = dist; nearestPoint = p; }
    }
  }
  return nearestPoint;
}
vec2 voronoiFBM(vec2 st) {
  vec2 value = vec2(0.0);
  vec2 shift = vec2(100.0);
  float xp = sqrt(2.0);
  mat2 r = rot(0.5);
  for (int i = 0; i < 8; i++) {
    value += voronoiNoise(st);
    st = st * xp + shift;
    st = r * st;
  }
  return value / 8.0;
}
vec2 distortUV(vec2 uv) {
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 pos = vec2(0.5, 0.48014727);
  float d = easeInOutCirc(max(0.0,
    1.0 - distance(uv * vec2(aspectRatio, 1.0), pos * vec2(aspectRatio, 1.0)) * 4.0 * 1.0));
  if (d <= 0.001) return uv;
  vec2 skew = mix(vec2(1.0), vec2(1.0, 0.0), 0.4);
  vec2 st = (uv - pos) * vec2(aspectRatio, 1.0) * 50.0 * 0.568;
  st = st * rot(0.1269 * 2.0 * PI) * skew;
  vec2 m = voronoiFBM(st);
  vec2 offset = (m * 0.2 * 0.5 * 2.0) - (0.5 * 0.2);
  return uv + offset * d;
}
void main() {
  vec2 uv = distortUV(vTextureCoord);
  fragColor = texture(uTexture, uv);
}`;

const FS_BEAM = `#version 300 es
precision highp float;
precision highp int;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
out vec4 fragColor;
const float TWO_PI = 6.28318530718;
uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}
float randFibo(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = pcg2d(v);
  return float(v.x ^ v.y) / float(0xffffffffu);
}
float deband() { return (randFibo(gl_FragCoord.xy) - 0.5) / 255.0; }
vec3 tanhTonemap(vec3 x) {
  x = clamp(x, -40.0, 40.0);
  return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
}
float drawLine(vec2 uv, vec2 center, float scale, float angle, float time, float phaseVal, float thickness) {
  float radAngle = -angle * TWO_PI;
  float phase = fract(time * 0.01 + phaseVal) * (3.0 * max(1.0, scale)) - (1.5 * max(1.0, scale));
  vec2 direction = vec2(cos(radAngle), sin(radAngle));
  vec2 centerToPoint = uv - center;
  float projection = dot(centerToPoint, direction);
  float distToLine = length(centerToPoint - projection * direction);
  float lineRadius = thickness * 0.25;
  float brightness = lineRadius / max(0.0001, 1.0 - smoothstep(0.4, 0.0, distToLine + 0.02));
  float glow = smoothstep(scale, 0.0, abs(projection - phase));
  return brightness * (1.0 - distToLine) * (1.0 - distToLine) * glow;
}
void main() {
  vec2 uv = vTextureCoord;
  vec4 bg = texture(uTexture, uv);
  float beam = drawLine(uv, vec2(${SHADER_BEAM.cx}, ${SHADER_BEAM.cy}), ${SHADER_BEAM.scale}, ${SHADER_BEAM.angle}, uTime, 0.495, 0.29);
  vec3 beamColor = beam * vec3(0.592156, 0.654902, 0.996078);
  vec3 result = tanhTonemap(beamColor) + deband();
  vec3 blended = result + bg.rgb;
  fragColor = vec4(mix(bg.rgb, blended, 0.93), 1.0);
}`;

const FS_GRAIN = `#version 300 es
precision highp float;
precision highp int;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
out vec4 fragColor;
uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}
float randFibo(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = pcg2d(v);
  return float(v.x ^ v.y) / float(0xffffffffu);
}
vec3 overlay(vec3 src, vec3 dst) {
  return vec3(
    src.x <= 0.5 ? 1.0 - (1.0 - dst.x) / (2.0 * src.x) : dst.x / (2.0 * (1.0 - src.x)),
    src.y <= 0.5 ? 1.0 - (1.0 - dst.y) / (2.0 * src.y) : dst.y / (2.0 * (1.0 - src.y)),
    src.z <= 0.5 ? 1.0 - (1.0 - dst.z) / (2.0 * src.z) : dst.z / (2.0 * (1.0 - src.z))
  );
}
void main() {
  vec2 uv = vTextureCoord;
  vec4 color = texture(uTexture, uv);
  vec2 st = uv * uResolution;
  float delta = fract(floor(uTime) / 20.0);
  vec3 g = vec3(randFibo(st + vec2(delta)));
  color.rgb = mix(color.rgb, overlay(g, color.rgb), 0.02);
  fragColor = color;
}`;

const FS_VIGNETTE = `#version 300 es
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform vec2 uResolution;
out vec4 fragColor;
const float TAU = 6.28318530718;
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
void main() {
  vec2 uv = vTextureCoord;
  vec4 color = texture(uTexture, uv);
  vec2 aspectRatio = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 skew = vec2(0.0, 1.0);
  float halfRadius = 0.53 * 0.5;
  float innerEdge = halfRadius * 0.5;
  float outerEdge = halfRadius * 1.5;
  vec2 pos = vec2(0.5);
  vec2 scaledUV = uv * aspectRatio * rot(0.405 * TAU) * skew;
  vec2 scaledPos = pos * aspectRatio * rot(0.405 * TAU) * skew;
  float radius = distance(scaledUV, scaledPos);
  float falloff = smoothstep(innerEdge, outerEdge, radius);
  vec3 darkened = mix(color.rgb, vec3(0.0), falloff * 0.53);
  fragColor = vec4(darkened, 1.0);
}`;

// ---- WebGL helpers ----

type FBO = { fbo: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error("shader error:", gl.getShaderInfoLog(s));
  return s;
}

function makeProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error("program error:", gl.getProgramInfoLog(p));
  return p;
}

function makeFBO(gl: WebGL2RenderingContext, w: number, h: number): FBO {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, w, h };
}

function deleteFBO(gl: WebGL2RenderingContext, f: FBO) {
  gl.deleteFramebuffer(f.fbo);
  gl.deleteTexture(f.tex);
}

// ---- Component ----

const SHADER_FONT_FAMILY = "Manrope, sans-serif";
const SHADER_FONT_WEIGHT = 600;

export function KvazarShader({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const DPR = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // quad VAO
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // programs
    const progReplicate = makeProgram(gl, VS_QUAD, FS_REPLICATE);
    const progShatter   = makeProgram(gl, VS_QUAD, FS_SHATTER);
    const progBeam      = makeProgram(gl, VS_QUAD, FS_BEAM);
    const progGrain     = makeProgram(gl, VS_QUAD, FS_GRAIN);
    const progVignette  = makeProgram(gl, VS_QUAD, FS_VIGNETTE);

    const uLocs = (p: WebGLProgram) => ({
      uTexture:    gl.getUniformLocation(p, "uTexture"),
      uTime:       gl.getUniformLocation(p, "uTime"),
      uResolution: gl.getUniformLocation(p, "uResolution"),
    });
    const U = new Map([
      [progReplicate, uLocs(progReplicate)],
      [progShatter,   uLocs(progShatter)],
      [progBeam,      uLocs(progBeam)],
      [progGrain,     uLocs(progGrain)],
      [progVignette,  uLocs(progVignette)],
    ]);

    // text texture via Canvas2D
    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d")!;
    const textTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    function buildTextTexture() {
      const w = canvas.width, h = canvas.height;
      textCanvas.width = w;
      textCanvas.height = h;
      textCtx.clearRect(0, 0, w, h);
      const fontPx = Math.round(0.06 * w);
      textCtx.fillStyle = "#9D9D9D";
      textCtx.font = `${SHADER_FONT_WEIGHT} ${fontPx}px ${SHADER_FONT_FAMILY}`;
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      if ("letterSpacing" in textCtx)
        (textCtx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${-0.028 * fontPx}px`;
      textCtx.fillText("KVAZAR", 0.5083 * w, 0.5218 * h);
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    // FBOs
    let fboA: FBO, fboB: FBO, fboC: FBO;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.floor(rect.width  * DPR);
      canvas.height = Math.floor(rect.height * DPR);
      if (fboA) deleteFBO(gl, fboA);
      if (fboB) deleteFBO(gl, fboB);
      if (fboC) deleteFBO(gl, fboC);
      fboA = makeFBO(gl, canvas.width, canvas.height);
      fboB = makeFBO(gl, canvas.width, canvas.height);
      fboC = makeFBO(gl, canvas.width, canvas.height);
      buildTextTexture();
    }
    resize();
    void document.fonts.load(`${SHADER_FONT_WEIGHT} 16px ${SHADER_FONT_FAMILY}`).then(buildTextTexture);
    document.fonts.ready.then(buildTextTexture);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // render pass
    function pass(
      prog: WebGLProgram,
      inputTex: WebGLTexture,
      output: FBO | null,
      time: number,
    ) {
      if (output) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, output.fbo);
        gl.viewport(0, 0, output.w, output.h);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTex);
      const u = U.get(prog)!;
      if (u.uTexture)    gl.uniform1i(u.uTexture, 0);
      if (u.uResolution) gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      if (u.uTime)       gl.uniform1f(u.uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

  
    const SPEEDS = { replicate: 0.08, shatter: 1.0, beam: 0, grain: 0 };
    const t0 = performance.now();
    let rafId = 0;
    let inView = false;
    let tabVisible = document.visibilityState === "visible";

    function render() {
      const t = (performance.now() - t0) / 1000 * 60; // UnicornStudio time unit
      pass(progReplicate, textTex, fboA, t * SPEEDS.replicate);
      pass(progShatter, fboA.tex, fboB, t * SPEEDS.shatter);
      pass(progBeam, fboB.tex, fboC, t * SPEEDS.beam);
      pass(progGrain, fboC.tex, fboA, t * SPEEDS.grain);
      pass(progVignette, fboA.tex, null, 0);
    }

    function loop() {
      render();
      rafId = requestAnimationFrame(loop);
    }

    function updateLoop() {
      cancelAnimationFrame(rafId);
      rafId = 0;
      if (!inView || !tabVisible) return;
      render();
      if (!reducedMotion) rafId = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        updateLoop();
      },
      { rootMargin: "80px", threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      updateLoop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      deleteFBO(gl, fboA);
      deleteFBO(gl, fboB);
      deleteFBO(gl, fboC);
      gl.deleteTexture(textTex);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      [progReplicate, progShatter, progBeam, progGrain, progVignette].forEach(p => gl.deleteProgram(p));
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
