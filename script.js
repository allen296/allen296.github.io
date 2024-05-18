document.addEventListener('DOMContentLoaded', function() {
    // Reproducir música al hacer clic en cualquier parte de la página
    let audio = new Audio('NeonNights.mp3');
    
    // Establecer el volumen deseado (un valor entre 0 y 1)
    audio.volume = 0.5; // Esto establece el volumen al 50%

    document.body.addEventListener('click', function() {
        audio.loop = true; // Reproducir en bucle
        audio.play();
        // Desvincular el evento de clic después de la primera interacción para evitar múltiples reproducciones
        document.body.removeEventListener('click', arguments.callee);
    });

    const sections = document.querySelectorAll('.section');

    // Ocultar todas las secciones excepto la de inicio al cargar la página
    sections.forEach(section => {
        if (!section.classList.contains('activo')) {
            section.style.display = 'none';
        }
    });

    // Calcula el número de grados por carácter
    const text = document.querySelector('.text');
    const chars = text.textContent.length;
    const degrees = 360 / chars;

    // Aplica la rotación individual a cada carácter
    text.textContent.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.transform = `rotate(${index * degrees}deg)`;
        text.appendChild(span);
    });
});
