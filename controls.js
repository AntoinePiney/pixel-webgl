import { controls } from './constants.js';
import { capitalize } from './utils.js';

export function setupControls(uniforms) {
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
          <h3>${capitalize(group)}</h3>
          ${groupControls
            .map(
              (control) => `
                <div class="control-row">
                  <label for="${control.id}">${control.label}</label>
                  <input type="range" id="${control.id}" min="${control.min}" max="${control.max}" value="${control.value}" step="${control.step}">
                  <span class="value" id="${control.id}-value">${control.value}</span>
                </div>
              `
            )
            .join("")}
        </div>
      `
    )
    .join("");

  controls.forEach(({ id, value }) => {
    const input = document.getElementById(id);
    const display = document.getElementById(`${id}-value`);

    input.addEventListener("input", () => {
      const numValue = parseFloat(input.value);
      display.textContent = numValue.toFixed(2);
      uniforms[`u${capitalize(id)}`].value = numValue;
    });
  });
}
