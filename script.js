async function fetchRandomCommander(colors) {
  const colorQuery = colors.length > 0 ? `+id>=${colors.join('')}` : '';
  const url = `https://api.scryfall.com/cards/random?q=is:commander${colorQuery}+is:legendary+type:creature`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Carta no encontrada');
    const data = await response.json();
    return data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
  } catch (err) {
    console.error('Error al buscar carta:', err);
    return 'https://cards.scryfall.io/normal/front/7/d/7d60d81d-1100-49f7-8b8e-36eb2d949801.jpg'; // Carta de emergencia
  }
}

function getSelectedColors(slot) {
  const checkboxes = slot.querySelectorAll('input[type=checkbox]:checked');
  return Array.from(checkboxes).map(cb => cb.value.toLowerCase());
}

async function generateCommanders() {
  for (let i = 1; i <= 4; i++) {
    const slot = document.getElementById(`player${i}`);
    const selectedColors = getSelectedColors(slot);
    const imgUrl = await fetchRandomCommander(selectedColors);
    slot.querySelector('.card-img').src = imgUrl;
  }
}

document.getElementById('generateBtn').addEventListener('click', generateCommanders);
