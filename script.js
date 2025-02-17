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

// Evento para buscar cartas
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cardName = cardNameInput.value.trim();
  if (!cardName) return;

  try {
    // Llamada a la API de Scryfall para buscar cartas por nombre
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}`);
    const data = await response.json();

    // Verificar si hubo un error o no se encontraron cartas
    if (data.object === 'error' || !data.data || data.data.length === 0) {
      cardContainer.innerHTML = '<p>No se encontraron resultados.</p>';
      cardsArray = [];
      currentIndex = 0;
      updateButtons();
      return;
    }

    // Almacenar los resultados y mostrar la primera carta
    cardsArray = data.data;
    currentIndex = 0;
    displayCard(cardsArray[currentIndex]);
    updateButtons();

  } catch (error) {
    console.error(error);
    cardContainer.innerHTML = '<p>Ocurrió un error en la búsqueda.</p>';
  }
});

// Función para mostrar la carta actual
function displayCard(card) {
  cardContainer.innerHTML = '';

  const cardElement = document.createElement('div');
  cardElement.classList.add('card');

  // Imagen de la carta (si está disponible)
  if (card.image_uris && card.image_uris.normal) {
    const img = document.createElement('img');
    img.src = card.image_uris.normal;
    img.alt = card.name;
    cardElement.appendChild(img);
  }

  // Nombre
  const nameEl = document.createElement('h3');
  nameEl.textContent = card.name;
  cardElement.appendChild(nameEl);

  // Tipo
  const typeEl = document.createElement('p');
  typeEl.textContent = card.type_line;
  cardElement.appendChild(typeEl);

  // Texto (oracle_text)
  if (card.oracle_text) {
    const textEl = document.createElement('p');
    textEl.textContent = card.oracle_text;
    cardElement.appendChild(textEl);
  }

  cardContainer.appendChild(cardElement);
}

// Actualizar el estado de los botones de navegación
function updateButtons() {
  prevBtn.disabled = (currentIndex === 0);
  nextBtn.disabled = (currentIndex === cardsArray.length - 1 || cardsArray.length === 0);
}

// Botón "Anterior"
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayCard(cardsArray[currentIndex]);
    updateButtons();
  }
});

// Botón "Siguiente"
nextBtn.addEventListener('click', () => {
  if (currentIndex < cardsArray.length - 1) {
    currentIndex++;
    displayCard(cardsArray[currentIndex]);
    updateButtons();
  }
});

/* 2. CARTA ALEATORIA */

// Evento para obtener una carta aleatoria
randomBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('https://api.scryfall.com/cards/random');
    const card = await response.json();

    // Limpiar el contenedor antes de mostrar la carta aleatoria
    randomCardContainer.innerHTML = '';

    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    // Imagen
    if (card.image_uris && card.image_uris.normal) {
      const img = document.createElement('img');
      img.src = card.image_uris.normal;
      img.alt = card.name;
      cardElement.appendChild(img);
    }

    // Nombre
    const nameEl = document.createElement('h3');
    nameEl.textContent = card.name;
    cardElement.appendChild(nameEl);

    // Tipo
    const typeEl = document.createElement('p');
    typeEl.textContent = card.type_line;
    cardElement.appendChild(typeEl);

    // Texto (oracle_text)
    if (card.oracle_text) {
      const textEl = document.createElement('p');
      textEl.textContent = card.oracle_text;
      cardElement.appendChild(textEl);
    }

    randomCardContainer.appendChild(cardElement);

  } catch (error) {
    console.error(error);
    randomCardContainer.innerHTML = '<p>Error al obtener la carta aleatoria.</p>';
  }
});
