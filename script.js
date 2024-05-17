document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.section');

    // Ocultar todas las secciones excepto la de inicio al cargar la página
    sections.forEach(section => {
        if (!section.classList.contains('activo')) {
            section.style.display = 'none';
        }
    });

    // Manejar el evento click en los enlaces de navegación
    document.querySelectorAll('header nav ul li a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            sections.forEach(section => {
                if (section.getAttribute('id') === targetId) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });

    // Reproducir música al cargar la página
    let audio = new Audio('ruta/a/tu/musica.mp3');

    function playMusic() {
        audio.loop = true; // Reproducir en bucle
        audio.play();
    }

    playMusic(); // Llamada a la función playMusic para iniciar la reproducción
});
