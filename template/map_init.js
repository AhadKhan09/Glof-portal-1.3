mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
// Assigning constants to sources of the layers
const districtBoundarySource = {
    type: 'geojson',
    data: 'http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar%3AProvincial_Boundary&outputFormat=application%2Fjson'
};
//_______________________________________________________________________________________________________________________
const map1 = new mapboxgl.Map({
    container: 'map',
    zoom: 7,
    center: [72.98695108531231, 35.323007094843575],
    pitch: 60,
    bearing: 0,
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
});



// Custom 3D / 2D toggle control
class PitchToggleControl {
    constructor() {
        this._is3D = true; // map starts at pitch:60
    }
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this._btn = document.createElement('button');
        this._btn.className = 'pitch-toggle-btn';
        this._btn.title = 'Toggle 3D / Flat view';
        this._btn.innerHTML = '2D';
        this._btn.onclick = () => {
            this._is3D = !this._is3D;
            map.easeTo({
                pitch: this._is3D ? 60 : 0,
                bearing: 0,
                duration: 800
            });
            this._btn.innerHTML = this._is3D ? '2D' : '3D';
            this._btn.title = this._is3D ? 'Switch to Flat view' : 'Switch to 3D view';
        };
        this._container.appendChild(this._btn);
        return this._container;
    }
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

function toggleContainerVisibility(targetId, btn) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    if (targetId === 'top_video') {
        const warningChart = document.getElementById('top_video_warning_chart');
        const isWarningVisible = warningChart && window.getComputedStyle(warningChart).display !== 'none';
        const isVideoVisible = window.getComputedStyle(target).display !== 'none';
        
        if (isWarningVisible || isVideoVisible) {
            target.style.display = 'none';
            if (warningChart) warningChart.style.display = 'none';
            btn.classList.add('widget-hidden');
        } else {
            const tempWarningToggle = document.getElementById('quick-high-temp-2026-toggle');
            if (tempWarningToggle && tempWarningToggle.checked && warningChart) {
                warningChart.style.display = 'block';
            } else {
                target.style.display = 'block';
            }
            btn.classList.remove('widget-hidden');
        }
    } else {
        const isVisible = window.getComputedStyle(target).display !== 'none';
        if (isVisible) {
            target.style.display = 'none';
            btn.classList.add('widget-hidden');
        } else {
            target.style.display = 'block';
            btn.classList.remove('widget-hidden');
        }
    }
}

