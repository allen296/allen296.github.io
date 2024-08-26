let audio = new Audio('NeonNights.mp3');
let isPlaying = false;

document.body.addEventListener('click', function() {
    if (!isPlaying) {
        audio.loop = true; // Reproducir en bucle
        audio.play();
        isPlaying = true;
    }
});
