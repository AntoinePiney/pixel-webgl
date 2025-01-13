// Shaders
const shaders = {
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

    vec2 coverUV(vec2 uv, vec2 aspect) {
      vec2 s = aspect;
      vec2 r = vec2(1.0);
      float rs = r.x / r.y;
      float is = s.x / s.y;
      vec2 new = rs < is ? vec2(s.x * r.y / s.y, r.y) : vec2(r.x, s.y * r.x / s.x);
      vec2 offset = (r - new) * 0.5;
      vec2 finalUV = uv * new + offset;
      return finalUV;
    }

    void main() {
      vec2 uv = coverUV(vUv, uImageAspect);
      float dist = distance(uv, uMouse);
      
      float time = uTime * 0.5;
      float dynamicPixels = uBasePixels * (1.0 + sin(time) * uDynamicRange);
      float finalPixels = mix(uBasePixels, dynamicPixels, smoothstep(0.5, 0.0, dist) * uHover);
      
      vec2 displacement = vec2(
        noise(uv * 3.0 + time) * uDisplacement,
        noise(uv * 3.0 + time + 1.0) * uDisplacement
      ) * uHover;
      
      vec2 distortedUV = uv + displacement;
      vec2 pixelatedUV = mix(
        distortedUV,
        pixelate(distortedUV, finalPixels),
        smoothstep(0.5, 0.0, dist) * uHover
      );
      
      vec4 color = texture2D(uTexture, pixelatedUV);
      
      float boost = smoothstep(0.5, 0.0, dist) * uHover * uColorBoost;
      color.rgb = mix(color.rgb, color.rgb * 1.2, boost);
      
      float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5) * 2.0);
      color.rgb *= mix(1.0, vignette, uVignette);
      
      if (pixelatedUV.x < 0.0 || pixelatedUV.x > 1.0 || pixelatedUV.y < 0.0 || pixelatedUV.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      } else {
        gl_FragColor = color;
      }
    }
  `,
};

// Controls configuration
const controls = [
  {
    id: "basePixels",
    label: "Résolution",
    min: 5,
    max: 50,
    value: 20,
    step: 1,
    group: "pixelisation",
  },
  {
    id: "dynamicRange",
    label: "Animation",
    min: 0,
    max: 1,
    value: 0.2,
    step: 0.05,
    group: "pixelisation",
  },
  {
    id: "noiseStrength",
    label: "Bruit",
    min: 0,
    max: 0.2,
    value: 0.05,
    step: 0.01,
    group: "effets",
  },
  {
    id: "displacement",
    label: "Déformation",
    min: 0,
    max: 0.1,
    value: 0.02,
    step: 0.01,
    group: "effets",
  },
  {
    id: "colorBoost",
    label: "Contraste",
    min: 0,
    max: 1,
    value: 0.2,
    step: 0.05,
    group: "effets",
  },
  {
    id: "timeSpeed",
    label: "Vitesse",
    min: 0,
    max: 0.05,
    value: 0.01,
    step: 0.001,
    group: "animation",
  },
];

// Setup scene
function setupScene() {
  const container = document.getElementById("container");

  // Add file input with custom styling
  const fileInputContainer = document.createElement("div");
  fileInputContainer.id = "file-input-container";
  fileInputContainer.textContent = "Choisir une image";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "file-input";
  fileInput.accept = "image/*";

  fileInputContainer.appendChild(fileInput);
  container.appendChild(fileInputContainer);

  fileInputContainer.addEventListener("click", () => fileInput.click());

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const texture = new THREE.TextureLoader().load(
    "https://images.unsplash.com/photo-1499428665502-503f6c608263?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  );

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const uniforms = {
    uTexture: { value: texture },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0.0 },
    uBasePixels: { value: 20.0 },
    uDynamicRange: { value: 0.2 },
    uNoiseStrength: { value: 0.05 },
    uDisplacement: { value: 0.02 },
    uColorBoost: { value: 0.2 },
    uVignette: { value: 0.3 },
    uImageAspect: { value: new THREE.Vector2(1, 1) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: shaders.vertexShader,
    fragmentShader: shaders.fragmentShader,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Handle file input
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const newTexture = new THREE.Texture(img);
          newTexture.needsUpdate = true;
          newTexture.minFilter = THREE.LinearFilter;
          newTexture.magFilter = THREE.LinearFilter;
          uniforms.uTexture.value = newTexture;
          uniforms.uImageAspect.value.set(img.width / img.height, 1);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Mouse interaction
  let targetMouse = { x: 0.5, y: 0.5 };
  let currentMouse = { x: 0.5, y: 0.5 };
  let isHovering = false;

  container.addEventListener("mouseenter", () => (isHovering = true));
  container.addEventListener("mouseleave", () => (isHovering = false));
  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / container.clientWidth;
    targetMouse.y = 1 - (e.clientY - rect.top) / container.clientHeight;
  });

  function updateMouse() {
    currentMouse.x += (targetMouse.x - currentMouse.x) * 0.1;
    currentMouse.y += (targetMouse.y - currentMouse.y) * 0.1;
    uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
    uniforms.uHover.value +=
      (isHovering ? 1 - uniforms.uHover.value : -uniforms.uHover.value) * 0.05;
    requestAnimationFrame(updateMouse);
  }

  updateMouse();

  // Resize handler
  window.addEventListener("resize", () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return { scene, camera, renderer, uniforms };
}

// Setup controls
function setupControls(uniforms) {
  const container = document.getElementById("controls");

  const groups = controls.reduce((acc, control) => {
    if (!acc[control.group]) acc[control.group] = [];
    acc[control.group].push(control);
    return acc;
  }, {});

  container.innerHTML = Object.entries(groups)
    .map(
      ([group, groupControls]) => `
      <div class="control-group">
        <h3>${group.charAt(0).toUpperCase()}${group.slice(1)}</h3>
        ${groupControls
          .map(
            (control) => `
          <div class="control-row">
            <label for="${control.id}">${control.label}</label>
            <input type="range" 
              id="${control.id}"
              min="${control.min}"
              max="${control.max}"
              value="${control.value}"
              step="${control.step}">
            <span class="value" id="${control.id}-value">${control.value}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `
    )
    .join("");

  // Setup event listeners
  controls.forEach((control) => {
    const input = document.getElementById(control.id);
    const value = document.getElementById(`${control.id}-value`);

    input.addEventListener("input", () => {
      const numValue = parseFloat(input.value);
      value.textContent = numValue.toFixed(2);
      uniforms[
        `u${control.id.charAt(0).toUpperCase()}${control.id.slice(1)}`
      ].value = numValue;
    });
  });
}

// Animation loop
function animate(scene, camera, renderer, uniforms) {
  requestAnimationFrame(() => animate(scene, camera, renderer, uniforms));
  uniforms.uTime.value += parseFloat(
    document.getElementById("timeSpeed").value
  );
  renderer.render(scene, camera);
}

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  const { scene, camera, renderer, uniforms } = setupScene();
  setupControls(uniforms);
  animate(scene, camera, renderer, uniforms);
});