// Custom Glacial Lake Dashboard Widgets show/hide control panel
class DashboardWidgetsTogglesControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        
        // Define all widget toggles
        const toggles = [
            {
                id: 'toggle-charts',
                title: 'Toggle Glacial Lake Charts',
                icon: 'fas fa-chart-bar',
                targetId: 'charts-row',
                hiddenClass: 'hidden-charts',
                startHidden: true, // starts hidden by default
                onToggle: (isHidden) => {
                    // Trigger window resize immediately
                    window.dispatchEvent(new Event('resize'));
                    // Also trigger chart redraws after CSS transitions finish
                    if (!isHidden) {
                        setTimeout(() => {
                            if (window.lakeChart) { window.lakeChart.resize(); window.lakeChart.update(); }
                            if (window.volumeChart) { window.volumeChart.resize(); window.volumeChart.update(); }
                        }, 350);
                    }
                }
            },
            {
                id: 'toggle-area-monitor',
                title: 'Toggle GLOF Area Monitor',
                icon: 'fas fa-tachometer-alt',
                targetId: 'lake-area-widget',
                hiddenClass: 'hidden-widget',
                startHidden: false
            },
            {
                id: 'toggle-temp-forecast',
                title: 'Toggle Temperature Forecast',
                icon: 'fas fa-temperature-high',
                targetId: 'lake-temp-widget',
                hiddenClass: 'hidden-widget',
                startHidden: false
            },
            {
                id: 'toggle-video-widget',
                title: 'Toggle Lake Area Change Video',
                icon: 'fas fa-video',
                targetId: 'lake-video-widget',
                hiddenClass: 'hidden-widget',
                startHidden: false
            },
            {
                id: 'toggle-impact-map',
                title: 'Toggle Lake Impact Map',
                icon: 'fas fa-map',
                targetId: 'lake-map-preview',
                hiddenClass: 'hidden-widget',
                startHidden: false
            },
            {
                id: 'toggle-active-legend',
                title: 'Toggle Active Layers Legend',
                icon: 'fas fa-list-ul',
                targetId: 'active-layers-legend',
                hiddenClass: 'hidden-widget',
                startHidden: false
            },
            {
                id: 'toggle-glof-event',
                title: 'Toggle GLOF Event Video',
                icon: 'fas fa-film',
                targetId: 'top_video',
                startHidden: true,
                isContainerToggle: true
            },
            {
                id: 'toggle-badswat-lake',
                title: 'Toggle Badswat Lake Video',
                icon: 'fas fa-video',
                targetId: 'bot_video',
                startHidden: true,
                isContainerToggle: true
            },
            {
                id: 'toggle-monitoring-chart',
                title: 'Toggle Monitoring Chart',
                icon: 'fas fa-chart-line',
                targetId: 'controlChart',
                startHidden: true,
                isContainerToggle: true
            },
            {
                id: 'toggle-glaciers-stats',
                title: 'Toggle Glaciers Stats',
                icon: 'fas fa-snowflake',
                targetId: 'glaciersDataContainer',
                startHidden: true,
                isContainerToggle: true
            }
        ];

        toggles.forEach((t) => {
            const btn = document.createElement('button');
            btn.className = `widget-toggle-btn${t.startHidden ? ' widget-hidden' : ''}`;
            btn.type = 'button';
            btn.title = t.title;
            btn.innerHTML = `<i class="${t.icon}" style="font-size: 11px;"></i>`;
            
            btn.onclick = () => {
                if (t.isContainerToggle) {
                    toggleContainerVisibility(t.targetId, btn);
                } else {
                    const target = document.getElementById(t.targetId);
                    if (target) {
                        const isHidden = target.classList.toggle(t.hiddenClass);
                        btn.classList.toggle('widget-hidden', isHidden);
                        
                        // Trigger dynamic offset updates in controls.js
                        if (typeof updateActiveLegendOffset === 'function') {
                            updateActiveLegendOffset();
                        }
                        
                        if (t.onToggle) {
                            t.onToggle(isHidden);
                        }
                    }
                }
            };
            this._container.appendChild(btn);
        });

        return this._container;
    }
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}


class PopulatedPlacesSearchControl {
    constructor(options = {}) {
        this._defaultZoom = Number.isFinite(options.defaultZoom) ? options.defaultZoom : 10;
        this._placesByNormalizedName = new Map();
        this._placesList = [];
        this._isOpen = false;
    }

    onAdd(map) {
        this._map = map;

        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl populated-places-search-control';

        this._toggleButton = document.createElement('button');
        this._toggleButton.className = 'populated-places-search-toggle-btn';
        this._toggleButton.type = 'button';
        this._toggleButton.setAttribute('aria-label', 'Open populated places search');
        this._toggleButton.setAttribute('aria-expanded', 'false');
        this._toggleButton.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10.5 3a7.5 7.5 0 0 1 5.966 12.046l4.244 4.245a1 1 0 1 1-1.414 1.414l-4.245-4.244A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z"/></svg>';

        this._panel = document.createElement('div');
        this._panel.className = 'populated-places-search-panel';

        this._form = document.createElement('form');
        this._form.className = 'populated-places-search-form';
        this._form.setAttribute('role', 'search');

        this._input = document.createElement('input');
        this._input.className = 'populated-places-search-input';
        this._input.type = 'search';
        this._input.placeholder = 'Search populated place';
        this._input.setAttribute('aria-label', 'Search populated places by name');
        this._input.setAttribute('autocomplete', 'off');

        const datalistId = `populated-places-search-options-${Date.now()}`;
        this._input.setAttribute('list', datalistId);

        this._datalist = document.createElement('datalist');
        this._datalist.id = datalistId;

        this._button = document.createElement('button');
        this._button.className = 'populated-places-search-btn';
        this._button.type = 'submit';
        this._button.textContent = 'Go';
        this._button.setAttribute('aria-label', 'Search and zoom to place');

        this._status = document.createElement('div');
        this._status.className = 'populated-places-search-status';
        this._status.setAttribute('aria-live', 'polite');

        this._form.appendChild(this._input);
        this._form.appendChild(this._button);
        this._panel.appendChild(this._form);
        this._panel.appendChild(this._status);

        this._container.appendChild(this._toggleButton);
        this._container.appendChild(this._panel);
        this._container.appendChild(this._datalist);

        this._handleSubmit = (event) => {
            event.preventDefault();
            this._searchAndZoom(this._input.value);
        };

        this._handleToggleButtonClick = () => {
            this._setOpen(!this._isOpen);
        };

        this._handleOutsideClick = (event) => {
            if (this._isOpen && this._container && !this._container.contains(event.target)) {
                this._setOpen(false);
            }
        };

        this._handleInputKeydown = (event) => {
            if (event.key === 'Escape') {
                this._setOpen(false);
                this._toggleButton.focus();
            }
        };

        this._handleSourceData = (event) => {
            if (event && event.sourceId === 'populatedPlaces' && event.isSourceLoaded) {
                this._refreshPlacesIndex();
            }
        };

        this._handleStyleLoad = () => {
            this._refreshPlacesIndex();
        };

        this._form.addEventListener('submit', this._handleSubmit);
        this._toggleButton.addEventListener('click', this._handleToggleButtonClick);
        this._input.addEventListener('keydown', this._handleInputKeydown);
        document.addEventListener('pointerdown', this._handleOutsideClick);
        map.on('sourcedata', this._handleSourceData);
        map.on('style.load', this._handleStyleLoad);

        this._refreshPlacesIndex();
        return this._container;
    }

