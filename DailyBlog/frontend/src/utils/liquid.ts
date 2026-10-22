/** Decorative ray-marched metaballs. This is a visual fluid, not a Navier–Stokes solver. */
export function mountLiquid(canvas: HTMLCanvasElement): () => void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return () => {};
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
    premultipliedAlpha: false,
  });
  if (!gl) {
    canvas.dataset.renderState = "fallback";
    canvas.classList.add("is-unavailable");
    return () => {};
  }
  const vertex = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const fragment = `precision mediump float;
  uniform vec2 resolution;uniform float time;uniform vec2 pointer;uniform float speed;
  float smoothUnion(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
  float scene(vec3 p){
    float t=time*.4;
    vec3 c1=vec3(-.68+sin(t*.8)*.24,.34+cos(t*.9)*.3,0.);
    vec3 c2=vec3(.67+sin(t*.65)*.25,-.36+cos(t*.7)*.3,.15);
    vec3 c3=vec3(sin(t*.85)*.6,cos(t*.7)*.58,-.13);
    float d=length(p-c1)-.43;
    d=smoothUnion(d,length(p-c2)-.38,.32);
    d=smoothUnion(d,length(p-c3)-.34,.34);
    d=smoothUnion(d,length(p-vec3(pointer*.88,.28))-(.17+min(speed*.12,.08)),.3);
    return d;
  }
  vec3 environment(vec3 n){float k=n.y*.5+.5;vec3 c=mix(vec3(.75,.49,.86),vec3(.49,.79,.98),k);c=mix(c,vec3(.96,.98,1.),smoothstep(.25,.8,n.y)*.7);return c;}
  void main(){vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;vec3 ro=vec3(0.,0.,3.7);vec3 rd=normalize(vec3(uv,-2.5));float travel=0.;vec3 p=ro;float hit=0.;
  for(int i=0;i<48;i++){p=ro+rd*travel;float d=scene(p);if(d<.003){hit=1.;break;}travel+=d*.82;if(travel>7.)break;}
  if(hit<.5){gl_FragColor=vec4(0.);return;}
  vec2 e=vec2(.006,0.);vec3 n=normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
  vec3 light=normalize(vec3(-.7,1.,2.));float diffuse=max(dot(n,light),0.);float fresnel=pow(1.-max(dot(n,-rd),0.),2.6);float spec=pow(max(dot(reflect(-light,n),-rd),0.),48.);
  vec3 reflected=environment(reflect(rd,n));vec3 color=mix(vec3(.64,.8,.94),reflected,.55);color+=vec3(.14,.1,.2)*diffuse;color=mix(color,vec3(.96,.78,.97),fresnel*.7);color+=spec*.85;
  float band=pow(max(0.,sin(n.y*4.4+n.x*1.5)),18.);color+=vec3(.7,.85,1.)*band*.35;
  gl_FragColor=vec4(color,.56+fresnel*.35+spec*.1);}`;
  function shader(type: number, source: string) {
    const value = gl!.createShader(type)!;
    gl!.shaderSource(value, source);
    gl!.compileShader(value);
    if (!gl!.getShaderParameter(value, gl!.COMPILE_STATUS)) {
      gl!.deleteShader(value);
      return null;
    }
    return value;
  }
  const vs = shader(gl.VERTEX_SHADER, vertex),
    fs = shader(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    canvas.classList.add("is-unavailable");
    return () => {};
  }
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return () => {};
  }
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  const attribute = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const locations = {
    resolution: gl.getUniformLocation(program, "resolution"),
    time: gl.getUniformLocation(program, "time"),
    pointer: gl.getUniformLocation(program, "pointer"),
    speed: gl.getUniformLocation(program, "speed"),
  };
  let frame = 0,
    lastFrame = 0,
    active = true,
    disposed = false,
    contextLost = false;
  let x = 0.4,
    y = 0.1,
    targetX = 0.4,
    targetY = 0.1,
    vx = 0,
    vy = 0;
  const start = performance.now();
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const scale =
      Math.min(devicePixelRatio || 1, 1.25) * (innerWidth < 760 ? 0.65 : 0.85);
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }
  function pointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    targetX = Math.max(
      -1.6,
      Math.min(
        1.6,
        ((event.clientX - rect.left - rect.width / 2) / rect.height) * 2,
      ),
    );
    targetY = Math.max(
      -1.1,
      Math.min(
        1.1,
        (-(event.clientY - rect.top - rect.height / 2) / rect.height) * 2,
      ),
    );
  }
  function tick(now: number) {
    if (
      disposed ||
      !active ||
      document.hidden ||
      reduced.matches ||
      document.documentElement.dataset.style !== "aero" ||
      contextLost
    ) {
      frame = 0;
      canvas.dataset.renderState = "paused";
      return;
    }
    frame = requestAnimationFrame(tick);
    if (now - lastFrame < (innerWidth < 760 ? 40 : 30)) return;
    const dt = Math.min((now - (lastFrame || now)) / 33.33, 2);
    lastFrame = now;
    vx = (vx + (targetX - x) * 0.035 * dt) * Math.pow(0.82, dt);
    vy = (vy + (targetY - y) * 0.035 * dt) * Math.pow(0.82, dt);
    x += vx * dt;
    y += vy * dt;
    gl!.uniform2f(locations.resolution, canvas.width, canvas.height);
    gl!.uniform1f(locations.time, (now - start) / 1000);
    gl!.uniform2f(locations.pointer, x, y);
    gl!.uniform1f(locations.speed, Math.hypot(vx, vy));
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    canvas.dataset.renderState = "running";
  }
  function resume() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver((entries) => {
    active = !!entries[0]?.isIntersecting;
    if (active) resume();
  });
  const styleObserver = new MutationObserver(resume);
  function lose(event: Event) {
    event.preventDefault();
    contextLost = true;
    canvas.classList.add("is-unavailable");
    cancelAnimationFrame(frame);
    frame = 0;
  }
  let restoredCleanup: (() => void) | undefined;
  function restore() {
    canvas.classList.remove("is-unavailable");
    cleanup();
    restoredCleanup = mountLiquid(canvas);
  }
  resizeObserver.observe(canvas);
  intersection.observe(canvas);
  styleObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-style"],
  });
  window.addEventListener("pointermove", pointerMove, { passive: true });
  document.addEventListener("visibilitychange", resume);
  reduced.addEventListener("change", resume);
  canvas.addEventListener("webglcontextlost", lose);
  canvas.addEventListener("webglcontextrestored", restore);
  resize();
  resume();
  function cleanup() {
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersection.disconnect();
    styleObserver.disconnect();
    window.removeEventListener("pointermove", pointerMove);
    document.removeEventListener("visibilitychange", resume);
    reduced.removeEventListener("change", resume);
    canvas.removeEventListener("webglcontextlost", lose);
    canvas.removeEventListener("webglcontextrestored", restore);
    if (!contextLost) {
      gl!.deleteBuffer(buffer);
      gl!.deleteProgram(program);
      gl!.deleteShader(vs);
      gl!.deleteShader(fs);
    }
  }
  return () => {
    cleanup();
    restoredCleanup?.();
  };
}
