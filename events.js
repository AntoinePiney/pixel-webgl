export function setupEvents(canvasWrapper, uniforms, renderer) {
  let targetMouse = { x: 0.5, y: 0.5 };
  let currentMouse = { x: 0.5, y: 0.5 };
  let isHovering = false;

  canvasWrapper.addEventListener("mouseenter", () => (isHovering = true));
  canvasWrapper.addEventListener("mouseleave", () => (isHovering = false));
  canvasWrapper.addEventListener("mousemove", (e) => {
    const rect = canvasWrapper.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / rect.width;
    targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
  });

  function updateMouse() {
    currentMouse.x += (targetMouse.x - currentMouse.x) * 0.1;
    currentMouse.y += (targetMouse.y - currentMouse.y) * 0.1;
    uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
    uniforms.uHover.value +=
      (isHovering ? 1 - uniforms.uHover.value : -uniforms.uHover.value) * 0.05;
    requestAnimationFrame(updateMouse);
  }

  window.addEventListener("resize", () => {
    const width = canvasWrapper.clientWidth;
    const height = canvasWrapper.clientHeight;
    renderer.setSize(width, height);
    uniforms.uResolution.value.set(width, height);
  });

  updateMouse();
}