    onRemove() {
        if (this._form && this._handleSubmit) {
            this._form.removeEventListener('submit', this._handleSubmit);
        }

        if (this._toggleButton && this._handleToggleButtonClick) {
            this._toggleButton.removeEventListener('click', this._handleToggleButtonClick);
        }

        if (this._input && this._handleInputKeydown) {
            this._input.removeEventListener('keydown', this._handleInputKeydown);
        }

        document.removeEventListener('pointerdown', this._handleOutsideClick);

        if (this._map) {
            this._map.off('sourcedata', this._handleSourceData);
            this._map.off('style.load', this._handleStyleLoad);
        }

        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }

        this._map = undefined;
    }

    _setOpen(isOpen) {
        this._isOpen = Boolean(isOpen);

        if (!this._container || !this._toggleButton) {
            return;
        }

        this._container.classList.toggle('is-open', this._isOpen);
        this._toggleButton.setAttribute('aria-expanded', String(this._isOpen));

        if (this._isOpen && this._input) {
            this._input.focus();
            this._input.select();
        }
    }

    _normalizePlaceName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    _extractPlaceName(feature) {
        const properties = feature && feature.properties ? feature.properties : {};
        const candidateNames = [properties.name, properties.Name, properties.NAME];

        for (let i = 0; i < candidateNames.length; i += 1) {
            const candidate = candidateNames[i];
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate.trim();
            }
        }

        return '';
    }

    _extractPointCoordinates(feature) {
        if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) {
            return null;
        }

        if (feature.geometry.type === 'Point' && feature.geometry.coordinates.length >= 2) {
            const lng = Number(feature.geometry.coordinates[0]);
            const lat = Number(feature.geometry.coordinates[1]);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
                return [lng, lat];
            }
        }

        return null;
    }

    _setStatus(message, isError) {
        if (!this._status) {
            return;
        }

        this._status.textContent = message || '';
        this._status.classList.toggle('is-error', Boolean(isError && message));
    }

    _syncDatalist() {
        if (!this._datalist) {
            return;
        }

        this._datalist.innerHTML = '';

        const maxOptions = 400;
        this._placesList.slice(0, maxOptions).forEach((place) => {
            const option = document.createElement('option');
            option.value = place.name;
            this._datalist.appendChild(option);
        });
    }

    _refreshPlacesIndex() {
        if (!this._map || !this._map.getSource('populatedPlaces')) {
            return;
        }

        let features = [];
        try {
            features = this._map.querySourceFeatures('populatedPlaces');
        } catch (error) {
            return;
        }

        if (!Array.isArray(features) || features.length === 0) {
            return;
        }

        const nextByName = new Map();
        const nextList = [];

        features.forEach((feature) => {
            const name = this._extractPlaceName(feature);
            const normalizedName = this._normalizePlaceName(name);
            const coordinates = this._extractPointCoordinates(feature);

            if (!normalizedName || !coordinates || nextByName.has(normalizedName)) {
                return;
            }

            const record = {
                name,
                normalizedName,
                coordinates
            };

            nextByName.set(normalizedName, record);
            nextList.push(record);
        });

        if (!nextList.length) {
            return;
        }

        nextList.sort((a, b) => a.name.localeCompare(b.name));
        this._placesByNormalizedName = nextByName;
        this._placesList = nextList;
        this._syncDatalist();
    }

    _showPopulatedPlacesLayers() {
        const layerIds = [
            'populated-places-points-layer',
            'populated-places-name-label-layer',
            'populated-places-population-label-layer'
        ];

        layerIds.forEach((layerId) => {
            if (this._map.getLayer(layerId)) {
                this._map.setLayoutProperty(layerId, 'visibility', 'visible');
            }
        });
    }

    _searchAndZoom(rawQuery) {
        const normalizedQuery = this._normalizePlaceName(rawQuery);

        if (!normalizedQuery) {
            this._setStatus('Type a populated place name.', true);
            return;
        }

        if (!this._placesList.length) {
            this._refreshPlacesIndex();
        }

        let match = this._placesByNormalizedName.get(normalizedQuery);
        if (!match) {
            match = this._placesList.find((place) => place.normalizedName.includes(normalizedQuery));
        }

        if (!match) {
            this._setStatus('No populated place found.', true);
            return;
        }

        this._showPopulatedPlacesLayers();

        this._map.flyTo({
            center: match.coordinates,
            zoom: Math.max(this._map.getZoom(), this._defaultZoom),
            duration: 1100,
            essential: true
        });

        this._input.value = match.name;
        this._setStatus(`Zoomed to ${match.name}.`, false);
        this._setOpen(false);
    }
}
// Add Mapbox Geocoder control (search) to the top of the top-right stack if the plugin is available
try {
    if (typeof MapboxGeocoder !== 'undefined') {
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            placeholder: 'Search for place or address',
            collapsed: true,
            marker: {
                color: '#ff0000'
            }
        });
        map1.addControl(geocoder, 'top-right');
    }
} catch (err) {
    console.warn('Mapbox Geocoder not available or failed to initialize.', err);
}
map1.addControl(new mapboxgl.NavigationControl(), 'top-right');
map1.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    }),
    'top-right'
);
map1.addControl(new PitchToggleControl(), 'top-right');
map1.addControl(new DashboardWidgetsTogglesControl(), 'top-right');
window.isCustomizationModeActive = true; // Always in editable/customization mode
//________________________________________________________________________________________________________________________________________________________________________________________
map1.on('style.load', () => {
    map1.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    // add the DEM source as a terrain layer with exaggerated height
    map1.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
});

