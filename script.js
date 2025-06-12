const randomizeBtn = document.getElementById('randomize');
const players = [
  { checkboxes: document.querySelectorAll('.player.left:nth-of-type(1) input'), imgSlot: document.getElementById('player1-img') },
  { checkboxes: document.querySelectorAll('.player.left:nth-of-type(2) input'), imgSlot: document.getElementById('player2-img') },
  { checkboxes: document.querySelectorAll('.player.right:nth-of-type(1) input'), imgSlot: document.getElementById('player3-img') },
  { checkboxes: document.querySelectorAll('.player.right:nth-of-type(2) input'), imgSlot: document.getElementById('player4-img') }
];

randomizeBtn.addEventListener('click', async () => {
  for (const player of players) {
    const colors = Array.from(player.checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value)
      .sort()
      .join('');

    const url = `https://api.scryfall.com/cards/search?q=is%3Alegendary+type%3Acreature+identity%3D${colors}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.data.length === 0) {
        player.imgSlot.textContent = 'No results';
      } else {
        const randomCard = data.data[Math.floor(Math.random() * data.data.length)];
        const imgUrl = randomCard.image_uris?.normal || randomCard.card_faces?.[0]?.image_uris?.normal;
        player.imgSlot.innerHTML = `<img src=\"${imgUrl}\" alt=\"${randomCard.name}\" style=\"width:100%; height:100%; object-fit:cover; border-radius:8px;\">`;
      }
    } catch (err) {
      player.imgSlot.textContent = 'Error fetching card';
    }
  }
});
