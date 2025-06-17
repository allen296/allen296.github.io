document.getElementById("randomize").addEventListener("click", async () => {
  const players = [1, 2, 3, 4];
  const promises = [];

  players.forEach(num => {
    const locked = document.getElementById(`lock${num}`).checked;
    if (locked) return;

    const randomAny = document.getElementById(`random${num}`).checked;
    const legendary = document.getElementById(`legendary${num}`).checked;

    // Selección de colores usando data-player
    const colors = [...document.querySelectorAll(`input[data-color][data-player="${num}"]:checked`)]
      .map(c => c.value)
      .sort()
      .join("");

    // Construcción del query para Scryfall
    let query = legendary
      ? "is:commander type:creature"
      : "type:creature";

    if (!randomAny && colors) {
      query += ` identity<=${colors}`;
    }

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
    const slot = document.getElementById(`player${num}-img`);

    // Animación de carga
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