// ==========================================================================
// TEMPERATURE FROM OPENWEATHERMAP DYNAMIC LAYER INITIALIZATION
// ==========================================================================

const OWM_API_KEY = CONFIG.OWM_API_KEY;
window.weatherMarkers = [];
window.precipMarkers = [];

// Determine color and class for temperature value
function getWeatherColorAndClass(temp) {
    let color = "#ef4444"; // Red fallback
    let isBlinking = false;
    
    if (temp < 0) {
        color = "#3b82f6"; // Blue
    } else if (temp >= 0 && temp <= 10) {
        color = "#eab308"; // Yellow
    } else if (temp > 10 && temp <= 20) {
        color = "#f97316"; // Orange
    } else if (temp > 20 && temp <= 30) {
        color = "#ef4444"; // Red
    } else if (temp > 30) {
        color = "#dc2626"; // Blinking Red
        isBlinking = true;
    }
    
    return { color, isBlinking };
}

// Determine color and class for precipitation value
function getPrecipColorAndClass(precip) {
    let color = "#94a3b8"; // Gray fallback for 0 or negative
    let isBlinking = false;
    
    if (precip <= 0) {
        color = "#94a3b8"; // Gray / no rain
    } else if (precip > 0 && precip <= 2) {
        color = "#06b6d4"; // Cyan / light rain
    } else if (precip > 2 && precip <= 5) {
        color = "#3b82f6"; // Blue / moderate rain
    } else if (precip > 5 && precip <= 10) {
        color = "#1d4ed8"; // Dark blue / heavy rain
    } else if (precip > 10) {
        color = "#7c3aed"; // Violet / extremely heavy rain (blinking)
        isBlinking = true;
    }
    
    return { color, isBlinking };
}

