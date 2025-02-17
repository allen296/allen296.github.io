const track = document.getElementById("image-track");

// Función para centrar la primera imagen al cargar la página
const centerFirstImage = () => {
    const images = track.getElementsByClassName("image");
    if (images.length === 0) return;

    // Ajustar para centrar la primera imagen
    const firstImageWidth = images[0].offsetWidth;
    const viewportWidth = window.innerWidth;

    const initialPercentage = ((viewportWidth / 2) - (firstImageWidth / 2)) / viewportWidth * -100;
    
    track.dataset.percentage = initialPercentage;
    track.dataset.prevPercentage = initialPercentage;
    track.style.transform = `translate(${initialPercentage}%, -50%)`;

    for (const image of images) {
        image.style.objectPosition = `${100 + initialPercentage}% center`;
    }
};

// Función para manejar el arrastre con el ratón
const handleOnDown = e => track.dataset.mouseDownAt = e.clientX;

const handleOnUp = () => {
    track.dataset.mouseDownAt = "0";
    track.dataset.prevPercentage = track.dataset.percentage;
};

const handleOnMove = e => {
    if (track.dataset.mouseDownAt === "0") return;

    const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX,
          maxDelta = window.innerWidth / 2;

    const percentage = (mouseDelta / maxDelta) * -100,
          nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage,
          nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);

    track.dataset.percentage = nextPercentage;

    track.animate({
        transform: `translate(${nextPercentage}%, -50%)`
    }, { duration: 1200, fill: "forwards" });

    for (const image of track.getElementsByClassName("image")) {
        image.animate({
            objectPosition: `${100 + nextPercentage}% center`
        }, { duration: 1200, fill: "forwards" });
    }
};

// Añadir eventos de arrastre
window.onmousedown = e => handleOnDown(e);
window.ontouchstart = e => handleOnDown(e.touches[0]);

window.onmouseup = e => handleOnUp(e);
window.ontouchend = e => handleOnUp(e.touches[0]);

window.onmousemove = e => handleOnMove(e);
window.ontouchmove = e => handleOnMove(e.touches[0]);

// **Nuevo: Desplazamiento con la rueda del ratón**
window.addEventListener("wheel", e => {
    e.preventDefault();
    
    const scrollAmount = e.deltaY > 0 ? -5 : 5;
    const prevPercentage = parseFloat(track.dataset.percentage) || 0;
    let nextPercentage = prevPercentage + scrollAmount;

    nextPercentage = Math.max(Math.min(nextPercentage, 0), -100);
    track.dataset.percentage = nextPercentage;

    track.animate({
        transform: `translate(${nextPercentage}%, -50%)`
    }, { duration: 500, fill: "forwards" });

    for (const image of track.getElementsByClassName("image")) {
        image.animate({
            objectPosition: `${100 + nextPercentage}% center`
        }, { duration: 500, fill: "forwards" });
    }
}, { passive: false });

// Centrar la primera imagen al cargar la página
window.onload = centerFirstImage;
