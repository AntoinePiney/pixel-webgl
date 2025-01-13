import { setupScene } from './scene.js';
import { setupControls } from './controls.js';
import { animate } from './animation.js';
import { setupEvents } from './events.js';

document.addEventListener("DOMContentLoaded", () => {
  const { scene, camera, renderer, uniforms, canvasWrapper } = setupScene();
  setupControls(uniforms);
  setupEvents(canvasWrapper, uniforms, renderer);
  animate(scene, camera, renderer, uniforms);
});