// Function to render weather markers on the map
function renderWeatherMarkers(weatherData) {
    // Clear existing markers
    clearWeatherMarkers();

    weatherData.forEach(item => {
        const { color, isBlinking } = getWeatherColorAndClass(item.temp);
        const precipVal = typeof item.precipitation === 'number' ? item.precipitation : 0.0;
        
        // Create custom HTML element for marker
        const el = document.createElement('div');
        el.className = `weather-circle-marker ${isBlinking ? 'blink' : ''}`;
        el.style.backgroundColor = color;
        el.style.borderColor = shadeColor(color, -20);
        el.textContent = `${item.temp.toFixed(1)}°`;

        // Create Mapbox popup
        const popup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: false,
            closeOnClick: false,
            className: 'weather-marker-popup'
        }).setHTML(`
            <div class="weather-popup-header" style="border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px; margin-bottom: 6px;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #93c5fd;">${item.name}</h4>
                <span style="font-size: 10px; color: #bfdbfe; text-transform: uppercase;">${item.type} EWS</span>
            </div>
            <div class="weather-popup-body" style="font-size: 12px; line-height: 1.4;">
                <p style="margin: 2px 0;"><strong>Temperature:</strong> <span style="font-size: 14px; font-weight: 700; color: #ffffff;">${item.temp.toFixed(1)}°C</span></p>
                <p style="margin: 2px 0;"><strong>Precipitation:</strong> <span style="font-size: 14px; font-weight: 700; color: #ffffff;">${precipVal.toFixed(1)} mm</span></p>
                <p style="margin: 2px 0; color: #94a3b8; font-size: 11px;"><strong>Coordinates:</strong> ${item.lat.toFixed(5)}°N, ${item.lon.toFixed(5)}°E</p>
                <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 9.5px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;">Fetched At: ${item.last_updated}</p>
            </div>
        `);

        // Create Mapbox marker and add to map
        const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat([item.lon, item.lat])
        .addTo(map1);

        // Bind hover events
        el.addEventListener('mouseenter', () => {
            popup.setLngLat([item.lon, item.lat]).addTo(map1);
        });
        el.addEventListener('mouseleave', () => {
            popup.remove();
        });

        // Clean up popup if marker is removed
        const originalRemove = marker.remove;
        marker.remove = function() {
            popup.remove();
            originalRemove.apply(marker, arguments);
        };

        window.weatherMarkers.push(marker);
    });
}

// Function to render precipitation markers on the map
function renderPrecipMarkers(weatherData) {
    // Clear existing markers
    clearPrecipMarkers();

    weatherData.forEach(item => {
        const precipVal = typeof item.precipitation === 'number' ? item.precipitation : 0.0;
        const { color, isBlinking } = getPrecipColorAndClass(precipVal);
        
        // Create custom HTML element for marker
        const el = document.createElement('div');
        el.className = `weather-circle-marker ${isBlinking ? 'blink' : ''}`;
        el.style.backgroundColor = color;
        el.style.borderColor = shadeColor(color, -20);
        el.textContent = `${precipVal.toFixed(1)}`;

        // Create Mapbox popup
        const popup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: false,
            closeOnClick: false,
            className: 'weather-marker-popup'
        }).setHTML(`
            <div class="weather-popup-header" style="border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px; margin-bottom: 6px;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #93c5fd;">${item.name}</h4>
                <span style="font-size: 10px; color: #bfdbfe; text-transform: uppercase;">${item.type} EWS</span>
            </div>
            <div class="weather-popup-body" style="font-size: 12px; line-height: 1.4;">
                <p style="margin: 2px 0;"><strong>Temperature:</strong> <span style="font-size: 14px; font-weight: 700; color: #ffffff;">${item.temp.toFixed(1)}°C</span></p>
                <p style="margin: 2px 0;"><strong>Precipitation:</strong> <span style="font-size: 14px; font-weight: 700; color: #ffffff;">${precipVal.toFixed(1)} mm</span></p>
                <p style="margin: 2px 0; color: #94a3b8; font-size: 11px;"><strong>Coordinates:</strong> ${item.lat.toFixed(5)}°N, ${item.lon.toFixed(5)}°E</p>
                <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 9.5px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;">Fetched At: ${item.last_updated}</p>
            </div>
        `);

        // Create Mapbox marker and add to map
        const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat([item.lon, item.lat])
        .addTo(map1);

        // Bind hover events
        el.addEventListener('mouseenter', () => {
            popup.setLngLat([item.lon, item.lat]).addTo(map1);
        });
        el.addEventListener('mouseleave', () => {
            popup.remove();
        });

        // Clean up popup if marker is removed
        const originalRemove = marker.remove;
        marker.remove = function() {
            popup.remove();
            originalRemove.apply(marker, arguments);
        };

        window.precipMarkers.push(marker);
    });
}

