const randomizeBtn = document.getElementById('randomize');
const playerIds = ['player1', 'player2', 'player3', 'player4'];

const players = playerIds.map(id => {
  const el = document.getElementById(id);
  return {
    id,
    colorCheckboxes: el.querySelectorAll('input[data-color]'),
    imgSlot: el.querySelector(`#${id}-img`),
    legendaryCheckbox: el.querySelector('.legendary-toggle'),
    lockCheckbox: el.querySelector('.lock-toggle')
  };
});

randomizeBtn.addEventListener('click', async () => {
  for (const player of players) {
    if (player.lockCheckbox.checked) continue;

    const colors = Array.from(player.colorCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value)
      .sort()
      .join('');

    if (!colors) {
      player.imgSlot.textContent = 'Select color(s)';
      continue;
    }

    // Construimos la query de búsqueda
    let query = `type:creature identity=${colors}`;
    if (player.legendaryCheckbox.checked) {
      query = `is:legendary ${query}`;
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=prints`;

    try {
      let allCards = [];
      let nextPage = url;
      let tries = 0;

      while (nextPage && tries < 3) {
        const response = await fetch(nextPage);
        const data = await response.json();
        allCards = allCards.concat(data.data);
        nextPage = data.has_more ? data.next_page : null;
        tries++;
      }

      if (allCards.length === 0) {
        player.imgSlot.textContent = 'No results';
        continue;
      }

      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      const imgUrl = randomCard.image_uris?.normal || randomCard.card_faces?.[0]?.image_uris?.normal;

      player.imgSlot.innerHTML = `<img src="${imgUrl}" alt="${randomCard.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
    } catch (error) {
      console.error(error);
      player.imgSlot.textContent = 'Error fetching card';
    }
  }
});
