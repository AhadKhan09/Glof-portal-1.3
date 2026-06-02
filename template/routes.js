// Keep track of loaded routes to avoid multiple fetches and parsings
const loadedRoutes = {};

// Color lookup table for the routes to make them distinct and beautiful
const routeColors = {
    'arandu': '#00f0ff',        // Cyan
    'bashu valley': '#d000ff',  // Purple/Magenta
    'ghulkin': '#ff9800',       // Orange
    'hopper': '#4caf50',        // Green
    'Khaplu': '#ff5722'         // Coral/Red
};

async function toggleRoute(routeName, isChecked) {
    const sourceId = `route-source-${routeName.replace(/\s+/g, '-').toLowerCase()}`;
    const lineLayerId = `route-line-${routeName.replace(/\s+/g, '-').toLowerCase()}`;
    const pointLayerId = `route-point-${routeName.replace(/\s+/g, '-').toLowerCase()}`;
    const labelLayerId = `route-label-${routeName.replace(/\s+/g, '-').toLowerCase()}`;

    if (!isChecked) {
        // Hide the layers if they exist
        if (map1.getLayer(lineLayerId)) {
            map1.setLayoutProperty(lineLayerId, 'visibility', 'none');
        }
        if (map1.getLayer(`${lineLayerId}-casing`)) {
            map1.setLayoutProperty(`${lineLayerId}-casing`, 'visibility', 'none');
        }
        if (map1.getLayer(pointLayerId)) {
            map1.setLayoutProperty(pointLayerId, 'visibility', 'none');
        }
        if (map1.getLayer(labelLayerId)) {
            map1.setLayoutProperty(labelLayerId, 'visibility', 'none');
        }
        return;
    }

    // Check if the source is already registered on the map
    if (map1.getSource(sourceId)) {
        // Just make sure visibility is set to visible
        if (map1.getLayer(lineLayerId)) {
            map1.setLayoutProperty(lineLayerId, 'visibility', 'visible');
        }
        if (map1.getLayer(`${lineLayerId}-casing`)) {
            map1.setLayoutProperty(`${lineLayerId}-casing`, 'visibility', 'visible');
        }
        if (map1.getLayer(pointLayerId)) {
            map1.setLayoutProperty(pointLayerId, 'visibility', 'visible');
        }
        if (map1.getLayer(labelLayerId)) {
            map1.setLayoutProperty(labelLayerId, 'visibility', 'visible');
        }
        
        // Fly map to the route's bounds/center
        flyToGeoJSON(loadedRoutes[routeName]);
        return;
    }

    // If GeoJSON is cached but not on the map (e.g. after a basemap change), re-add it
    if (loadedRoutes[routeName]) {
        addRouteToMap(routeName, sourceId, lineLayerId, pointLayerId, labelLayerId, loadedRoutes[routeName]);
        flyToGeoJSON(loadedRoutes[routeName]);
        return;
    }

    try {
        // Load, unzip, and parse the KMZ file
        const kmzUrl = `data/travelmaps/${encodeURIComponent(routeName)}.kmz`;
        const response = await fetch(kmzUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch KMZ file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const kmlFile = Object.keys(zip.files).find(name => name.endsWith('.kml'));
        if (!kmlFile) {
            throw new Error('No KML file found in KMZ archive.');
        }

        const kmlString = await zip.files[kmlFile].async('string');
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(kmlString, 'text/xml');
        const geojson = toGeoJSON.kml(kmlDom);

        // Store parsed GeoJSON in cache
        loadedRoutes[routeName] = geojson;

        // Render on map
        addRouteToMap(routeName, sourceId, lineLayerId, pointLayerId, labelLayerId, geojson);
        flyToGeoJSON(geojson);

    } catch (err) {
        console.error(`Error loading or parsing KMZ file for ${routeName}:`, err);
        alert(`Failed to load route "${routeName}": ${err.message}`);
    }
}

// Function to register source and add layers for a route on the map
function addRouteToMap(routeName, sourceId, lineLayerId, pointLayerId, labelLayerId, geojson) {
    if (!map1.getSource(sourceId)) {
        map1.addSource(sourceId, {
            type: 'geojson',
            data: geojson
        });
    }

    const color = routeColors[routeName] || '#ff007f';

    // Add main line layer for paths
    if (!map1.getLayer(lineLayerId)) {
        map1.addLayer({
            id: lineLayerId,
            type: 'line',
            source: sourceId,
            filter: ['in', '$type', 'LineString', 'Polygon'],
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'visible'
            },
            paint: {
                'line-color': color,
                'line-width': 5,
                'line-opacity': 0.85
            }
        });

        // Add a glowing casing/outline layer to make it look extremely premium!
        const casingLayerId = `${lineLayerId}-casing`;
        if (!map1.getLayer(casingLayerId)) {
            map1.addLayer({
                id: casingLayerId,
                type: 'line',
                source: sourceId,
                filter: ['in', '$type', 'LineString', 'Polygon'],
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                    'visibility': 'visible'
                },
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 8,
                    'line-opacity': 0.25
                }
            }, lineLayerId); // insert below main line layer
        }
    }

    // Add circle layer for waypoints/points in the KMZ
    if (!map1.getLayer(pointLayerId)) {
        map1.addLayer({
            id: pointLayerId,
            type: 'circle',
            source: sourceId,
            filter: ['==', '$type', 'Point'],
            layout: {
                'visibility': 'visible'
            },
            paint: {
                'circle-radius': 6,
                'circle-color': color,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9
            }
        });

        // Add text labels for waypoints to make it easy to identify
        map1.addLayer({
            id: labelLayerId,
            type: 'symbol',
            source: sourceId,
            filter: ['==', '$type', 'Point'],
            layout: {
                'text-field': ['get', 'name'],
                'text-size': 11,
                'text-offset': [0, 1.2],
                'text-anchor': 'top',
                'visibility': 'visible'
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5
            }
        });

        if (typeof window.updateMapLabelsColor === 'function') {
            window.updateMapLabelsColor();
        }

        // Setup point interaction / popup on click
        map1.on('click', pointLayerId, (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;
            const name = props.name || 'Waypoint';
            const desc = props.description || 'No description available.';

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup({ className: 'route-popup' })
                .setLngLat(coordinates)
                .setHTML(`
                    <div class="route-popup-content" style="font-family: sans-serif; padding: 4px;">
                        <h5 style="margin: 0 0 6px 0; color: ${color}; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 4px;">${name}</h5>
                        <p style="margin: 0; font-size: 12px; max-height: 150px; overflow-y: auto; color: #fff;">${desc}</p>
                    </div>
                `)
                .addTo(map1);
        });

        // Change cursor on point hover
        map1.on('mouseenter', pointLayerId, () => {
            map1.getCanvas().style.cursor = 'pointer';
        });
        map1.on('mouseleave', pointLayerId, () => {
            map1.getCanvas().style.cursor = '';
        });
    }

    // Setup line interaction (click and hover)
    if (map1.getLayer(lineLayerId)) {
        map1.on('click', lineLayerId, (e) => {
            const props = e.features[0].properties;
            const name = props.name || routeName.charAt(0).toUpperCase() + routeName.slice(1) + ' Route';
            const desc = props.description || 'Active travel route.';

            new mapboxgl.Popup({ className: 'route-popup' })
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div class="route-popup-content" style="font-family: sans-serif; padding: 4px;">
                        <h5 style="margin: 0 0 6px 0; color: ${color}; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 4px;">${name}</h5>
                        <p style="margin: 0; font-size: 12px; color: #fff;">${desc}</p>
                    </div>
                `)
                .addTo(map1);
        });

        map1.on('mouseenter', lineLayerId, () => {
            map1.getCanvas().style.cursor = 'pointer';
            map1.setPaintProperty(lineLayerId, 'line-width', 7);
        });
        map1.on('mouseleave', lineLayerId, () => {
            map1.getCanvas().style.cursor = '';
            map1.setPaintProperty(lineLayerId, 'line-width', 5);
        });
    }
}

// Helper to center and fit the map view around a GeoJSON's bounds
function flyToGeoJSON(geojson) {
    if (!geojson || !geojson.features || !geojson.features.length) return;

    const coordinates = [];
    geojson.features.forEach(feature => {
        if (feature.geometry) {
            const geom = feature.geometry;
            if (geom.type === 'Point') {
                coordinates.push(geom.coordinates);
            } else if (geom.type === 'LineString') {
                geom.coordinates.forEach(coord => coordinates.push(coord));
            } else if (geom.type === 'Polygon') {
                geom.coordinates.forEach(ring => ring.forEach(coord => coordinates.push(coord)));
            } else if (geom.type === 'MultiLineString') {
                geom.coordinates.forEach(line => line.forEach(coord => coordinates.push(coord)));
            }
        }
    });

    if (!coordinates.length) return;

    // Calculate bounding box
    const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map1.fitBounds(bounds, {
        padding: 80,
        maxZoom: 13,
        duration: 1500
    });
}

// Re-add active routes on basemap / style reloads
if (typeof map1 !== 'undefined') {
    map1.on('style.load', () => {
        const routeToggles = document.querySelectorAll('.route-toggle');
        routeToggles.forEach(toggle => {
            if (toggle.checked) {
                let originalName = '';
                if (toggle.id === 'route-arandu-toggle') originalName = 'arandu';
                else if (toggle.id === 'route-bashu-valley-toggle') originalName = 'bashu valley';
                else if (toggle.id === 'route-ghulkin-toggle') originalName = 'ghulkin';
                else if (toggle.id === 'route-hopper-toggle') originalName = 'hopper';
                else if (toggle.id === 'route-khaplu-toggle') originalName = 'Khaplu';

                if (originalName) {
                    toggleRoute(originalName, true);
                }
            }
        });
    });
}
