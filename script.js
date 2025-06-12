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

    // Obtener colores marcados
    const colors = Array.from(player.colorCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value)
      .sort()
      .join('');

    if (colors === '') {
      player.imgSlot.textContent = 'Select color(s)';
      continue;
    }

    // Crear búsqueda
    const queryParts = [];
    if (player.legendaryCheckbox.checked) queryParts.push('is:legendary');
    queryParts.push('type:creature');
    queryParts.push(`identity=${colors}`);
    const query = queryParts.join(' ');
    const encoded = encodeURIComponent(query);

    // API con resultados mezclados
    const baseUrl = `https://api.scryfall.com/cards/search?q=${encoded}&unique=prints&order=set`;

    let allCards = [];
    let nextUrl = baseUrl;
    let loops = 0;

    try {
      while (nextUrl && loops < 3) {
        const response = await fetch(nextUrl);
        const data = await response.json();
        if (!data.data) break;

        allCards = allCards.concat(data.data);
        nextUrl = data.has_more ? data.next_page : null;
        loops++;
      }

      if (allCards.length === 0) {
        player.imgSlot.textContent = 'No results';
        continue;
      }

      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      const imgUrl = randomCard.image_uris?.normal || randomCard.card_faces?.[0]?.image_uris?.normal;

      player.imgSlot.innerHTML = `<img src="${imgUrl}" alt="${randomCard.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;

    } catch (err) {
      console.error('Error fetching from Scryfall:', err);
      player.imgSlot.textContent = 'Error fetching card';
    }
  }
});
