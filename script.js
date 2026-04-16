document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const pageLinks = [...document.querySelectorAll("[data-page-link]")];
  const pageViews = [...document.querySelectorAll(".page-view")];
  const yearNode = document.getElementById("current-year");
  const randomizeButton = document.getElementById("randomize");

  const validPages = new Set(pageViews.map((view) => view.dataset.page));

  const applyTheme = (theme) => {
    const isLight = theme === "light";
    body.classList.toggle("light-mode", isLight);
    themeToggle?.setAttribute("aria-pressed", String(isLight));
    localStorage.setItem("theme", theme);
  };

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  themeToggle?.addEventListener("click", () => {
    const nextTheme = body.classList.contains("light-mode") ? "dark" : "light";
    applyTheme(nextTheme);
  });

  const closeMenu = () => {
    if (!navLinks || !menuToggle) return;
    navLinks.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  };

  menuToggle?.addEventListener("click", () => {
    if (!navLinks || !menuToggle) return;
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    body.classList.toggle("menu-open", isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!navLinks || !menuToggle) return;
    const target = event.target;

    if (!(target instanceof Node)) return;

    if (
      navLinks.classList.contains("is-open") &&
      !navLinks.contains(target) &&
      !menuToggle.contains(target)
    ) {
      closeMenu();
    }
  });

  const setPage = (page, updateHash = false) => {
    const nextPage = validPages.has(page) ? page : "inicio";

    pageViews.forEach((view) => {
      view.classList.toggle("is-active", view.dataset.page === nextPage);
    });

    pageLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.pageLink === nextPage);
    });

    document.title = `Antonio Valladares | ${nextPage.charAt(0).toUpperCase()}${nextPage.slice(1)}`;
    body.dataset.page = nextPage;
    closeMenu();

    if (updateHash && window.location.hash !== `#${nextPage}`) {
      window.location.hash = nextPage;
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  pageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetPage = link.dataset.pageLink;
      if (!targetPage) return;

      event.preventDefault();
      setPage(targetPage, true);
    });
  });

  window.addEventListener("hashchange", () => {
    const pageFromHash = window.location.hash.replace("#", "") || "inicio";
    setPage(pageFromHash);
  });

  setPage(window.location.hash.replace("#", "") || "inicio");

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadCardImage = (image, source) =>
    new Promise((resolve, reject) => {
      const preload = new Image();

      preload.onload = () => {
        image.src = source;
        resolve();
      };

      preload.onerror = () => {
        reject(new Error("No se pudo cargar la imagen."));
      };

      preload.src = source;
    });

  const resetCard = (container, image, status, message) => {
    container.classList.remove("flipped", "loading");
    container.classList.add("unflipped");
    image.removeAttribute("src");
    status.textContent = message;
  };

  if (randomizeButton) {
    randomizeButton.addEventListener("click", async () => {
      const originalLabel = randomizeButton.textContent;
      randomizeButton.disabled = true;
      randomizeButton.textContent = "Cargando...";

      const players = [1, 2, 3, 4];

      const jobs = players.map(async (num) => {
        const container = document.getElementById(`player${num}-img`);
        const frontImg = container?.querySelector(".card-front img");
        const status = document.getElementById(`player${num}-status`);
        const locked = document.getElementById(`lock${num}`)?.checked;

        if (!container || !frontImg || !status) {
          return;
        }

        if (locked) {
          return;
        }

        const randomAny = document.getElementById(`random${num}`)?.checked;
        const legendary = document.getElementById(`legendary${num}`)?.checked;
        const colors = [...document.querySelectorAll(`input[data-color][data-player="${num}"]:checked`)]
          .map((input) => input.value)
          .sort()
          .join("");

        let query = legendary
          ? "is:commander legal:commander (type:creature or type:planeswalker)"
          : "legal:commander type:creature";

        if (colors) {
          const identityOperator = randomAny ? "<=" : "=";
          query += ` identity${identityOperator}${colors}`;
        }

        const url = `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`;

        container.classList.remove("flipped", "unflipped", "loading");
        void container.offsetWidth;
        container.classList.add("unflipped", "loading");
        status.textContent = "Buscando carta...";

        try {
          const fetchPromise = fetch(url).then((response) => {
            if (!response.ok) {
              throw new Error(`Scryfall respondió con ${response.status}`);
            }
            return response.json();
          });

          const [data] = await Promise.all([fetchPromise, delay(320)]);
          const imageUrl = data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal;
          const typeLine = data.type_line || data.card_faces?.[0]?.type_line || "Carta encontrada";

          if (!imageUrl) {
            throw new Error("La carta no trae imagen utilizable.");
          }

          await loadCardImage(frontImg, imageUrl);
          container.classList.remove("loading", "unflipped");
          container.classList.add("flipped");
          status.textContent = `${data.name} · ${typeLine}`;
        } catch (error) {
          resetCard(container, frontImg, status, "No se pudo cargar una carta ahora mismo.");
        }
      });

      await Promise.all(jobs);
      randomizeButton.disabled = false;
      randomizeButton.textContent = originalLabel;
    });
  }

  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      closeMenu();
    }
  });
});
