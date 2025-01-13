import { defaultTextureURL } from './constants.js';
import { shaders } from './shaders.js';
import { updateImageAspect } from './utils.js';

export function setupScene() {
  const container = document.getElementById("container");

  const canvasWrapper = document.createElement("div");
  canvasWrapper.id = "canvasWrapper";
  container.appendChild(canvasWrapper);

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

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasWrapper.clientWidth, canvasWrapper.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasWrapper.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const textureLoader = new THREE.TextureLoader();
  const uniforms = {
    uTexture: { value: null },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0.0 },
    uBasePixels: { value: 20.0 },
    uDynamicRange: { value: 0.2 },
    uNoiseStrength: { value: 0.05 },
    uDisplacement: { value: 0.02 },
    uColorBoost: { value: 0.2 },
    uVignette: { value: 0.3 },
    uResolution: {
      value: new THREE.Vector2(
        canvasWrapper.clientWidth,
        canvasWrapper.clientHeight
      ),
    },
    uImageAspect: { value: new THREE.Vector2(1, 1) },
  };

  textureLoader.load(defaultTextureURL, (texture) => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    uniforms.uTexture.value = texture;

    const img = texture.image;
    updateImageAspect(img, uniforms);
  });

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: shaders.vertexShader,
    fragmentShader: shaders.fragmentShader,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

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
          updateImageAspect(img, uniforms);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  return { scene, camera, renderer, uniforms, canvasWrapper };
}
