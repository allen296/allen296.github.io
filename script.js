document.getElementById("randomize").addEventListener("click", async () => {
  const players = [1, 2, 3, 4];
  const promises = [];

  players.forEach(playerNum => {
    const locked = document.querySelector(`.lock-toggle[data-player="${playerNum}"]`)?.checked;
    if (locked) return;

    const randomAny = document.querySelector(`.random-toggle[data-player="${playerNum}"]`)?.checked;
    const legendary = document.querySelector(`.legendary-toggle[data-player="${playerNum}"]`)?.checked;

    const colorChecks = document.querySelectorAll(`input[data-color][data-player="${playerNum}"]:checked`);
    const colors = [...colorChecks].map(c => c.value).sort().join("");

    let query = legendary
      ? "is:commander type:creature"
      : "type:creature";

    if (!randomAny && colors) {
      query += ` identity<=${colors}`;
    }

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
    const slot = document.getElementById(`player${playerNum}-img`);

    // Cargar animación mientras espera
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
  });

  await Promise.all(promises);
});
