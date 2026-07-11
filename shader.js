/* ============================================================
   SHADER BACKGROUND — flowing tide/ink gradient (WebGL)
   Full-screen quad, simplex-noise domain warp. Reacts to
   scroll depth (hue drifts adriatic → abyss) and pointer.
   Falls back to the CSS .ambient orbs when WebGL is missing.
   ============================================================ */

(function () {
  const canvas = document.getElementById("gl");
  if (!canvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fallback() {
    canvas.remove();
    document.body.classList.add("no-webgl");
  }

  if (prefersReduced) return fallback();

  const gl = canvas.getContext("webgl", {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return fallback();

  const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

  const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform float u_scroll;
uniform vec2  u_mouse;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float f = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    f += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return f;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);

  float t = u_time * 0.045;

  vec3 q = vec3(p * 0.7, t);
  q.y += u_scroll * 1.4;

  float n1 = fbm(q);
  float n2 = fbm(q * 1.7 + vec3(2.4, -3.7, t * 0.55));
  float flow = fbm(vec3(p * 1.05 + vec2(n1, n2) * 1.3, t * 0.35));
  flow = flow * 0.5 + 0.5;
  float field = n2 * 0.5 + 0.5;

  vec3 ink      = vec3(0.030, 0.048, 0.066);
  vec3 adriatic = vec3(0.004, 0.290, 0.412);
  vec3 abyss    = vec3(0.008, 0.135, 0.200);
  vec3 violet   = vec3(0.13, 0.10, 0.30);
  vec3 foam     = vec3(0.32, 0.68, 0.85);

  vec3 accent = mix(adriatic, abyss, smoothstep(0.15, 0.9, u_scroll));

  vec3 col = ink;
  col = mix(col, violet, smoothstep(0.25, 0.9, field) * 0.55);

  float ridge = pow(smoothstep(0.52, 0.88, flow), 1.7);
  col = mix(col, accent * 0.85, ridge);

  float hot = pow(smoothstep(0.74, 0.96, flow), 2.2);
  col += foam * hot * 0.35;

  vec2 mp = (u_mouse * u_res * 2.0 - u_res) / min(u_res.x, u_res.y);
  col += foam * 0.08 * exp(-length(p - mp) * 2.4);

  float vig = smoothstep(1.6, 0.35, length(p * vec2(0.8, 1.0)));
  col *= mix(0.6, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return fallback();

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uScroll = gl.getUniformLocation(prog, "u_scroll");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  let w = 0, h = 0;
  function resize() {
    // gradient is soft — render at reduced resolution for cheap frames
    const scale = Math.min(1, (window.devicePixelRatio || 1) * 0.5);
    w = Math.max(1, Math.floor(innerWidth * scale));
    h = Math.max(1, Math.floor(innerHeight * scale));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX / innerWidth;
    ty = 1 - e.clientY / innerHeight;
  }, { passive: true });

  let scroll = 0;
  let running = true;
  document.addEventListener("visibilitychange", () => {
    const was = running;
    running = !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  });

  const start = performance.now();
  function frame(now) {
    if (!running) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const target = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));
    scroll += (target - scroll) * 0.06;
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;

    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform1f(uScroll, scroll);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
