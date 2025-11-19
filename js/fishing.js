/* 
  fishing.js
  ----------------
  Purpose:
  - Handles the fishing conditions form submission.

  How it's used:
  - Listens for submit on #fishingForm.
  - Sends POST to /fishing (Flask).
  - Receives HTML, extracts #fishingAppContent, and swaps it into the page.

  Notes:
  - Safe to include on pages without #fishingForm (checks first).
*/

document.addEventListener("DOMContentLoaded", function () {
  const fishingForm = document.getElementById("fishingForm");
  const fishingResultBox = document.getElementById("fishingResult");

  // Ensure the fishing form exists on the current page
  if (!fishingForm || !fishingResultBox) return;

  fishingForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default form submission behavior (page reload)

    const formData = new FormData(fishingForm); // Gather form data (location input)
    fishingResultBox.innerHTML = ""; // Clear previous result

    try {
      // Submit form data using fetch to the Flask endpoint /fishing
      const res = await fetch("/fishing", {
        method: "POST",
        body: formData,
      });

      // Convert the response into text (HTML fragment)
      const html = await res.text();

      // Parse HTML and extract updated fishingAppContent
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newContent = doc.querySelector("#fishingAppContent");

      // Replace the content in place (smooth update without full reload)
      if (newContent) {
        document.getElementById("fishingAppContent").innerHTML =
          newContent.innerHTML;
      } else {
        fishingResultBox.innerHTML =
          "<p class='text-danger'>Something went wrong. Please try again.</p>";
      }
    } catch (err) {
      // Handle unexpected issues (network errors, backend crashes, etc.)
      fishingResultBox.innerHTML =
        "<p class='text-danger'>Error fetching data. Please check your input or try again later.</p>";
    }
  });
});
