document.getElementById("randomize").addEventListener("click", async () => {
  const players = document.querySelectorAll(".player");
  const promises = [];

  players.forEach(player => {
    const locked = player.querySelector(".lock-toggle").checked;
    if (locked) return;

    const randomAny = player.querySelector(".random-toggle").checked;
    const legendary = player.querySelector(".legendary-toggle").checked;
    const colors = [...player.querySelectorAll('input[data-color]:checked')].map(c => c.value).sort().join("");

    // Base de búsqueda según si es legendaria o no
    let query = legendary
      ? "is:commander type:creature"
      : "type:creature";

    if (!randomAny && colors) {
      query += ` identity<=${colors}`;
    }

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
    const slot = player.querySelector(".image-slot");

    // Mostrar animación de carga
    slot.innerHTML = `<div class="loader"></div>`;

    // Llamada al API
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
