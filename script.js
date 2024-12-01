const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';

let selectedCryptos = JSON.parse(localStorage.getItem('selectedCryptos')) || [];
let favoriteCryptos = JSON.parse(localStorage.getItem('favoriteCryptos')) || [];
let cryptoDataCache = [];
let currentSort = 'price'; // Default sorting option
let displayView = 'grid'; // Default display view

document.addEventListener('DOMContentLoaded', () => {
    fetchCryptoData();
    loadSelectedCryptos();
    loadFavoriteCryptos();
    document.getElementById('compare-button').addEventListener('click', displayComparison);
    document.getElementById('view-toggle').addEventListener('change', toggleView); // Listen for view toggle changes
    setInterval(fetchCryptoData, 60000); // Fetch data every minute
});

function fetchCryptoData() {
    showLoadingIndicator();
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            cryptoDataCache = data;
            displayCryptos(data);
        })
        .catch(error => {
            console.error('Error fetching crypto data:', error);
            alert('Failed to fetch cryptocurrency data. Please try again later.');
        })
        .finally(() => {
            hideLoadingIndicator();
        });
}

function displayCryptos(data) {
    const cryptoDataContainer = document.getElementById('crypto-data');
    cryptoDataContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    data.sort(sortCryptos).forEach(crypto => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <input type="checkbox" id="${crypto.id}" ${selectedCryptos.includes(crypto.id) ? 'checked' : ''} 
            ${selectedCryptos.length >= 5 && !selectedCryptos.includes(crypto.id) ? 'disabled' : ''} 
            onclick="limitSelection(this)">
            <label for="${crypto.id}">${crypto.name} (${crypto.symbol.toUpperCase()})</label>
            <div>Current Price: $${crypto.current_price.toFixed(2)}</div>
            <button onclick="toggleFavorite('${crypto.id}')">❤️</button>
        `;
        fragment.appendChild(card);
    });

    cryptoDataContainer.appendChild(fragment);

    updateDisplayView(); // Apply the selected view layout
}

function updateDisplayView() {
    const cryptoDataContainer = document.getElementById('crypto-data');
    if (displayView === 'list') {
        cryptoDataContainer.classList.remove('grid-view');
        cryptoDataContainer.classList.add('list-view');
    } else {
        cryptoDataContainer.classList.remove('list-view');
        cryptoDataContainer.classList.add('grid-view');
    }
}

function toggleView(event) {
    displayView = event.target.value; // Get selected view (list/grid)
    localStorage.setItem('displayView', displayView); // Save user preference
    updateDisplayView(); // Update the view immediately
}

function updateSorting() {
    currentSort = document.getElementById('sorting-options').value;
    displayCryptos(cryptoDataCache);
}

function sortCryptos(a, b) {
    switch (currentSort) {
        case 'price':
            return b.current_price - a.current_price;
        case 'market_cap':
            return b.market_cap - a.market_cap;
        case 'price_change':
            return b.price_change_percentage_24h - a.price_change_percentage_24h;
        default:
            return 0;
    }
}

function toggleFavorite(cryptoId) {
    if (favoriteCryptos.includes(cryptoId)) {
        favoriteCryptos = favoriteCryptos.filter(id => id !== cryptoId);
    } else {
        favoriteCryptos.push(cryptoId);
    }
    localStorage.setItem('favoriteCryptos', JSON.stringify(favoriteCryptos));
    loadFavoriteCryptos();
}

function loadFavoriteCryptos() {
    const favoritesSection = document.getElementById('favorites-section');
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';

    favoriteCryptos.forEach(cryptoId => {
        const crypto = cryptoDataCache.find(c => c.id === cryptoId);
        if (crypto) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="favorite-header">${crypto.name} (${crypto.symbol.toUpperCase()})</div>
                <div>Price: $${crypto.current_price.toFixed(2)}</div>
                <button onclick="toggleFavorite('${crypto.id}')">❤️</button>
            `;
            favoritesList.appendChild(card);
        }
    });

    favoritesSection.style.display = favoritesList.children.length > 0 ? 'block' : 'none';
}

function toggleFavorites() {
    const favoritesSection = document.getElementById('favorites-section');
    favoritesSection.style.display = favoritesSection.style.display === 'none' ? 'block' : 'none';
}

function limitSelection(checkbox) {
    const maxSelection = 5;
    const selectedCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));

    if (selectedCheckboxes.length > maxSelection) {
        alert(`You can only select up to ${maxSelection} cryptocurrencies.`);
        checkbox.checked = false;
    } else {
        const selectedId = checkbox.id;
        if (checkbox.checked && !selectedCryptos.includes(selectedId)) {
            selectedCryptos.push(selectedId);
        } else {
            selectedCryptos = selectedCryptos.filter(id => id !== selectedId);
        }

        localStorage.setItem('selectedCryptos', JSON.stringify(selectedCryptos));
    }
}

function loadSelectedCryptos() {
    const selectionLimitMessage = document.getElementById('selection-warning');
    if (selectedCryptos.length >= 5) {
        selectionLimitMessage.textContent = 'You have reached the maximum selection of 5 cryptocurrencies.';
    } else {
        selectionLimitMessage.textContent = '';
    }
}

function displayComparison() {
    const comparisonList = document.getElementById('comparison-list');
    comparisonList.innerHTML = '';

    // Fetch selected cryptocurrencies data
    selectedCryptos.forEach(cryptoId => {
        const crypto = cryptoDataCache.find(c => c.id === cryptoId);
        if (crypto) {
            const card = document.createElement('div');
            card.className = 'comparison-card';
            card.innerHTML = `
                <div class="comparison-header">${crypto.name} (${crypto.symbol.toUpperCase()})</div>
                <div>Price: $${crypto.current_price.toFixed(2)}</div>
                <div>Market Cap: $${crypto.market_cap.toFixed(2)}</div>
                <div>24h Change: ${crypto.price_change_percentage_24h.toFixed(2)}%</div>
            `;
            comparisonList.appendChild(card);
        }
    });

    // Show the comparison section if there are selected cryptos
    const comparisonSection = document.getElementById('comparison-section');
    if (selectedCryptos.length > 0) {
        comparisonSection.style.display = 'block';
    } else {
        comparisonSection.style.display = 'none';
    }
}

function showLoadingIndicator() {
    document.getElementById('crypto-data').innerHTML = '<div>Loading...</div>';
}

function hideLoadingIndicator() {
    document.getElementById('crypto-data').innerHTML = '';
}
