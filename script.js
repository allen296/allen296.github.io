// -------------------------
// Randomize logic
// -------------------------
document.getElementById("randomize").addEventListener("click", async () => {
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
    const slot = document.getElementById(`player${num}-img`);
    slot.innerHTML = `<div class="loader"></div>`;

    promises.push(
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
          slot.innerHTML = `<img src="${imageUrl}" alt="${data.name}" />`;
        })
        .catch(() => {
          slot.innerHTML = `<span style="color:red;">Error</span>`;
        })
    );
  });

  await Promise.all(promises);
  button.disabled = false;
  button.textContent = "Randomize";
});


// -------------------------
// Ocultar navbar al hacer scroll
// -------------------------
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop) {
    navbar.classList.add('hide');
  } else {
    navbar.classList.remove('hide');
  }

  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});
