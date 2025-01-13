export const shaders = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uBasePixels;
    uniform float uDynamicRange;
    uniform float uNoiseStrength;
    uniform float uDisplacement;
    uniform float uColorBoost;
    uniform float uVignette;
    uniform vec2 uResolution;
    uniform vec2 uImageAspect;
    varying vec2 vUv;

    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u * u * (3.0 - 2.0 * u);
      float res = mix(
        mix(sin(dot(ip, vec2(12.9898,78.233))),
            sin(dot(ip + vec2(1.0,0.0), vec2(12.9898,78.233))), u.x),
        mix(sin(dot(ip + vec2(0.0,1.0), vec2(12.9898,78.233))),
            sin(dot(ip + vec2(1.0,1.0), vec2(12.9898,78.233))), u.x), u.y);
      return res * 0.5 + 0.5;
    }

    vec2 pixelate(vec2 uv, float pixels) {
      vec2 pixelated = floor(uv * pixels) / pixels;
      float noise = noise(pixelated * 10.0 + uTime) * uNoiseStrength;
      return pixelated + noise * uHover;
    }

    vec2 coverUV(vec2 uv, vec2 contentAspect, vec2 containerAspect) {
      float containerRatio = containerAspect.x / containerAspect.y;
      float contentRatio = contentAspect.x / contentAspect.y;

      vec2 scale = containerRatio > contentRatio
        ? vec2(containerRatio / contentRatio, 1.0)
        : vec2(1.0, contentRatio / containerRatio);

      return (uv - 0.5) * scale + 0.5;
    }

    void main() {
      vec2 containerAspect = uResolution;
      vec2 adjustedUV = coverUV(vUv, uImageAspect, containerAspect);
      
      float dist = distance(adjustedUV, uMouse);

      float time = uTime * 0.5;
      float dynamicPixels = uBasePixels * (1.0 + sin(time) * uDynamicRange);
      float finalPixels = mix(uBasePixels, dynamicPixels, smoothstep(0.5, 0.0, dist) * uHover);

      vec2 displacement = vec2(
        noise(adjustedUV * 3.0 + time) * uDisplacement,
        noise(adjustedUV * 3.0 + time + 1.0) * uDisplacement
      ) * uHover;

      vec2 distortedUV = adjustedUV + displacement;
      vec2 pixelatedUV = mix(
        distortedUV,
        pixelate(distortedUV, finalPixels),
        smoothstep(0.5, 0.0, dist) * uHover
      );

      if (pixelatedUV.x < 0.0 || pixelatedUV.x > 1.0 || 
          pixelatedUV.y < 0.0 || pixelatedUV.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      vec4 color = texture2D(uTexture, pixelatedUV);

      float boost = smoothstep(0.5, 0.0, dist) * uHover * uColorBoost;
      color.rgb = mix(color.rgb, color.rgb * 1.2, boost);

      float vignette = 1.0 - smoothstep(0.5, 1.5, length(adjustedUV - 0.5) * 2.0);
      color.rgb *= mix(1.0, vignette, uVignette);

      gl_FragColor = color;
    }
  `,
};
