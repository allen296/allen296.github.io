const randomizeBtn = document.getElementById('randomize');
const playerIds = ['player1', 'player2', 'player3', 'player4'];

const players = playerIds.map(id => {
  const el = document.getElementById(id);
  return {
    id,
    checkboxes: el.querySelectorAll('input'),
    imgSlot: el.querySelector(`#${id}-img`),
    legendaryBtn: el.querySelector('.toggle-legendary'),
    lockBtn: el.querySelector('.toggle-lock'),
    onlyLegendary: true,
    locked: false
  };
});

players.forEach(player => {
  player.legendaryBtn.addEventListener('click', () => {
    player.onlyLegendary = !player.onlyLegendary;
    player.legendaryBtn.classList.toggle('active', player.onlyLegendary);
  });

  player.lockBtn.addEventListener('click', () => {
    player.locked = !player.locked;
    player.lockBtn.classList.toggle('active', player.locked);
  });
});

randomizeBtn.addEventListener('click', async () => {
  for (const player of players) {
    if (player.locked) continue;

    const colors = Array.from(player.checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value)
      .sort()
      .join('');

    if (colors === '') {
      player.imgSlot.textContent = 'Select color(s)';
      continue;
    }

    let query = `type:creature identity=${colors}`;
    if (player.onlyLegendary) query = `is:legendary ${query}`;

    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=prints`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        player.imgSlot.textContent = 'No results';
        continue;
      }

      let allCards = data.data;

      while (data.has_more && allCards.length < 300) {
        const nextResponse = await fetch(data.next_page);
        const nextData = await nextResponse.json();
        allCards = allCards.concat(nextData.data);
        if (!nextData.has_more) break;
        data.next_page = nextData.next_page;
      }

      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      const imgUrl = randomCard.image_uris?.normal || randomCard.card_faces?.[0]?.image_uris?.normal;
      player.imgSlot.innerHTML = `<img src="${imgUrl}" alt="${randomCard.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;

    } catch (err) {
      console.error(err);
      player.imgSlot.textContent = 'Error fetching card';
    }
  }
});
