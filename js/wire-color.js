/* 
  wire-color.js
  ----------------
  Purpose:
  - Provides getWireColor() function for the Wire Color Identifier tool.

  How it's used:
  - HTML button calls getWireColor() directly.
  - Uses voltage system and circuit number to determine wire color.

  Notes:
  - Expects:
    - #voltageSystem <select>
    - #circuitNumber <input>
    - #wireResult <div/span> to display result
*/

function getWireColor() {
  const system = document.getElementById("voltageSystem").value; // "208" or "480"
  const circuit = parseInt(document.getElementById("circuitNumber").value, 10); // User-entered circuit #

  const resultBox = document.getElementById("wireResult");

  // Reject bad circuit inputs
  if (isNaN(circuit) || circuit <= 0) {
    resultBox.innerHTML = "Please enter a valid positive circuit number.";
    return;
  }

  // Pattern repeats every 6 circuits
  const remainder = (circuit - 1) % 6;

  let color = "";
  if (system === "208") {
    const colors208 = ["Black", "Black", "Red", "Red", "Blue", "Blue"];
    color = colors208[remainder];
  } else if (system === "480") {
    const colors480 = [
      "Brown",
      "Brown",
      "Orange",
      "Orange",
      "Yellow",
      "Yellow",
    ];
    color = colors480[remainder];
  }

  // Add styling class for colored span
  const colorClass = `color-${color}`;
  resultBox.innerHTML = `<strong>Circuit #${circuit}</strong> uses <span class="${colorClass}">${color}</span> wire.`;
}
