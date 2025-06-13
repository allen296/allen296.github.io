const randomizeBtn = document.getElementById('randomize');
const playerIds = ['player1', 'player2', 'player3', 'player4'];

const players = playerIds.map(id => {
  const el = document.getElementById(id);
  return {
    id,
    colorCheckboxes: el.querySelectorAll('input[data-color]'),
    imgSlot: el.querySelector(`#${id}-img`),
    legendaryCheckbox: el.querySelector('.legendary-toggle'),
    lockCheckbox: el.querySelector('.lock-toggle'),
    randomAnyCheckbox: el.querySelector('.random-toggle')
  };
});

randomizeBtn.addEventListener('click', async () => {
  for (const player of players) {
    if (player.lockCheckbox.checked) continue;

    const useAnyColor = player.randomAnyCheckbox.checked;
    const isLegendary = player.legendaryCheckbox.checked;

    const queryParts = ['type:creature'];
    if (isLegendary) queryParts.unshift('is:legendary');

    if (!useAnyColor) {
      const colors = Array.from(player.colorCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value)
        .sort()
        .join('');

      if (!colors) {
        player.imgSlot.textContent = 'Select color(s)';
        continue;
      }

      queryParts.push(`identity=${colors}`);
    }

    const query = queryParts.join(' ');
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.scryfall.com/cards/random?q=${encodedQuery}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('No result');

      const card = await response.json();
      const imgUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;

      player.imgSlot.innerHTML = `<img src="${imgUrl}" alt="${card.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;

    } catch (err) {
      console.error(err);
      player.imgSlot.textContent = 'No results';
    }
  }
});
