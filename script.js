document.getElementById("randomize").addEventListener("click", async () => {
  const promises = [];

  for (let i = 1; i <= 4; i++) {
    const lock = document.querySelector(`.lock-toggle[data-player="${i}"]`).checked;
    if (lock) continue;

    const legendary = document.querySelector(`.legendary-toggle[data-player="${i}"]`).checked;
    const randomAny = document.querySelector(`.random-toggle[data-player="${i}"]`).checked;

    const colorInputs = document.querySelectorAll(`input[data-color][data-player="${i}"]:checked`);
    const colors = [...colorInputs].map(c => c.value).sort().join("");

    let query = legendary ? "is:commander type:creature" : "type:creature";
    if (!randomAny && colors) {
      query += ` identity<=${colors}`;
    }

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
    const slot = document.getElementById(`player${i}-img`);
    slot.innerHTML = `<div class="loader"></div>`;

    promises.push(
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
          slot.innerHTML = `<img src="${imageUrl}" alt="${data.name}" />`;
        })
        .catch(() => {
          slot.innerHTML = `<span style="color:red;">Error</span>`;
        })
    );
  }

  await Promise.all(promises);
});
