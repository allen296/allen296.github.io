document.body.addEventListener('click', function() {
    let audio = new Audio('NeonNights.mp3');
    audio.play();
    // Desvincular el evento de clic después de la primera interacción para evitar múltiples reproducciones
    document.body.removeEventListener('click', arguments.callee);
});
