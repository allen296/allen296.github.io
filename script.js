document.getElementById("randomize").addEventListener("click", async () => {
  const players = [
    { id: "player1", side: "left" },
    { id: "player2", side: "right" },
    { id: "player3", side: "left" },
    { id: "player4", side: "right" }
  ];

  const button = document.getElementById("randomize");
  button.classList.add("loading");
  button.textContent = "Cargando...";

  const promises = players.map(({ id, side }) => {
    const slot = document.getElementById(`${id}-img`);
    const colorBox = document.querySelector(`#${id.replace("player", "p")}-colors`);
    const colors = [...colorBox.querySelectorAll("input[data-color]:checked")]
      .map(c => c.value).sort().join("");

    const legendary = document.querySelector(`.legendary-toggle-${side}`).checked;
    const locked = document.querySelector(`.lock-toggle-${side}`).checked;
    const randomAny = document.querySelector(`.random-toggle-${side}`).checked;

    if (locked) return Promise.resolve();

    let query = legendary ? "is:commander type:creature" : "type:creature";
    if (!randomAny && colors) query += ` identity<=${colors}`;
    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;

    slot.innerHTML = `<div class="loader"></div>`;

    return fetch(url)
      .then(res => res.json())
      .then(data => {
        const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
        slot.innerHTML = `<img src="${imageUrl}" alt="${data.name}" />`;
      })
      .catch(() => {
        slot.innerHTML = `<span style="color:red;">Error</span>`;
      });
  });

  await Promise.all(promises);
  button.classList.remove("loading");
  button.textContent = "Randomize";
});
