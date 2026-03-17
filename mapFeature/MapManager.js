import { MapConfig } from './mapConfig.js';

let leafletPromise = null;

function loadLeaflet() {
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
        if (window.L) { resolve(window.L); return; }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'mapFeature/mapStyles.css';
        document.head.appendChild(styleLink);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        script.onerror = reject;
        document.body.appendChild(script);
    });
    return leafletPromise;
}

export class MapManager {
    constructor() {
        this.map = null;
        this.greenLayer = null;
        this.redLayer = null;
        this.containerId = null;
    }

    async init(containerId, destId) {
        if (this.map) this.destroy();
        this.containerId = containerId;
        
        try {
            const L = await loadLeaflet();
            const config = MapConfig.destinations[destId] || MapConfig.destinations['bali'];
            
            const container = document.getElementById(containerId);
            if (!container) return;
            
            // Remove fake background images previously used as placeholders
            container.style.backgroundImage = 'none';
            container.innerHTML = '';
            
            this.map = L.map(containerId, {
                center: config.center,
                zoom: config.zoom,
                zoomControl: true,
                attributionControl: false
            });

            L.tileLayer(MapConfig.theme.darkUrl, {
                attribution: MapConfig.theme.attribution
            }).addTo(this.map);

            this.greenLayer = L.layerGroup();
            this.redLayer = L.layerGroup();

            this._createMarkers(L, config.greenZones, 'green', this.greenLayer);
            this._createMarkers(L, config.redZones, 'red', this.redLayer);
            
            // Delay invalidateSize to ensure the modal finishes its transition animation
            setTimeout(() => {
                if (this.map) this.map.invalidateSize();
            }, 500);
        } catch (error) {
            console.error("Map failed to load. Falling back to static background.", error);
        }
    }
    
    _createMarkers(L, zones, type, layerGroup) {
        zones.forEach(zone => {
            const el = document.createElement('div');
            el.className = `dynamic-map-pin ${type}`;
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: el.outerHTML,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            const marker = L.marker([zone.lat, zone.lng], { icon });
            marker.bindTooltip(zone.title, { direction: 'top', offset: [0, -10] });
            layerGroup.addLayer(marker);
        });
    }

    showLayer(type) {
        if (!this.map) return;
        if (type === 'green' && this.greenLayer) {
            this.greenLayer.addTo(this.map);
        } else if (type === 'red' && this.redLayer) {
            this.redLayer.addTo(this.map);
        }
    }

    showAllLayers() {
        if (!this.map) return;
        if (this.greenLayer) this.greenLayer.addTo(this.map);
        if (this.redLayer) this.redLayer.addTo(this.map);
    }

    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.greenLayer = null;
            this.redLayer = null;
            const container = document.getElementById(this.containerId);
            if (container) container.innerHTML = '';
        }
    }
}
