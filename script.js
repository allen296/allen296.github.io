document.getElementById("sendButton").addEventListener("click", async () => {
    const userInput = document.getElementById("userInput").value;
    const responseOutput = document.getElementById("responseOutput");

    if (!userInput.trim()) {
        responseOutput.value = "Por favor, escribe algo.";
        return;
    }

    responseOutput.value = "Pensando... 🤔";

    try {
        const response = await fetch("https://api.viscosoperosabroso.com/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userInput })
        });

        const data = await response.json();
        responseOutput.value = data.reply;
    } catch (error) {
        responseOutput.value = "Hubo un error. Inténtalo de nuevo.";
    }
});
