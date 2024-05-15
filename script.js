function loadContent(page) {
    const content = document.getElementById('content');

    if (page === 'inicio') {
        content.innerHTML = `
            <h1>Inicio</h1>
            <p>Bienvenido a la página de inicio.</p>
        `;
    } else if (page === 'perfil') {
        content.innerHTML = `
            <h1>Perfil</h1>
            <p>Información sobre el perfil.</p>
        `;
    } else if (page === 'otros') {
        content.innerHTML = `
            <h1>Otros</h1>
            <p>Otros contenidos interesantes.</p>
        `;
    }
}
