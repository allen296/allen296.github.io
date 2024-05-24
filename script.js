/* let audio = new Audio('NeonNights.mp3');
let isPlaying = false;

document.body.addEventListener('click', function() {
    if (!isPlaying) {
        audio.loop = true; // Reproducir en bucle
        audio.play();
        isPlaying = true;
    }
});
*/

function calculateModifier(score) {
    return Math.floor((score - 10) / 2);
}

function getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1;
}

function updateProficiencyBonusAndModifiers() {
    const level = parseInt(document.getElementById('level').value) || 1;
    const proficiencyBonus = getProficiencyBonus(level);
    document.getElementById('proficiency-bonus').innerText = `+${proficiencyBonus}`;
    updateModifiers();
}

function updateModifiers() {
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const level = parseInt(document.getElementById('level').value) || 1;
    const proficiencyBonus = getProficiencyBonus(level);

    stats.forEach(stat => {
        const statValue = parseInt(document.getElementById(stat).value) || 0;
        const modValue = calculateModifier(statValue);
        document.getElementById(`${stat}-mod`).innerText = modValue >= 0 ? `+${modValue}` : `${modValue}`;

        // Update saving throws if checkbox is checked
        if (document.getElementById(`${stat}-save`).checked) {
            const saveMod = modValue + proficiencyBonus;
            document.getElementById(`${stat}-save-mod`).innerText = saveMod >= 0 ? `+${saveMod}` : `${saveMod}`;
        } else {
            document.getElementById(`${stat}-save-mod`).innerText = modValue >= 0 ? `+${modValue}` : `${modValue}`;
        }
    });

    // Update skill modifiers
    const skills = [
        { id: 'acrobatics', stat: 'dexterity' },
        { id: 'animal-handling', stat: 'wisdom' }
        // Add more skills as needed
    ];

    skills.forEach(skill => {
        const statValue = parseInt(document.getElementById(skill.stat).value) || 0;
        const modValue = calculateModifier(statValue);
        const proficiencyCheckbox = document.getElementById(skill.id);
        const expertiseCheckbox = document.getElementById(`${skill.id}-expertise`);

        let skillMod = modValue;
        if (proficiencyCheckbox.checked && expertiseCheckbox.checked) {
            skillMod += proficiencyBonus * 2;
        } else if (proficiencyCheckbox.checked) {
            skillMod += proficiencyBonus;
        }

        document.getElementById(`${skill.id}-mod`).innerText = skillMod >= 0 ? `+${skillMod}` : `${skillMod}`;
    });
}

// Initialize modifiers on page load
window.onload = updateProficiencyBonusAndModifiers;
