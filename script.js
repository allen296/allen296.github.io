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

    // Reproducir música cuando el usuario haga clic en cualquier lugar de la página
    let audio = new Audio('NeonNights.mp3');
    document.addEventListener('click', function() {
        audio.loop = true; // Reproducir en bucle
        audio.play();
        // Desvincular el evento de clic después de la primera interacción para evitar múltiples reproducciones
        document.removeEventListener('click', arguments.callee);
    });
});
