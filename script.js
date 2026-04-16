document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const navbar = document.querySelector(".navbar");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const navAnchors = navLinks ? [...navLinks.querySelectorAll("a[href^='#']")] : [];
  const sections = navAnchors
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  const yearNode = document.getElementById("current-year");

  const applyTheme = (theme) => {
    const isLight = theme === "light";
    body.classList.toggle("light-mode", isLight);
    themeToggle?.setAttribute("aria-pressed", String(isLight));
    localStorage.setItem("theme", theme);
  };

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);

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

  navAnchors.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 980) {
        closeMenu();
      }
    });
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

  let lastScrollTop = window.scrollY;
  let ticking = false;

  const handleNavbar = () => {
    const currentScroll = window.scrollY;
    const scrollingDown = currentScroll > lastScrollTop;
    const shouldHide = scrollingDown && currentScroll > 120;

    navbar?.classList.toggle("hide", shouldHide);
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(handleNavbar);
  }, { passive: true });

  if (sections.length && navAnchors.length) {
    const activateLink = (id) => {
      navAnchors.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateLink(entry.target.id);
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: "-10% 0px -45% 0px",
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  if (revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
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
