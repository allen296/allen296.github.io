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

    // Reproducir música al pasar el ratón sobre la imagen
    let audio = new Audio('NeonNights.mp3');
    document.getElementById('startMusicImage').addEventListener('mouseover', function() {
        audio.loop = true; // Reproducir en bucle
        audio.play();
        // Desvincular el evento de ratón después de la primera interacción para evitar múltiples reproducciones
        document.getElementById('startMusicImage').removeEventListener('mouseover', arguments.callee);
    });
});