// Clear markers from map
function clearWeatherMarkers() {
    if (window.weatherMarkers) {
        window.weatherMarkers.forEach(marker => marker.remove());
    }
    window.weatherMarkers = [];
}

// Clear precipitation markers from map
function clearPrecipMarkers() {
    if (window.precipMarkers) {
        window.precipMarkers.forEach(marker => marker.remove());
    }
    window.precipMarkers = [];
}

// Toggle Temperature Layer on/off
async function toggleTemperatureLayer(visible) {
    if (visible) {
        // Uncheck precipitation toggle if active
        const precipToggle = document.getElementById('quick-precipitation-toggle');
        if (precipToggle && precipToggle.checked) {
            precipToggle.checked = false;
            clearPrecipMarkers();
        }

        // Load data from localStorage or fetch from openweathermap.json
        let storedData = localStorage.getItem('openweathermap_data');
        if (storedData) {
            try {
                const weatherData = JSON.parse(storedData);
                // Validate cache integrity for newly added fields/coordinates
                const hasHispar = weatherData.some(item => item.id === 'hispar_valley');
                const hasPrecip = weatherData.some(item => 'precipitation' in item);
                if (!hasHispar || !hasPrecip) {
                    throw new Error("Stale weather cache");
                }
                renderWeatherMarkers(weatherData);
            } catch (e) {
                console.warn("Stale or invalid weather cache, refetching defaults:", e);
                await fetchAndLoadDefaultWeather();
            }
        } else {
            await fetchAndLoadDefaultWeather();
        }
    } else {
        clearWeatherMarkers();
    }
}
window.toggleTemperatureLayer = toggleTemperatureLayer;

// Toggle Precipitation Layer on/off
async function togglePrecipitationLayer(visible) {
    if (visible) {
        // Uncheck temperature toggle if active
        const tempToggle = document.getElementById('quick-temperature-toggle');
        if (tempToggle && tempToggle.checked) {
            tempToggle.checked = false;
            clearWeatherMarkers();
        }

        // Load data from localStorage or fetch from openweathermap.json
        let storedData = localStorage.getItem('openweathermap_data');
        if (storedData) {
            try {
                const weatherData = JSON.parse(storedData);
                // Validate cache integrity for newly added fields/coordinates
                const hasHispar = weatherData.some(item => item.id === 'hispar_valley');
                const hasPrecip = weatherData.some(item => 'precipitation' in item);
                if (!hasHispar || !hasPrecip) {
                    throw new Error("Stale weather cache");
                }
                renderPrecipMarkers(weatherData);
            } catch (e) {
                console.warn("Stale or invalid weather cache, refetching defaults:", e);
                await fetchAndLoadDefaultPrecip();
            }
        } else {
            await fetchAndLoadDefaultPrecip();
        }
    } else {
        clearPrecipMarkers();
    }
}
window.togglePrecipitationLayer = togglePrecipitationLayer;

// Fetch and load default JSON data
async function fetchAndLoadDefaultWeather() {
    try {
        const response = await fetch('data/openweathermap.json');
        if (!response.ok) throw new Error("Failed to fetch openweathermap.json");
        const weatherData = await response.json();
        localStorage.setItem('openweathermap_data', JSON.stringify(weatherData));
        renderWeatherMarkers(weatherData);
    } catch (err) {
        console.error("Error loading openweathermap.json default data:", err);
    }
}

// Fetch and load default JSON data for precipitation
async function fetchAndLoadDefaultPrecip() {
    try {
        const response = await fetch('data/openweathermap.json');
        if (!response.ok) throw new Error("Failed to fetch openweathermap.json");
        const weatherData = await response.json();
        localStorage.setItem('openweathermap_data', JSON.stringify(weatherData));
        renderPrecipMarkers(weatherData);
    } catch (err) {
        console.error("Error loading openweathermap.json default data for precipitation:", err);
    }
}

