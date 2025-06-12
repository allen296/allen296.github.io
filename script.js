const randomizeBtn = document.getElementById('randomize');
const players = [
  { checkboxes: document.querySelectorAll('#player1 input'), imgSlot: document.getElementById('player1-img') },
  { checkboxes: document.querySelectorAll('#player2 input'), imgSlot: document.getElementById('player2-img') },
  { checkboxes: document.querySelectorAll('#player3 input'), imgSlot: document.getElementById('player3-img') },
  { checkboxes: document.querySelectorAll('#player4 input'), imgSlot: document.getElementById('player4-img') }
];

randomizeBtn.addEventListener('click', async () => {
  for (const player of players) {
    const colors = Array.from(player.checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value)
      .sort()
      .join('');

    if (colors === '') {
      player.imgSlot.textContent = 'Select color(s)';
      continue;
    }

    const query = `is:legendary type:creature identity=${colors}`;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=prints`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        player.imgSlot.textContent = 'No results';
        continue;
      }

      // Si hay más páginas, obtenemos una aleatoria
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
