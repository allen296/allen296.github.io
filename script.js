document.getElementById("randomize").addEventListener("click", async () => {
  const players = [1, 2, 3, 4];

  const button = document.getElementById("randomize");
  button.classList.add("loading");
  button.textContent = "Cargando...";

  const promises = players.map(n => {
    const id = `player${n}`;
    const slot = document.getElementById(`${id}-img`);
    const colorBox = document.querySelector(`#p${n}-colors`);
    const colors = [...colorBox.querySelectorAll("input[data-color]:checked")]
      .map(c => c.value).sort().join("");

    const legendary = document.querySelector(`.legendary-toggle-${id}`).checked;
    const locked = document.querySelector(`.lock-toggle-${id}`).checked;
    const randomAny = document.querySelector(`.random-toggle-${id}`).checked;

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
