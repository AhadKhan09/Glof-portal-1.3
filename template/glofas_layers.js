(() => {
    // Verified configuration for the ECMWF GloFAS layers
    const layersConfig = [
        { id: 'AccRainEGE', layerName: 'AccRainEGE', toggleId: 'accumulatedPrecip' },
        { id: 'EGE_probRgt50', layerName: 'EGE_probRgt50', toggleId: 'prob50' },
        { id: 'EGE_probRgt150', layerName: 'EGE_probRgt150', toggleId: 'prob150' },
        { id: 'EGE_probRgt300', layerName: 'EGE_probRgt300', toggleId: 'prob300' },
        { id: 'FloodSummary1_30', layerName: 'FloodSummary1_30', toggleId: 'sum1_30' },
        { id: 'FloodSummary1_3', layerName: 'sumAL41EGE', toggleId: 'sum1_3' },
        { id: 'sumAL42EGE', layerName: 'sumAL42EGE', toggleId: 'sum4_10' },
        { id: 'sumAL43EGE', layerName: 'sumAL43EGE', toggleId: 'sum11_30' }
    ];

    /**
     * Initializes and registers the GloFAS WMS raster tiles on the Mapbox gl target canvas.
     * Bound to style.load to ensure they persist across basemap changes.
     */
    function initGlofasLayers() {
        if (typeof map1 === 'undefined' || !map1) {
            console.warn("Mapbox instance (map1) not found during GloFAS layers initialization.");
            return;
        }

        layersConfig.forEach(config => {
            // Register WMS Source with corrected bounding box and resolution parameters
            if (!map1.getSource(config.id)) {
                map1.addSource(config.id, {
                    type: 'raster',
                    tiles: [
                        `https://globalfloods-ows.ecmwf.int/glofas-ows/ows.py?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&BBOX={bbox-epsg-3857}&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=${config.layerName}&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE`
                    ],
                    tileSize: 256
                });
            }

            // Inject the layer into the map canvas context
            if (!map1.getLayer(config.id)) {
                const toggleElement = document.getElementById(config.toggleId);
                const isVisible = toggleElement ? toggleElement.checked : false;
                
                // Position layer cleanly beneath administrative vector overlays
                const beforeLayer = map1.getLayer('national-boundary-layer') ? 'national-boundary-layer' : undefined;

                map1.addLayer({
                    id: config.id,
                    type: 'raster',
                    source: config.id,
                    layout: {
                        'visibility': isVisible ? 'visible' : 'none'
                    },
                    paint: {
                        'raster-opacity': 0.85 // Slight transparency allows terrain to peak through
                    }
                }, beforeLayer);
            }
        });
    }

    /**
     * Binds structural event listeners to interface with standard checkboxes
     */
    function bindGlofasLayerControls() {
        layersConfig.forEach(t => {
            const checkbox = document.getElementById(t.toggleId);
            if (checkbox) {
                checkbox.addEventListener('change', function () {
                    const isVisible = this.checked;

                    if (map1 && map1.getLayer(t.id)) {
                        map1.setLayoutProperty(t.id, 'visibility', isVisible ? 'visible' : 'none');
                    }

                    if (typeof refreshActiveLayersLegend === 'function') {
                        refreshActiveLayersLegend();
                    }
                });
            }
        });
    }

    // Set up style load hooks
    if (typeof map1 !== 'undefined') {
        map1.on('style.load', initGlofasLayers);
        if (map1.isStyleLoaded()) {
            initGlofasLayers();
        }
    }

    // Setup event listeners on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindGlofasLayerControls);
    } else {
        bindGlofasLayerControls();
    }
})();
