export function animate(scene, camera, renderer, uniforms) {
  const updateTime = () => {
    uniforms.uTime.value += parseFloat(
      document.getElementById("timeSpeed").value
    );
    renderer.render(scene, camera);
    requestAnimationFrame(updateTime);
  };
  updateTime();
}
