/**
 * Thore Incident Layer and Marker Logic
 * Coordinates: [73.85572994889226, 35.480535509722905] (Thore Valley)
 */

// State tracking for the Thore Incident marker and popup
let thoreMarker = null;
let thorePopup = null;

// Dynamically inject custom styles for the blinking marker and theme-matching popup
(function injectThoreStyles() {
    const styleId = 'thore-incident-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Custom pulsing/blinking marker for Thore */
            .thore-blink-marker {
                position: relative;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99;
            }
            .thore-blink-dot {
                width: 14px;
                height: 14px;
                background-color: #ef4444;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.9), 0 0 4px rgba(0, 0, 0, 0.6);
                border: 2px solid #ffffff;
                z-index: 2;
                transition: transform 0.2s ease;
            }
            .thore-blink-marker:hover .thore-blink-dot {
                transform: scale(1.25);
                background-color: #f87171;
            }
            .thore-blink-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #ef4444;
                border-radius: 50%;
                animation: thore-pulsate 1.5s ease-out infinite;
                opacity: 0;
                z-index: 1;
            }
            @keyframes thore-pulsate {
                0% {
                    transform: scale(0.3);
                    opacity: 1;
                }
                50% {
                    opacity: 0.6;
                }
                100% {
                    transform: scale(2.8);
                    opacity: 0;
                }
            }
            
            /* Premium theme-matching popup */
            .thore-incident-popup .mapboxgl-popup-content {
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                color: #f1f5f9 !important;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                padding: 12px !important;
                width: 280px !important;
                max-width: 90vw !important;
                backdrop-filter: blur(12px) !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            .thore-incident-popup .mapboxgl-popup-tip {
                border-top-color: rgba(6, 11, 25, 0.92) !important;
                border-bottom-color: rgba(6, 11, 25, 0.92) !important;
                border-left-color: rgba(6, 11, 25, 0.92) !important;
                border-right-color: rgba(6, 11, 25, 0.92) !important;
            }
            .thore-incident-popup .mapboxgl-popup-close-button {
                color: #94a3b8 !important;
                font-size: 16px !important;
                padding: 4px 8px !important;
                top: 8px !important;
                right: 8px !important;
                border-radius: 50% !important;
                transition: color 0.2s, background-color 0.2s !important;
                outline: none !important;
            }
            .thore-incident-popup .mapboxgl-popup-close-button:hover {
                color: #ffffff !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            .thore-popup-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
        `;
        document.head.appendChild(style);
    }
})();

/**
 * Toggles the visibility of the Thore Incident marker and flies the map camera to its coordinate.
 * @param {boolean} isChecked - The new state of the checkbox switch
 */
function toggleThoreIncident(isChecked) {
    if (typeof map1 === 'undefined' || !map1) {
        console.error("Mapbox GL map instance (map1) is not defined.");
        return;
    }

    const coordinates = [73.85572994889226, 35.480535509722905];

    if (isChecked) {
        // Remove existing marker and popup to prevent duplication
        if (thoreMarker) {
            thoreMarker.remove();
        }
        if (thorePopup) {
            thorePopup.remove();
        }

        // Create the custom HTML elements for the blinking/pulsing marker
        const el = document.createElement('div');
        el.className = 'thore-blink-marker';
        el.title = "Thore Incident Location - Click to toggle details popup";

        const ring = document.createElement('div');
        ring.className = 'thore-blink-ring';

        const dot = document.createElement('div');
        dot.className = 'thore-blink-dot';

        el.appendChild(ring);
        el.appendChild(dot);

        // Build the HTML details popup
        thorePopup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: true,
            closeOnClick: false,
            className: 'thore-incident-popup'
        }).setHTML(`
            <div class="thore-popup-content">
                <div class="thore-popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #f87171; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">Thore Incident</h4>
                    <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">26 June, 2026</span>
                </div>
                <div class="thore-popup-body">
                    <img src="data/Incidents/Thore Incident.jpeg" alt="Thore Incident" style="width: 100%; height: auto; max-height: 180px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 12px rgba(0,0,0,0.6); margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                        <p style="margin: 4px 0; color: #cbd5e1;">
                            Flash flood hit Habroom Nallah, Anger Nallah & Shitan Nallah areas of Thore valley. Which caused widespread destruction to houses along with belongings, agricultural land other livihood and a car swet into nallah.
                        </p>
                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                            <p style="margin: 2px 0;"><strong>Coordinates:</strong> 35.48054° N, 73.85573° E</p>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Create the Mapbox marker and attach the popup
        thoreMarker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .setPopup(thorePopup)
        .addTo(map1);

        // Open the popup immediately
        thorePopup.setLngLat(coordinates).addTo(map1);

        // Zoom/Fly camera to the incident area
        map1.flyTo({
            center: coordinates,
            zoom: 14.5,
            pitch: 55,
            bearing: 0,
            duration: 2500,
            essential: true
        });
    } else {
        // Clean up marker and popup
        if (thoreMarker) {
            thoreMarker.remove();
            thoreMarker = null;
        }
        if (thorePopup) {
            thorePopup.remove();
            thorePopup = null;
        }
    }
}
