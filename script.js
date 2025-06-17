document.getElementById("randomize").addEventListener("click", async () => {
  const players = [1, 2, 3, 4];
  const promises = [];

  players.forEach(playerNum => {
    const playerSection = document.getElementById(`player${playerNum}`);
    const slot = document.getElementById(`player${playerNum}-img`);

    // Obtener los colores del jugador
    const colorInputs = document.querySelectorAll(`#player${playerNum} ~ .checkboxes input[data-color]:checked`);
    const colors = Array.from(colorInputs).map(c => c.value).sort().join("");

    // Controles centrales
    const legendary = document.querySelector(`.legendary-toggle[data-player="${playerNum}"]`)?.checked;
    const locked = document.querySelector(`.lock-toggle[data-player="${playerNum}"]`)?.checked;
    const randomAny = document.querySelector(`.random-toggle[data-player="${playerNum}"]`)?.checked;

    if (locked) return;

    // Query a Scryfall
    let query = legendary
      ? "is:commander type:creature"
      : "type:creature";

    if (!randomAny && colors) {
      query += ` identity<=${colors}`;
    }

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;

    // Mostrar animación de carga
    slot.innerHTML = `<div class="loader"></div>`;

    // Llamada a la API
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
