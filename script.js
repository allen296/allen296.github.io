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

    const query = `is:legendary type:creature identity=${colors}`;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}&order=random&unique=prints`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        player.imgSlot.textContent = 'No results';
      } else {
        const card = data.data[0];
        const imgUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
        player.imgSlot.innerHTML = `<img src="${imgUrl}" alt="${card.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
      }
    } catch (err) {
      console.error(err);
      player.imgSlot.textContent = 'Error fetching card';
    }
  }
});
