// Referencia a elementos del DOM
const searchForm = document.getElementById('searchForm');
const cardNameInput = document.getElementById('cardNameInput');
const searchResults = document.getElementById('searchResults');
const randomButton = document.getElementById('randomButton');
const randomCardContainer = document.getElementById('randomCardContainer');

// Función para buscar cartas por nombre
async function searchCards(cardName) {
  try {
    // Usamos el endpoint de Scryfall para buscar por nombre
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}`);
    const data = await response.json();
    
    // Si no hay resultados o algún error
    if (!data.data) {
      searchResults.innerHTML = `<p>No se encontró ninguna coincidencia.</p>`;
      return;
    }

    // Limpiamos el contenedor antes de mostrar nuevos resultados
    searchResults.innerHTML = '';
    
    // Mostramos un máximo de 5 resultados
    data.data.slice(0, 5).forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');

      // Agregamos imagen si existe
      if (card.image_uris && card.image_uris.normal) {
        const cardImage = document.createElement('img');
        cardImage.src = card.image_uris.normal;
        cardImage.alt = card.name;
        cardElement.appendChild(cardImage);
      }

      // Agregamos nombre y tipo
      const cardTitle = document.createElement('h3');
      cardTitle.textContent = card.name;
      cardElement.appendChild(cardTitle);

      const cardType = document.createElement('p');
      cardType.textContent = card.type_line;
      cardElement.appendChild(cardType);

      // Agregamos texto de la carta si está disponible
      if (card.oracle_text) {
        const cardText = document.createElement('p');
        cardText.textContent = card.oracle_text;
        cardElement.appendChild(cardText);
      }

      // Agregamos el cardElement al contenedor de resultados
      searchResults.appendChild(cardElement);
    });
  } catch (error) {
    console.error(error);
    searchResults.innerHTML = `<p>Ocurrió un error al realizar la búsqueda.</p>`;
  }
}

// Función para obtener una carta aleatoria
async function getRandomCard() {
  try {
    const response = await fetch('https://api.scryfall.com/cards/random');
    const card = await response.json();

    // Limpiar contenedor antes de mostrar la carta aleatoria
    randomCardContainer.innerHTML = '';

    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    // Imagen
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

    // Texto de la carta
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

// Listener para el formulario de búsqueda
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const cardName = cardNameInput.value.trim();
  if (cardName) {
    searchCards(cardName);
  }
});

// Listener para obtener carta aleatoria
randomButton.addEventListener('click', getRandomCard);
