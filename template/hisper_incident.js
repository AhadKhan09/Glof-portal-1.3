/**
 * Hisper Incident Layer and Video Popup Logic
 * Coordinates: [74.99042958134855, 36.174946979474434] (Hispar Valley/Glacier)
 * Video Asset: data/Hisper/Incident.mp4
 */

// State tracking for the Hisper Incident marker and popup
let hisperMarker = null;
let hisperPopup = null;

// Dynamically inject custom styles for the blinking marker and theme-matching popup
(function injectStyles() {
    const styleId = 'hisper-incident-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Custom pulsing/blinking marker */
            .hisper-blink-marker {
                position: relative;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99;
            }
            .hisper-blink-dot {
                width: 14px;
                height: 14px;
                background-color: #ef4444;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.9), 0 0 4px rgba(0, 0, 0, 0.6);
                border: 2px solid #ffffff;
                z-index: 2;
                transition: transform 0.2s ease;
            }
            .hisper-blink-marker:hover .hisper-blink-dot {
                transform: scale(1.25);
                background-color: #f87171;
            }
            .hisper-blink-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #ef4444;
                border-radius: 50%;
                animation: hisper-pulsate 1.5s ease-out infinite;
                opacity: 0;
                z-index: 1;
            }
            @keyframes hisper-pulsate {
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
            .hisper-incident-popup .mapboxgl-popup-content {
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                color: #f1f5f9 !important;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                padding: 10px !important;
                width: 180px !important;
                max-width: 90vw !important;
                backdrop-filter: blur(12px) !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            .hisper-incident-popup .mapboxgl-popup-tip {
                border-top-color: rgba(6, 11, 25, 0.92) !important;
                border-bottom-color: rgba(6, 11, 25, 0.92) !important;
                border-left-color: rgba(6, 11, 25, 0.92) !important;
                border-right-color: rgba(6, 11, 25, 0.92) !important;
            }
            .hisper-incident-popup .mapboxgl-popup-close-button {
                color: #94a3b8 !important;
                font-size: 16px !important;
                padding: 4px 8px !important;
                top: 8px !important;
                right: 8px !important;
                border-radius: 50% !important;
                transition: color 0.2s, background-color 0.2s !important;
                outline: none !important;
            }
            .hisper-incident-popup .mapboxgl-popup-close-button:hover {
                color: #ffffff !important;
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            .hisper-popup-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            /* Bottom Center Telemetry Images Widget */
            #hisper-images-widget {
                position: absolute;
                left: 50%;
                bottom: 24px;
                transform: translate(-50%, 20px);
                width: clamp(520px, 45vw, 750px);
                background: rgba(6, 11, 25, 0.92) !important;
                border: 1.5px solid rgba(239, 68, 68, 0.6) !important;
                border-radius: 12px !important;
                padding: 10px 14px 14px 14px !important;
                display: flex;
                flex-direction: column;
                gap: 8px;
                box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3) !important;
                backdrop-filter: blur(12px) !important;
                z-index: 10;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0.3s;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            #hisper-images-widget.is-visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transform: translate(-50%, 0);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            #hisper-images-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.15);
                padding-bottom: 6px;
                margin-bottom: 4px;
            }
            #hisper-images-title {
                font-size: 13px;
                font-weight: 700;
                color: #f87171;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
            }
            #hisper-images-close {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 20px;
                cursor: pointer;
                line-height: 1;
                padding: 0;
                outline: none;
                transition: color 0.2s;
            }
            #hisper-images-close:hover {
                color: #ffffff;
            }
            #hisper-images-body {
                display: flex;
                gap: 12px;
                width: 100%;
                justify-content: space-between;
            }
            .hisper-img-card {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                background: rgba(0, 0, 0, 0.4);
                padding: 8px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                transition: border-color 0.2s, background-color 0.2s, transform 0.2s;
            }
            .hisper-img-card:hover {
                border-color: rgba(239, 68, 68, 0.5);
                background: rgba(239, 68, 68, 0.05);
                transform: translateY(-2px);
            }
            .hisper-img-card img {
                width: 100%;
                height: auto;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .hisper-img-label {
                font-size: 10.5px;
                color: #cbd5e1;
                text-align: center;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
})();

/**
 * Toggles the visibility of the Hisper Incident marker and flies the map camera to its coordinate.
 * @param {boolean} isChecked - The new state of the checkbox switch
 */
