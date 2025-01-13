export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function updateImageAspect(image, uniforms) {
  const imageAspect = image.width / image.height;
  uniforms.uImageAspect.value.set(imageAspect, 1);
}
