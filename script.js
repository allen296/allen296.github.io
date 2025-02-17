/*****************************************************
 * Manejamos la lógica de la App:
 * - Búsqueda de cartas (Scryfall)
 * - Navegación de resultados (prev/next)
 * - Carta aleatoria
 * - Cambio de Tema (modificando data-theme en <html>)
 *****************************************************/

// Variables globales de resultados
let currentIndex = 0;
let cardsArray = [];

// Referencias al DOM
const searchForm = document.getElementById('searchForm');
const cardNameInput = document.getElementById('cardName');
const cardContainer = document.getElementById('cardContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const randomCardContainer = document.getElementById('randomCardContainer');
const themeSelect = document.getElementById('themeSelect');

// 1. BÚSQUEDA DE CARTAS
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cardName = cardNameInput.value.trim();
  if (!cardName) return;

  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}`);
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

// Función para mostrar la carta actual
function displayCard(card) {
  cardContainer.innerHTML = '';

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

  // Texto
  if (card.oracle_text) {
    const textEl = document.createElement('p');
    textEl.textContent = card.oracle_text;
    cardElement.appendChild(textEl);
  }

  cardContainer.appendChild(cardElement);
}

// Función para actualizar botones prev/next
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

// 2. CARTA ALEATORIA
randomBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('https://api.scryfall.com/cards/random');
    const card = await response.json();

    // Limpiar contenedor antes de mostrar la nueva carta aleatoria
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

    // Texto
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

// 3. CAMBIO DE TEMA
themeSelect.addEventListener('change', (e) => {
  const newTheme = e.target.value;
  // Accedemos a <html> y cambiamos el data-theme
  document.documentElement.setAttribute('data-theme', newTheme);
});
