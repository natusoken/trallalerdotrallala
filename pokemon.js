
async function getPokemonInfo(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        if (!response.ok) throw new Error('Pokémon not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
        return null;
    }
}

async function getSpeciesInfo(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
        if (!response.ok) throw new Error('Species not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching species:', error);
        return null;
    }
}

async function getEvolutionChain(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Evolution chain not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching evolution chain:', error);
        return null;
    }
}

async function getTypeInfo(typeName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${typeName.toLowerCase()}`);
        if (!response.ok) throw new Error('Type not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching type:', error);
        return null;
    }
}

async function displayPokemonInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const pokemonName = urlParams.get('id');

    if (!pokemonName) {
        document.getElementById('pokemonName').textContent = 'No Pokémon selected';
        return;
    }

    const pokemon = await getPokemonInfo(pokemonName);
    if (!pokemon) {
        document.getElementById('pokemonName').textContent = 'Pokémon not found';
        return;
    }

    // Basic Info
    document.getElementById('pokemonName').textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    document.getElementById('pokemonImage').src = pokemon.sprites.front_default || 'path/to/placeholder.png';
    document.getElementById('pokemonHeight').textContent = (pokemon.height / 10).toFixed(1);
    document.getElementById('pokemonWeight').textContent = (pokemon.weight / 10).toFixed(1);
    document.getElementById('pokemonBaseExp').textContent = pokemon.base_experience || 'N/A';
    document.getElementById('pokemonId').textContent = pokemon.id;

    // Species Info
    const species = await getSpeciesInfo(pokemonName);
    if (species) {
        document.getElementById('pokemonSpecies').textContent = species.genera.find(g => g.language.name === 'en')?.genus || 'Unknown';
        document.getElementById('pokemonDescription').textContent = species.flavor_text_entries.find(f => f.language.name === 'en')?.flavor_text.replace(/\n/g, ' ') || 'No description available';
        document.getElementById('pokemonHabitat').textContent = species.habitat?.name.charAt(0).toUpperCase() + species.habitat?.name.slice(1) || 'Unknown';
        document.getElementById('pokemonCaptureRate').textContent = species.capture_rate || 'N/A';
        const genderRate = species.gender_rate;
        if (genderRate === -1) {
            document.getElementById('pokemonGender').textContent = 'Genderless';
        } else {
            const femalePercent = (genderRate / 8) * 100;
            document.getElementById('pokemonGender').textContent = `${femalePercent}% ♀ / ${100 - femalePercent}% ♂`;
        }
    } else {
        document.getElementById('pokemonSpecies').textContent = 'N/A';
        document.getElementById('pokemonDescription').textContent = 'N/A';
        document.getElementById('pokemonHabitat').textContent = 'N/A';
        document.getElementById('pokemonCaptureRate').textContent = 'N/A';
        document.getElementById('pokemonGender').textContent = 'N/A';
    }

    // Types
    const typesContainer = document.getElementById('pokemonTypes');
    typesContainer.innerHTML = '';
    pokemon.types.forEach(type => {
        const typeImg = document.createElement('img');
        typeImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${type.type.name}.png`;
        typeImg.alt = type.type.name;
        typeImg.title = type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1);
        typesContainer.appendChild(typeImg);
    });

    // Type Effectiveness
    const typeEffectContainer = document.getElementById('pokemonTypeEffect');
    typeEffectContainer.innerHTML = '';
    const typeEffects = { weak: [], resist: [], immune: [] };
    for (const type of pokemon.types) {
        const typeData = await getTypeInfo(type.type.name);
        if (typeData) {
            typeData.damage_relations.double_damage_from.forEach(t => typeEffects.weak.push(t.name));
            typeData.damage_relations.half_damage_from.forEach(t => typeEffects.resist.push(t.name));
            typeData.damage_relations.no_damage_from.forEach(t => typeEffects.immune.push(t.name));
        }
    }
    typeEffects.weak = [...new Set(typeEffects.weak)].filter(t => !typeEffects.resist.includes(t) && !typeEffects.immune.includes(t));
    typeEffects.resist = [...new Set(typeEffects.resist)].filter(t => !typeEffects.weak.includes(t) && !typeEffects.immune.includes(t));
    typeEffects.immune = [...new Set(typeEffects.immune)];
    ['weak', 'resist', 'immune'].forEach(category => {
        if (typeEffects[category].length > 0) {
            const p = document.createElement('p');
            p.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)}: ${typeEffects[category].join(', ')}`;
            typeEffectContainer.appendChild(p);
        }
    });

    // Abilities
    const abilitiesContainer = document.getElementById('pokemonAbilities');
    abilitiesContainer.innerHTML = '';
    pokemon.abilities.forEach(ability => {
        const abilityElement = document.createElement('div');
        abilityElement.textContent = ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1);
        abilityElement.classList.add('move');
        abilityElement.onclick = () => showAbilityInfo(ability.ability.name);
        abilitiesContainer.appendChild(abilityElement);
    });

    // Moves
    const movesContainer = document.getElementById('pokemonMoves');
    movesContainer.innerHTML = '';
    const maxMoves = 5;
    pokemon.moves.slice(0, maxMoves).forEach(move => {
        const moveElement = document.createElement('div');
        moveElement.classList.add('move');
        moveElement.textContent = move.move.name.charAt(0).toUpperCase() + move.move.name.slice(1);
        movesContainer.appendChild(moveElement);
    });

    // Stats
    const statsContainer = document.getElementById('pokemonStats');
    statsContainer.innerHTML = '';
    pokemon.stats.forEach(stat => {
        const statElement = document.createElement('p');
        const statName = stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1);
        statElement.textContent = `${statName}: ${stat.base_stat}`;
        const bar = document.createElement('div');
        bar.classList.add('stat-bar');
        const fill = document.createElement('div');
        fill.classList.add('stat-fill');
        fill.style.width = `${Math.min((stat.base_stat / 255) * 100, 100)}%`;
        bar.appendChild(fill);
        statElement.appendChild(bar);
        statsContainer.appendChild(statElement);
    });

    // Evolution Chain
    const evolutionContainer = document.getElementById('pokemonEvolution');
    evolutionContainer.innerHTML = '';
    if (species?.evolution_chain) {
        const evolutionData = await getEvolutionChain(species.evolution_chain.url);
        if (evolutionData) {
            const chain = [];
            let current = evolutionData.chain;
            while (current) {
                chain.push(current.species.name);
                current = current.evolves_to[0];
            }
            chain.forEach((name, index) => {
                const evoElement = document.createElement('span');
                evoElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
                evoElement.classList.add('evo-item');
                evoElement.onclick = () => window.location.search = `?id=${name}`;
                evolutionContainer.appendChild(evoElement);
                if (index < chain.length - 1) {
                    const arrow = document.createElement('span');
                    arrow.textContent = ' → ';
                    evolutionContainer.appendChild(arrow);
                }
            });
        }
    }
}

async function showAbilityInfo(abilityName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/ability/${abilityName.toLowerCase()}`);
        if (!response.ok) throw new Error('Ability not found');
        const ability = await response.json();

        document.getElementById('abilityName').textContent = abilityName.charAt(0).toUpperCase() + abilityName.slice(1);
        document.getElementById('abilityDescription').textContent = ability.effect_entries.find(entry => entry.language.name === 'en')?.effect || 'No description available';

        const modal = document.getElementById('abilityModal');
        modal.style.display = 'block';

        document.getElementsByClassName('close')[0].onclick = () => {
            modal.style.display = 'none';
        };
    } catch (error) {
        console.error('Error fetching ability:', error);
        document.getElementById('abilityDescription').textContent = 'Error loading ability info';
    }
}

function changePokemon(offset) {
    const urlParams = new URLSearchParams(window.location.search);
    let pokemonId = parseInt(urlParams.get('id')) || 1;
    pokemonId += offset;
    if (pokemonId < 1) pokemonId = 1;
    if (pokemonId > 1025) pokemonId = 1025;
    window.location.search = `?id=${pokemonId}`;
}

window.onclick = function (event) {
    const modal = document.getElementById('abilityModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', displayPokemonInfo);