document.getElementById("randomize").addEventListener("click", async () => {
  const players = document.querySelectorAll(".player");
  const promises = [];

  players.forEach(player => {
    const locked = player.querySelector(".lock-toggle").checked;
    if (locked) return;

    const randomAny = player.querySelector(".random-toggle").checked;
    const legendary = player.querySelector(".legendary-toggle").checked;
    const colors = [...player.querySelectorAll('input[data-color]:checked')].map(c => c.value).sort().join("");

    let query = "is:commander type:creature";
    if (legendary) query += " type:legendary";
    if (!randomAny && colors) query += ` identity<=${colors}`;

    const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
    const slot = player.querySelector(".image-slot");

    slot.innerHTML = `<div class="loader"></div>`;
    promises.push(
      fetch(url)
        .then(res => res.json())
        .then(data => {
          slot.innerHTML = `<img src="${data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal}" alt="${data.name}" />`;
        })
        .catch(() => {
          slot.innerHTML = `<span style="color:red;">Error</span>`;
        })
    );
  });

  await Promise.all(promises);
});
