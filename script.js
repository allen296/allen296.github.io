// Variables globales para los resultados
let currentIndex = 0;
let cardsArray = [];

// Referencias a elementos del DOM
const searchForm = document.getElementById('searchForm');
const cardNameInput = document.getElementById('cardName');
const cardContainer = document.getElementById('cardContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const randomCardContainer = document.getElementById('randomCardContainer');

/* 1. BÚSQUEDA DE CARTAS */
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cardName = cardNameInput.value.trim();
  if (!cardName) return;

  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}`
    );
    const data = await response.json();

    // Verificar si hay resultados
    if (data.object === 'error' || !data.data || data.data.length === 0) {
      cardContainer.innerHTML = '<p>No se encontraron resultados.</p>';
      cardsArray = [];
      currentIndex = 0;
      updateButtons();
      return;
    }

    // Guardar los resultados y mostrar la primera carta
    cardsArray = data.data;
    currentIndex = 0;
    displayCard(cardsArray[currentIndex]);
    updateButtons();

  } catch (error) {
    console.error(error);
    cardContainer.innerHTML = '<p>Ocurrió un error en la búsqueda.</p>';
  }
});

// Muestra la carta actual (solo imagen)
function displayCard(card) {
  cardContainer.innerHTML = '';

  const cardElement = document.createElement('div');
  cardElement.classList.add('card');

  // Imagen
  // Nota: Se quita nombre, tipo y descripción para evitar desplazamientos.
  if (card.image_uris && card.image_uris.normal) {
    const img = document.createElement('img');
    img.src = card.image_uris.normal;
    img.alt = card.name;
    cardElement.appendChild(img);
  }

  cardContainer.appendChild(cardElement);
}

// Actualiza los botones de navegación
function updateButtons() {
  prevBtn.disabled = (currentIndex === 0);
  nextBtn.disabled = (currentIndex === cardsArray.length - 1 || cardsArray.length === 0);
}

// Botones de navegación
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayCard(cardsArray[currentIndex]);
    updateButtons();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < cardsArray.length - 1) {
    currentIndex++;
    displayCard(cardsArray[currentIndex]);
    updateButtons();
  }
});

/* 2. CARTA ALEATORIA */
randomBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('https://api.scryfall.com/cards/random');
    const card = await response.json();

    // Limpiar el contenedor antes de mostrar la nueva carta
    randomCardContainer.innerHTML = '';

    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    // Solo imagen
    if (card.image_uris && card.image_uris.normal) {
      const img = document.createElement('img');
      img.src = card.image_uris.normal;
      img.alt = card.name;
      cardElement.appendChild(img);
    }

    randomCardContainer.appendChild(cardElement);

  } catch (error) {
    console.error(error);
    randomCardContainer.innerHTML = '<p>Error al obtener la carta aleatoria.</p>';
  }
});
