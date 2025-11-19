/* 
  ohms-law.js
  ----------------
  Purpose:
  - Provides the calculateOhmsLaw() function used by the Ohm’s Law Calculator.

  How it's used:
  - HTML button calls calculateOhmsLaw() directly (e.g. onclick="calculateOhmsLaw()").
  - Reads P, V, I, R from inputs and calculates missing values.

  Note:
  - This script must be loaded on any page where the Ohm's Law tool appears.
*/

function calculateOhmsLaw() {
  // Parse inputs from form
  const P = parseFloat(document.getElementById("power").value); // Watts
  const V = parseFloat(document.getElementById("voltage").value); // Volts
  const I = parseFloat(document.getElementById("current").value); // Amps
  const R = parseFloat(document.getElementById("resistance").value); // Ohms

  // Null-checking inputs (to skip NaN issues)
  let p = isNaN(P) ? null : P;
  let v = isNaN(V) ? null : V;
  let i = isNaN(I) ? null : I;
  let r = isNaN(R) ? null : R;
  let error = "";

  try {
    // Solve for unknown values using Ohm’s Law formulas
    if (p == null && v != null && i != null) p = v * i;
    else if (p == null && i != null && r != null) p = Math.pow(i, 2) * r;
    else if (p == null && v != null && r != null) p = Math.pow(v, 2) / r;

    if (v == null && p != null && i != null) v = p / i;
    else if (v == null && i != null && r != null) v = i * r;
    else if (v == null && p != null && r != null) v = Math.sqrt(p * r);

    if (i == null && p != null && v != null) i = p / v;
    else if (i == null && v != null && r != null) i = v / r;
    else if (i == null && p != null && r != null) i = Math.sqrt(p / r);

    if (r == null && v != null && i != null) r = v / i;
    else if (r == null && p != null && i != null) r = p / Math.pow(i, 2);
    else if (r == null && p != null && v != null) r = Math.pow(v, 2) / p;

    // Show error if not enough values were provided
    if ([p, v, i, r].filter((x) => x == null).length > 2) {
      error = "Please provide at least two known values.";
    }

    // Display results or error message
    const resultText = error
      ? `<span class="text-danger">${error}</span>`
      : `<strong>Power (P) = ${p.toFixed(2)} W</strong><br>
         <strong>Voltage (E) = ${v.toFixed(2)} V</strong><br>
         <strong>Current (I) = ${i.toFixed(2)} A</strong><br>
         <strong>Resistance (R) = ${r.toFixed(2)} Ω</strong>`;

    document.getElementById("result").innerHTML = resultText;
  } catch (err) {
    // Catch invalid math (like sqrt of negative)
    document.getElementById(
      "result"
    ).innerHTML = `<span class="text-danger">Calculation error. Please check inputs.</span>`;
  }
}
