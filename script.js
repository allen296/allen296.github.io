document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const links = document.querySelectorAll(".sidebar a");

    function initializeGallery() {
        const track = document.getElementById("image-track");
        if (!track) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        track.addEventListener("mousedown", (e) => {
            isDown = true;
            track.classList.add("active");
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        track.addEventListener("mouseleave", () => {
            isDown = false;
            track.classList.remove("active");
        });

        track.addEventListener("mouseup", () => {
            isDown = false;
            track.classList.remove("active");
        });

        track.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 2;
            track.scrollLeft = scrollLeft - walk;
        });
    }

    const sections = {
        "antonio": `
            <div id='image-track'>
                <img class='image' src='https://images.unsplash.com/photo-1524781289445-ddf8f5695861?auto=format&fit=crop&w=1770&q=80' draggable='false' />
                <img class='image' src='https://images.unsplash.com/photo-1610194352361-4c81a6a8967e?auto=format&fit=crop&w=1674&q=80' draggable='false' />
                <img class='image' src='https://images.unsplash.com/photo-1618202133208-2907bebba9e1?auto=format&fit=crop&w=1770&q=80' draggable='false' />
            </div>`,
        "cv": "<h1>Curriculum Vitae</h1><p>Details about work experience, education, and projects.</p>",
        "email": "<h1>Contact Me</h1><p>Email: example@example.com</p>",
        "twitter": "<h1>Follow me on Twitter</h1><p>Twitter handle: @example</p>",
        "linkedin": "<h1>Connect on LinkedIn</h1><p>LinkedIn profile link.</p>"
    };

    links.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const sectionName = link.getAttribute("data-section");
            content.innerHTML = sections[sectionName] || "<h1>Content not available</h1>";
            if (sectionName === "antonio") initializeGallery();
        });
    });
});
