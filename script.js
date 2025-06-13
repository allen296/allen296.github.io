const randomizeBtn = document.getElementById('randomize');
const playerIds = ['player1', 'player2', 'player3', 'player4'];

const players = playerIds.map(id => {
  const el = document.getElementById(id);
  return {
    id,
    colorCheckboxes: el.querySelectorAll('input[data-color]'),
    imgSlot: el.querySelector(`#${id}-img`),
    historySlot: el.querySelector(`#${id}-history`),
    legendaryCheckbox: el.querySelector('.legendary-toggle'),
    lockCheckbox: el.querySelector('.lock-toggle'),
    randomAnyCheckbox: el.querySelector('.random-toggle')
  };
});

randomizeBtn.addEventListener('click', async () => {
  const promises = players.map(async (player) => {
    if (player.lockCheckbox.checked) return;

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
        return;
      }

      queryParts.push(`identity=${colors}`);
    }

    const query = queryParts.join(' ');
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.scryfall.com/cards/random?q=${encodedQuery}`;

    // Mostrar spinner
    player.imgSlot.classList.add('loading');
    player.imgSlot.innerHTML = '';

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('No result');

      const card = await response.json();
      const imgUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;

      // Mostrar la carta principal
      const imgTag = document.createElement('img');
      imgTag.src = imgUrl;
      imgTag.alt = card.name;
      player.imgSlot.innerHTML = '';
      player.imgSlot.appendChild(imgTag);
      player.imgSlot.classList.remove('loading');

      // Añadir miniatura al historial
      const historyImg = document.createElement('img');
      historyImg.src = imgUrl;
      historyImg.alt = card.name;
      player.historySlot.appendChild(historyImg);

    } catch (err) {
      console.error(`Error for ${player.id}:`, err);
      player.imgSlot.classList.remove('loading');
      player.imgSlot.textContent = 'No results';
    }
  });

  await Promise.all(promises);
});