// Shared function to refresh all weather telemetry
async function refreshAllWeatherData(activeType, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const tempIcon = document.getElementById('refresh-weather-icon');
    const tempBtn = document.getElementById('refresh-weather-btn');
    const precipIcon = document.getElementById('refresh-precipitation-icon');
    const precipBtn = document.getElementById('refresh-precipitation-btn');

    if (activeType === 'temp') {
        if (tempIcon) tempIcon.classList.add('fa-spin');
        if (tempBtn) tempBtn.disabled = true;
    } else {
        if (precipIcon) precipIcon.classList.add('fa-spin');
        if (precipBtn) precipBtn.disabled = true;
    }

    try {
        // Load current data array (we need coordinate information)
        let currentData = [];
        let storedData = localStorage.getItem('openweathermap_data');
        
        if (storedData) {
            currentData = JSON.parse(storedData);
        } else {
            const response = await fetch('data/openweathermap.json');
            currentData = await response.json();
        }

        const now = new Date();
        const timestamp = now.getFullYear() + '-' + 
                          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(now.getDate()).padStart(2, '0') + ' ' + 
                          String(now.getHours()).padStart(2, '0') + ':' + 
                          String(now.getMinutes()).padStart(2, '0') + ':' + 
                          String(now.getSeconds()).padStart(2, '0');

        // Fetch new data for each coordinate in parallel
        const fetchPromises = currentData.map(async (item) => {
            try {
                const apiResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${item.lat}&lon=${item.lon}&appid=${OWM_API_KEY}&units=metric`);
                if (!apiResponse.ok) throw new Error(`HTTP Error ${apiResponse.status}`);
                const data = await apiResponse.json();
                
                // Fetch Temperature
                if (data && data.main && typeof data.main.temp === 'number') {
                    item.temp = data.main.temp;
                }

                // Fetch Precipitation
                let precip = 0.0;
                if (data && data.rain) {
                    precip += (data.rain['1h'] || data.rain['3h'] || 0.0);
                }
                if (data && data.snow) {
                    precip += (data.snow['1h'] || data.snow['3h'] || 0.0);
                }
                item.precipitation = precip;

                item.last_updated = timestamp;
            } catch (err) {
                console.warn(`Could not refresh weather for ${item.name}:`, err);
            }
            return item;
        });

        const updatedData = await Promise.all(fetchPromises);
        
        // Save to localStorage
        localStorage.setItem('openweathermap_data', JSON.stringify(updatedData));

        // Re-render Temperature markers if active
        const tempCheckbox = document.getElementById('quick-temperature-toggle');
        if (tempCheckbox && tempCheckbox.checked) {
            renderWeatherMarkers(updatedData);
        }

        // Re-render Precipitation markers if active
        const precipCheckbox = document.getElementById('quick-precipitation-toggle');
        if (precipCheckbox && precipCheckbox.checked) {
            renderPrecipMarkers(updatedData);
        }

        // Visual feedback
        if (activeType === 'temp' && tempBtn) {
            tempBtn.style.color = "#22c55e";
            setTimeout(() => { tempBtn.style.color = "#93c5fd"; }, 1500);
        } else if (activeType === 'precip' && precipBtn) {
            precipBtn.style.color = "#22c55e";
            setTimeout(() => { precipBtn.style.color = "#93c5fd"; }, 1500);
        }
    } catch (err) {
        console.error("Failed to refresh weather data:", err);
    } finally {
        if (tempIcon) tempIcon.classList.remove('fa-spin');
        if (tempBtn) tempBtn.disabled = false;
        if (precipIcon) precipIcon.classList.remove('fa-spin');
        if (precipBtn) precipBtn.disabled = false;
    }
}

// Refresh temperature weather data
async function refreshWeatherData(event) {
    await refreshAllWeatherData('temp', event);
}
window.refreshWeatherData = refreshWeatherData;

// Refresh precipitation weather data
async function refreshPrecipitationData(event) {
    await refreshAllWeatherData('precip', event);
}
window.refreshPrecipitationData = refreshPrecipitationData;



