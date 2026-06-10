/**
 * Khyber Incident Layer and Marker Logic
 * Coordinates: [74.78597477331795, 36.58484445652914] (Khyber, Gojal Hunza)
 */

// State tracking for the Khyber Incident marker and popup
let khyberMarker = null;
let khyberPopup = null;

// Dynamically inject custom styles for the blinking marker and theme-matching popup
(function injectKhyberStyles() {
    const styleId = 'khyber-incident-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Custom pulsing/blinking marker for Khyber */
            .khyber-blink-marker {
                position: relative;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99;
            }
            .khyber-blink-dot {
                width: 14px;
                height: 14px;
                background-color: #ef4444;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.9), 0 0 4px rgba(0, 0, 0, 0.6);
                border: 2px solid #ffffff;
                z-index: 2;
                transition: transform 0.2s ease;
            }
            .khyber-blink-marker:hover .khyber-blink-dot {
                transform: scale(1.25);
                background-color: #f87171;
            }
            .khyber-blink-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #ef4444;
                border-radius: 50%;
                animation: khyber-pulsate 1.5s ease-out infinite;
                opacity: 0;
                z-index: 1;
            }
            @keyframes khyber-pulsate {
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
            .khyber-incident-popup .mapboxgl-popup-content {
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                color: #f1f5f9 !important;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                padding: 12px !important;
                width: 200px !important;
                max-width: 90vw !important;
                backdrop-filter: blur(12px) !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            .khyber-incident-popup .mapboxgl-popup-tip {
                border-top-color: rgba(6, 11, 25, 0.92) !important;
                border-bottom-color: rgba(6, 11, 25, 0.92) !important;
                border-left-color: rgba(6, 11, 25, 0.92) !important;
                border-right-color: rgba(6, 11, 25, 0.92) !important;
            }
            .khyber-incident-popup .mapboxgl-popup-close-button {
                color: #94a3b8 !important;
                font-size: 16px !important;
                padding: 4px 8px !important;
                top: 8px !important;
                right: 8px !important;
                border-radius: 50% !important;
                transition: color 0.2s, background-color 0.2s !important;
                outline: none !important;
            }
            .khyber-incident-popup .mapboxgl-popup-close-button:hover {
                color: #ffffff !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            .khyber-popup-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
        `;
        document.head.appendChild(style);
    }
})();

/**
 * Toggles the visibility of the Khyber Incident marker and flies the map camera to its coordinate.
 * @param {boolean} isChecked - The new state of the checkbox switch
 */
function toggleKhyberIncident(isChecked) {
    if (typeof map1 === 'undefined' || !map1) {
        console.error("Mapbox GL map instance (map1) is not defined.");
        return;
    }

    const coordinates = [74.78597477331795, 36.58484445652914];

    if (isChecked) {
        // Remove existing marker and popup to prevent duplication
        if (khyberMarker) {
            khyberMarker.remove();
        }
        if (khyberPopup) {
            khyberPopup.remove();
        }

        // Create the custom HTML elements for the blinking/pulsing marker
        const el = document.createElement('div');
        el.className = 'khyber-blink-marker';
        el.title = "Khyber Incident Location - Click to toggle details popup";

        const ring = document.createElement('div');
        ring.className = 'khyber-blink-ring';

        const dot = document.createElement('div');
        dot.className = 'khyber-blink-dot';

        el.appendChild(ring);
        el.appendChild(dot);

        // Build the HTML details popup
        khyberPopup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: true,
            closeOnClick: false,
            className: 'khyber-incident-popup'
        }).setHTML(`
            <div class="khyber-popup-content">
                <div class="khyber-popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #f87171; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">Khyber Incident</h4>
                </div>
                <div class="khyber-popup-body" style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                    <div style="padding: 8px; background: rgba(239, 68, 68, 0.1); border: 1px dashed rgba(239, 68, 68, 0.4); border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 14px;"></i>
                        <span style="font-weight: 600; color: #fecaca;">Active Monitoring Alert</span>
                    </div>
                    <p style="margin: 4px 0;"><strong>Location:</strong> Khyber Valley, Gojal Hunza</p>
                    <p style="margin: 4px 0;"><strong>Coordinates:</strong> 36.58484° N, 74.78597° E</p>
                    <p style="margin: 4px 0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; color: #94a3b8;">Real-time weather station and telemetry sensors are actively logging catchment fluctuations.</p>
                </div>
            </div>
        `);

        // Create the Mapbox marker and attach the popup
        khyberMarker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .setPopup(khyberPopup)
        .addTo(map1);

        // Open the popup immediately
        khyberPopup.setLngLat(coordinates).addTo(map1);

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
        if (khyberMarker) {
            khyberMarker.remove();
            khyberMarker = null;
        }
        if (khyberPopup) {
            khyberPopup.remove();
            khyberPopup = null;
        }
    }
}
