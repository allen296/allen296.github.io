document.getElementById("randomize").addEventListener("click", async () => {
  const players = document.querySelectorAll(".card-section");
  const button = document.getElementById("randomize");

  button.classList.add("loading");
  button.textContent = "Cargando...";

  const promises = [];

  players.forEach(player => {
    const legendary = player.nextElementSibling?.querySelector(".legendary-toggle")?.checked ?? true;
    const locked = player.nextElementSibling?.querySelector(".lock-toggle")?.checked;
    const randomAny = player.nextElementSibling?.querySelector(".random-toggle")?.checked;

    if (locked) return;

    const playerId = player.id;
    const slot = document.getElementById(`${playerId}-img`);

    // Buscar colores asociados por ID (p.ej. p1-colors)
    const colorBox = document.querySelector(`#${playerId.replace("player", "p")}-colors`);
    const colors = [...colorBox.querySelectorAll("input[data-color]:checked")]
                    .map(c => c.value).sort().join("");

    // Construir la query
    let query = legendary ? "is:commander type:creature" : "type:creature";
    if (!randomAny && colors) {
      query += ` identity<=${colors}`;
    }

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;

    // Mostrar animación de carga
    slot.innerHTML = `<div class="loader"></div>`;

    // Llamada a Scryfall
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
  button.classList.remove("loading");
  button.textContent = "Randomize";
});
