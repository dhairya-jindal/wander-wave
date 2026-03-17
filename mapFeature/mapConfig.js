export const MapConfig = {
    destinations: {
        'bali': {
            center: [-8.5, 115.2],
            zoom: 10,
            greenZones: [
                { lat: -8.5069, lng: 115.2625, title: 'Ubud Center (Cultural Heart)' },
                { lat: -8.8291, lng: 115.0886, title: 'Uluwatu Temple (Sunset Views)' }
            ],
            redZones: [
                { lat: -8.3433, lng: 115.5071, title: 'Mount Agung (Volcano Safety Zone)' }
            ]
        },
        'croatia': {
            center: [43.5, 16.4],
            zoom: 8,
            greenZones: [
                { lat: 42.6507, lng: 18.0944, title: 'Dubrovnik Old Town' },
                { lat: 43.5081, lng: 16.4402, title: 'Diocletian Palace (Split)' }
            ],
            redZones: [
                { lat: 44.5, lng: 15.5, title: 'Velebit Mountain Passes (Winter Advisory)' }
            ]
        },
        'maldives': {
            center: [4.1755, 73.5093],
            zoom: 9,
            greenZones: [
                { lat: 4.1755, lng: 73.5093, title: 'Malé Capital' },
                { lat: 3.8667, lng: 73.5333, title: 'Maafushi Local Island' }
            ],
            redZones: [
                { lat: 5.5, lng: 73.0, title: 'Uncharted Southern Reefs' }
            ]
        }
    },
    theme: {
        darkUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
};
