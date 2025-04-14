
let offset = 0;
const limit = 10;
let currentType = 'all';
let loggedInUser = localStorage.getItem('loggedInUser');

function updateAuthUI() {
    const authNav = document.getElementById('auth-nav');
    const list = document.getElementById('list');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const notLoggedIn = document.getElementById('not-logged-in');

    if (loggedInUser) {
        authNav.innerHTML = `
            <li><a href="#" id="welcome">Welcome, ${loggedInUser}</a></li>
            <li><a href="#" id="logoutBtn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
        `;
        list.style.display = 'grid';
        loadMoreBtn.style.display = currentType === 'all' ? 'block' : 'none';
        notLoggedIn.style.display = 'none';

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            loggedInUser = null;
            updateAuthUI();
            list.innerHTML = '';
            offset = 0;
            currentType = 'all';
        });
    } else {
        authNav.innerHTML = `
            <li><a href="#" id="signUpBtn"><span class="glyphicon glyphicon-user"></span> Sign Up</a></li>
            <li><a href="#" id="loginBtn"><span class="glyphicon glyphicon-log-in"></span> Login</a></li>
        `;
        list.style.display = 'none';
        loadMoreBtn.style.display = 'none';
        notLoggedIn.style.display = 'block';

        document.getElementById('signUpBtn').addEventListener('click', (e) => {
            e.preventDefault();
            signUpModal.style.display = 'flex';
        });

        document.getElementById('loginBtn').addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });

        document.getElementById('loginPrompt').addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
    }
}

async function getListPokemon(limit, offset) {
    let listPokemon = [];
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    data.results.forEach(item => {
        listPokemon.push(item.name);
    });
    return listPokemon;
}

async function getPokemonInfo(pokemonName) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    return await response.json();
}

async function getPokemonByType(type) {
    if (type === 'all') return getListPokemon(limit, 0);
    const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    const data = await response.json();
    return data.pokemon.map(p => p.pokemon.name).slice(0, limit);
}

function preloadImages(urls) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

async function getInformationHome(_id, newPokemonList) {
    const lst = document.getElementById(_id);
    
    for (let pokemonName of newPokemonList) {
        const pokemon = await getPokemonInfo(pokemonName);
        
        const itemElement = document.createElement('div');
        itemElement.classList.add('item');
        
        itemElement.innerHTML = `
            <a href="pokemon.html?id=${pokemonName}">
                <img src="${pokemon.sprites.front_default}"   
                     data-back="${pokemon.sprites.back_default}"   
                     class="pokemon-img">  
            </a>
            <h3>${pokemon.name}</h3>  
        `;
        
        lst.appendChild(itemElement);
        preloadImages([pokemon.sprites.back_default]);
        
        const imgElement = itemElement.querySelector('.pokemon-img');
        imgElement.addEventListener('mouseenter', () => {
            imgElement.src = imgElement.dataset.back;
        });
        imgElement.addEventListener('mouseleave', () => {
            imgElement.src = pokemon.sprites.front_default;
        });
    }
}

document.getElementById('loadMoreBtn').addEventListener('click', async function() {
    if (!loggedInUser) {
        alert('Please login to load more Pokémon!');
        loginModal.style.display = 'flex';
        return;
    }
    if (currentType === 'all') {
        let newPokemonList = await getListPokemon(limit, offset);
        getInformationHome('list', newPokemonList);
        offset += limit;
    }
});

async function filterType(type) {
    if (!loggedInUser) {
        alert('Please login to filter Pokémon!');
        loginModal.style.display = 'flex';
        return;
    }
    currentType = type;
    offset = 0;
    document.getElementById('list').innerHTML = '';
    let pokemonList = await getPokemonByType(type);
    getInformationHome('list', pokemonList);
    document.getElementById('loadMoreBtn').style.display = type === 'all' ? 'block' : 'none';
}

const signUpModal = document.getElementById('signUpModal');
const loginModal = document.getElementById('loginModal');
const closeButtons = document.getElementsByClassName('close');

for (let closeBtn of closeButtons) {
    closeBtn.addEventListener('click', () => {
        signUpModal.style.display = 'none';
        loginModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target === signUpModal) {
        signUpModal.style.display = 'none';
    }
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

document.getElementById('signUpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signUpUsername').value.trim();
    const password = document.getElementById('signUpPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(user => user.username === username)) {
        alert('Username already exists!');
        return;
    }

    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Sign Up successful! Please login.');
    signUpModal.style.display = 'none';
    document.getElementById('signUpForm').reset();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        loggedInUser = username;
        localStorage.setItem('loggedInUser', username);
        alert(`Welcome back, ${username}!`);
        loginModal.style.display = 'none';
        document.getElementById('loginForm').reset();
        updateAuthUI();
        
        (async () => {
            let initialPokemonList = await getListPokemon(limit, 0);
            getInformationHome('list', initialPokemonList);
            offset = limit;
        })();
    } else {
        alert('Invalid username or password!');
    }
});

updateAuthUI();