// Variables globales para los resultados de búsqueda
let allCards = [];
let currentIndex = 0;

// Referencia a elementos del DOM
const searchForm = document.getElementById('searchForm');
const cardNameInput = document.getElementById('cardNameInput');
const searchResults = document.getElementById('searchResults');
const randomButton = document.getElementById('randomButton');
const randomCardContainer = document.getElementById('randomCardContainer');

// Botones de navegación
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');

// Función para obtener y mostrar las cartas de Scryfall según un nombre
async function searchCards(cardName) {
  try {
    // Llamamos a la API de Scryfall para buscar por nombre
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}`
    );
    const data = await response.json();

    // Si hay algún error o no se encontraron resultados
    if (data.object === 'error' || !data.data || data.data.length === 0) {
      searchResults.innerHTML = `<p>No se encontró ninguna coincidencia.</p>`;
      allCards = [];
      currentIndex = 0;
      updateNavigationButtons();
      return;
    }

    // Guardamos todos los resultados en un array global
    allCards = data.data;
    // Empezamos mostrando la primera carta
    currentIndex = 0;
    displayCurrentCard();

  } catch (error) {
    console.error(error);
    searchResults.innerHTML = `<p>Ocurrió un error al realizar la búsqueda.</p>`;
  }
}

// Función para mostrar la carta actual en el contenedor
function displayCurrentCard() {
  // Si no hay cartas en allCards, mostramos un mensaje
  if (!allCards || allCards.length === 0) {
    searchResults.innerHTML = `<p>No se encontró ninguna coincidencia.</p>`;
    return;
  }

  // Obtenemos la carta actual
  const card = allCards[currentIndex];

  // Limpiamos el contenedor antes de mostrar la carta
  searchResults.innerHTML = '';

  // Creamos el elemento de la carta
  const cardElement = document.createElement('div');
  cardElement.classList.add('card');

  // Imagen de la carta (si existe)
  if (card.image_uris && card.image_uris.normal) {
    const cardImage = document.createElement('img');
    cardImage.src = card.image_uris.normal;
    cardImage.alt = card.name;
    cardElement.appendChild(cardImage);
  }

  // Nombre de la carta
  const cardTitle = document.createElement('h3');
  cardTitle.textContent = card.name;
  cardElement.appendChild(cardTitle);

  // Tipo de la carta
  const cardType = document.createElement('p');
  cardType.textContent = card.type_line;
  cardElement.appendChild(cardType);

  // Texto (oracle_text) de la carta
  if (card.oracle_text) {
    const cardText = document.createElement('p');
    cardText.textContent = card.oracle_text;
    cardElement.appendChild(cardText);
  }

  // Añadimos la carta al contenedor de resultados
  searchResults.appendChild(cardElement);

  // Actualizamos el estado de los botones de navegación
  updateNavigationButtons();
}

// Función para actualizar el estado de los botones de navegación
function updateNavigationButtons() {
  prevButton.disabled = (currentIndex === 0);
  nextButton.disabled = (currentIndex === allCards.length - 1 || allCards.length === 0);
}

// Funciones de navegación entre resultados
function showPreviousCard() {
  if (currentIndex > 0) {
    currentIndex--;
    displayCurrentCard();
  }
}

function showNextCard() {
  if (currentIndex < allCards.length - 1) {
    currentIndex++;
    displayCurrentCard();
  }
}

// Función para obtener una carta aleatoria de Scryfall
async function getRandomCard() {
  try {
    const response = await fetch('https://api.scryfall.com/cards/random');
    const card = await response.json();

    // Limpiar contenedor antes de mostrar la carta aleatoria
    randomCardContainer.innerHTML = '';

    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    // Imagen (si existe)
    if (card.image_uris && card.image_uris.normal) {
      const cardImage = document.createElement('img');
      cardImage.src = card.image_uris.normal;
      cardImage.alt = card.name;
      cardElement.appendChild(cardImage);
    }

    // Nombre
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = card.name;
    cardElement.appendChild(cardTitle);

    // Tipo
    const cardType = document.createElement('p');
    cardType.textContent = card.type_line;
    cardElement.appendChild(cardType);

    // Texto de la carta (oracle_text)
    if (card.oracle_text) {
      const cardText = document.createElement('p');
      cardText.textContent = card.oracle_text;
      cardElement.appendChild(cardText);
    }

    randomCardContainer.appendChild(cardElement);
  } catch (error) {
    console.error(error);
    randomCardContainer.innerHTML = `<p>Ocurrió un error al obtener la carta aleatoria.</p>`;
  }
}

// EVENTOS
// Cuando se envía el formulario de búsqueda
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const cardName = cardNameInput.value.trim();
  if (cardName) {
    searchCards(cardName);
  }
});

// Cuando se hace clic en "Carta Aleatoria"
randomButton.addEventListener('click', getRandomCard);

// Botones de navegación (anterior/siguiente)
prevButton.addEventListener('click', showPreviousCard);
nextButton.addEventListener('click', showNextCard);