function toggleHisperIncident(isChecked) {
    if (typeof map1 === 'undefined' || !map1) {
        console.error("Mapbox GL map instance (map1) is not defined.");
        return;
    }

    const coordinates = [74.99042958134855, 36.174946979474434];

    if (isChecked) {
        // Remove existing marker and popup to prevent duplication
        if (hisperMarker) {
            hisperMarker.remove();
        }
        if (hisperPopup) {
            hisperPopup.remove();
        }

        // Create the custom HTML elements for the blinking/pulsing marker
        const el = document.createElement('div');
        el.className = 'hisper-blink-marker';
        el.title = "Hisper Incident Location - Click to toggle video popup";

        const ring = document.createElement('div');
        ring.className = 'hisper-blink-ring';

        const dot = document.createElement('div');
        dot.className = 'hisper-blink-dot';

        el.appendChild(ring);
        el.appendChild(dot);

        // Build the HTML5 video popup
        // The video is autoplaying, looping, and initially muted to conform to browser autoplay policies.
        // Controls are enabled so the user can seek, unmute, and pause/play.
        hisperPopup = new mapboxgl.Popup({
            offset: [0, -15],
            closeButton: true,
            closeOnClick: false,
            className: 'hisper-incident-popup'
        }).setHTML(`
            <div class="hisper-popup-content">
                <div class="hisper-popup-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #f87171; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">Hisper Incident</h4>
                </div>
                <div class="hisper-popup-body">
                    <video src="data/Hisper/Incident.mp4" autoplay loop muted playsinline controls style="width: 100%; max-height: 280px; object-fit: contain; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 12px rgba(0,0,0,0.6);"></video>
                    <div style="font-size: 10.5px; margin-top: 6px; color: #cbd5e1; line-height: 1.4;">
                        <p style="margin: 2px 0;"><strong>Location:</strong> Hispar Valley</p>
                        <p style="margin: 2px 0;"><strong>Coordinates:</strong> 36.17495° N, 74.99043° E</p>
                    </div>
                </div>
            </div>
        `);

        // Create the Mapbox marker and attach the popup
        hisperMarker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat(coordinates)
        .setPopup(hisperPopup)
        .addTo(map1);

        // Open the popup immediately
        hisperPopup.setLngLat(coordinates).addTo(map1);

        // Show temperature chart for Hisper from the Google Sheet GID
        if (typeof showLakeTempChart === 'function') {
            showLakeTempChart('hisper-incident');
        }

        // Show GLOF video widget for Hisper
        if (typeof showLakeVideoWidget === 'function') {
            showLakeVideoWidget('hisper-incident');
        }

        // Zoom/Fly camera to the incident area
        map1.flyTo({
            center: coordinates,
            zoom: 14.5,
            pitch: 55,
            bearing: 0,
            duration: 2500,
            essential: true
        });

        // Show the bottom-center images telemetry widget
        const imagesWidget = document.getElementById('hisper-images-widget');
        if (imagesWidget) {
            imagesWidget.classList.add('is-visible');
        }
    } else {
        // Clean up marker and popup
        if (hisperMarker) {
            hisperMarker.remove();
            hisperMarker = null;
        }
        if (hisperPopup) {
            hisperPopup.remove();
            hisperPopup = null;
        }
        // Close the temperature chart widget if Hisper is currently showing
        if (typeof closeLakeTempWidget === 'function' && window.currentActiveLakeName === 'Hisper') {
            closeLakeTempWidget();
        }
        // Close the GLOF video widget if Hisper is currently active
        if (typeof closeLakeVideoWidget === 'function' && window.currentActiveLakeName === 'Hisper') {
            closeLakeVideoWidget();
        }
        // Close the bottom-center images telemetry widget
        closeHisperImagesWidget();
    }
}

/**
 * Closes the bottom-center Hisper images telemetry widget
 */
function closeHisperImagesWidget() {
    const widget = document.getElementById('hisper-images-widget');
    if (widget) {
        widget.classList.remove('is-visible');
    }
}

/**
 * Opens the generic panel modal and displays the selected telemetry image enlarged
 * @param {string} imgSrc - The path to the image asset
 * @param {string} titleText - The title to display in the modal header
 */
function zoomHisperImage(imgSrc, titleText) {
    const modal = document.getElementById('panelModal');
    const title = document.getElementById('panelModalTitle');
    const body = document.getElementById('panelModalBody');
    if (!modal || !title || !body) return;

    modal.dataset.activePanel = 'hisperImage';
    title.textContent = titleText;
    body.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.85); padding: 16px; box-sizing: border-box;">
            <img src="${imgSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; border: 1.5px solid rgba(239, 68, 68, 0.4); box-shadow: 0 0 30px rgba(0, 0, 0, 0.85);" alt="${titleText}" />
        </div>
    `;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}
