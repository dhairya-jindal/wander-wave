import { MapManager } from './MapManager.js';
import { MapConfig } from './mapConfig.js';

// --- Load modal CSS ---
const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = 'mapFeature/mapModal.css';
document.head.appendChild(cssLink);

// --- Singleton MapManager instances ---
const mainMapManager = new MapManager();
const miniMapManager = new MapManager();

// --- Inject Modal HTML ---
const modalHtml = `
<div id="map-modal">
    <div id="map-modal-header">
        <span id="map-modal-title">Interactive Map</span>
        <button id="map-modal-close">×</button>
    </div>
    <div id="map-modal-body">
        <div id="live-map-container">
            <div class="map-fallback" id="map-fallback" style="display:none">
                🗺️ Map unavailable — check your connection.
            </div>
        </div>
        <div class="map-info-panel">
            <h3>Map Layers</h3>
            <div class="map-layer-toggle">
                <button class="map-layer-btn active" id="btn-all">🌐 Show All Zones</button>
                <button class="map-layer-btn" id="btn-green">🟢 Hotspots Only</button>
                <button class="map-layer-btn" id="btn-red">🔴 Caution Zones Only</button>
            </div>
            <h3 style="margin-top: 2rem;">Legend</h3>
            <div class="map-legend-item"><div class="legend-dot green"></div> Tourist Hotspots</div>
            <div class="map-legend-item"><div class="legend-dot red"></div> Caution / Risk Areas</div>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHtml);

// --- Modal open / close ---
let currentDestId = null;

async function openMapModal(destId, destTitle) {
    currentDestId = destId;
    const modal = document.getElementById('map-modal');
    document.getElementById('map-modal-title').innerText = `${destTitle} — Interactive Map`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        await mainMapManager.init('live-map-container', destId);
        mainMapManager.showAllLayers();
    } catch (e) {
        document.getElementById('map-fallback').style.display = 'flex';
        console.error('Map init failed:', e);
    }
    
    setActiveLayerBtn('btn-all');
}

function closeMapModal() {
    const modal = document.getElementById('map-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    mainMapManager.destroy();
}

document.getElementById('map-modal-close').addEventListener('click', closeMapModal);

// --- Layer toggle buttons ---
function setActiveLayerBtn(id) {
    ['btn-all', 'btn-green', 'btn-red'].forEach(bid => {
        document.getElementById(bid).classList.toggle('active', bid === id);
    });
}

document.getElementById('btn-all').addEventListener('click', () => {
    mainMapManager.showAllLayers();
    setActiveLayerBtn('btn-all');
});
document.getElementById('btn-green').addEventListener('click', () => {
    if (mainMapManager.map) {
        if (mainMapManager.redLayer) mainMapManager.map.removeLayer(mainMapManager.redLayer);
        mainMapManager.showLayer('green');
    }
    setActiveLayerBtn('btn-green');
});
document.getElementById('btn-red').addEventListener('click', () => {
    if (mainMapManager.map) {
        if (mainMapManager.greenLayer) mainMapManager.map.removeLayer(mainMapManager.greenLayer);
        mainMapManager.showLayer('red');
    }
    setActiveLayerBtn('btn-red');
});

// --- Inject "View Map" buttons on destination cards ---
function augmentDestCards() {
    const destSections = document.querySelectorAll(
        'section[data-theme="bali"], section[data-theme="croatia"], section[data-theme="maldives"]'
    );
    destSections.forEach(section => {
        const destId = section.getAttribute('data-id');
        const destTitle = section.querySelector('.location').innerText;
        const actionRow = section.querySelector('.card-actions');
        if (!actionRow) return;
        
        // Prevent double-injection
        if (actionRow.querySelector('.map-open-btn')) return;
        
        const mapBtn = document.createElement('button');
        mapBtn.className = 'pill-btn map-open-btn';
        mapBtn.innerHTML = `MAP <span>🗺️</span>`;
        mapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMapModal(destId, destTitle);
        });
        actionRow.appendChild(mapBtn);
    });
}

// --- Mini-map inside flight sidebar (called by flightEngine externally) ---
export async function showFlightMiniMap(destId) {
    // Inject mini-map div into flight-sidebar if not there
    const sidebar = document.getElementById('flight-sidebar');
    if (!sidebar) return;
    
    let miniContainer = document.getElementById('flight-mini-map');
    if (!miniContainer) {
        miniContainer = document.createElement('div');
        miniContainer.id = 'flight-mini-map';
        sidebar.insertBefore(miniContainer, document.getElementById('flight-resume-btn'));
    }
    miniContainer.classList.add('visible');
    
    try {
        await miniMapManager.init('flight-mini-map', destId);
        miniMapManager.showAllLayers();
    } catch (e) {
        console.error('Mini map failed:', e);
    }
}

export function destroyFlightMiniMap() {
    miniMapManager.destroy();
    const el = document.getElementById('flight-mini-map');
    if (el) el.classList.remove('visible');
}

document.addEventListener('DOMContentLoaded', augmentDestCards);
