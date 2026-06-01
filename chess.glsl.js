// chess.glsl.js — Shader strings para Three.js (importados como módulo inline)

export const boardVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vElevation;

  uniform float uTime;
  uniform float uScrollProgress;

  void main() {
    vUv = uv;
    vPosition = position;

    // Wave distortion on scroll
    float wave = sin(position.x * 3.0 + uTime * 0.6) * 0.015
               + sin(position.y * 2.0 + uTime * 0.4) * 0.01;
    vec3 pos = position;
    pos.z += wave * uScrollProgress;
    vElevation = wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const boardFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vElevation;

  uniform float uTime;
  uniform vec3 uLightColor;
  uniform float uScrollProgress;

  // Chess board pattern
  float chessPattern(vec2 uv, float size) {
    vec2 cell = floor(uv * size);
    return mod(cell.x + cell.y, 2.0);
  }

  void main() {
    // Base board colors
    vec3 lightCell = vec3(0.12, 0.10, 0.07);
    vec3 darkCell  = vec3(0.04, 0.035, 0.025);

    float chess = chessPattern(vUv, 8.0);
    vec3 base = mix(darkCell, lightCell, chess);

    // Gold glow along diagonals
    vec2 uv2 = vUv * 2.0 - 1.0;
    float dist = length(uv2);
    float glow = 1.0 - smoothstep(0.3, 1.0, dist);

    // Animated golden light sweep
    float sweep = sin(uTime * 0.5 + vUv.x * 6.28) * 0.5 + 0.5;
    sweep *= 0.06;

    vec3 gold = vec3(0.788, 0.659, 0.298);
    vec3 finalColor = base + gold * glow * 0.18 + gold * sweep * 0.5;

    // Edge vignette
    float vign = 1.0 - smoothstep(0.55, 1.1, dist);
    finalColor *= vign;

    // Elevation brightness
    finalColor += vec3(vElevation * 0.4);

    gl_FragColor = vec4(finalColor, 0.92 + glow * 0.08);
  }
`;

export const particleVertexShader = `
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vColor = aColor;

    vec3 pos = position;
    // Float particles upward over time
    pos.y += mod(aSpeed * uTime * 0.4, 6.0) - 3.0;
    pos.x += sin(uTime * aSpeed * 0.3 + position.z) * 0.1;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float alpha = 1.0 - abs(pos.y / 3.0);
    vAlpha = clamp(alpha, 0.0, 1.0) * 0.7;

    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPos.z);
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft circular particle
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float mask = 1.0 - smoothstep(0.35, 0.5, d);
    
    gl_FragColor = vec4(vColor, mask * vAlpha);
  }
`;

export const vignetteVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const vignetteFragmentShader = `
  varying vec2 vUv;
  uniform float uIntensity;

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float vign = 1.0 - dot(uv * 0.6, uv * 0.6);
    vign = clamp(pow(vign, 1.5), 0.0, 1.0);
    float final = 1.0 - (1.0 - vign) * uIntensity;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - final);
  }
`;
