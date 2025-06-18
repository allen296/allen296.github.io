// -------------------------
// TEMA CLARO / OSCURO
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    document.body.classList.add('light-mode');
  }

  toggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
});

// -------------------------
// OCULTAR NAVBAR AL SCROLL
// -------------------------
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop) {
      navbar.classList.add('hide');
    } else {
      navbar.classList.remove('hide');
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
}

// -------------------------
// RANDOMIZE Scryfall (solo commander.html)
// -------------------------
const randomizeButton = document.getElementById("randomize");

if (randomizeButton) {
  randomizeButton.addEventListener("click", async () => {
    const button = document.getElementById("randomize");
    button.disabled = true;
    button.textContent = "Cargando...";

    const players = [1, 2, 3, 4];
    const promises = [];

    players.forEach(num => {
      const locked = document.getElementById(`lock${num}`).checked;
      if (locked) return;

      const randomAny = document.getElementById(`random${num}`).checked;
      const legendary = document.getElementById(`legendary${num}`).checked;

      const colors = [...document.querySelectorAll(`input[data-color][data-player="${num}"]:checked`)]
        .map(c => c.value)
        .sort()
        .join("");

      let query = legendary
        ? "is:commander legal:commander (type:creature or type:planeswalker)"
        : "legal:commander type:creature";

      if (!randomAny && colors) {
        query += ` identity<=${colors}`;
      }

      const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
      const container = document.getElementById(`player${num}-img`);
      const frontImg = container.querySelector(".card-front img");
      const flipWrapper = container; // Ya es la card-container

      // Reiniciar animación si ya estaba girada
      //flipWrapper.classList.remove("flipped");
      //frontImg.src = "";
      
      // Primero gira la carta de vuelta al dorso
      flipWrapper.classList.remove("flipped");
      flipWrapper.classList.add("unflipped");

      // Espera a que termine la animación (0.8s) antes de cargar la nueva carta
      setTimeout(() => {
      const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;
      frontImg.src = ""; // Limpia la imagen vieja

      fetch(url)
        .then(res => res.json())
        .then(data => {
      const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
      frontImg.src = imageUrl;

      frontImg.onload = () => {
        flipWrapper.classList.remove("unflipped");
        flipWrapper.classList.add("flipped");
      };
    })
    .catch(() => {
      frontImg.src = "";
      container.innerHTML += `<span style="color:red;">Error</span>`;
        });
      }, 800); // Espera a que la carta se vuelva a cerrar antes de seguir

      
      container.classList.add("loading");

      promises.push(
        fetch(url)
          .then(res => res.json())
          .then(data => {
            const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
            frontImg.src = imageUrl;

            frontImg.onload = () => {
              flipWrapper.classList.add("flipped");
              container.classList.remove("loading");
            };
          })
          .catch(() => {
            frontImg.src = "";
            container.classList.remove("loading");
            container.innerHTML += `<span style="color:red;">Error</span>`;
          })
      );
    });

    await Promise.all(promises);
    button.disabled = false;
    button.textContent = "Randomize";
  });
}
