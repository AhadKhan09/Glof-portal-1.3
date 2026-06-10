// ── Vulnerable Sites 2026 — icon points toggle ─────────────────────────────
function toggleVulSites2026(map) {
    const layer = 'vul-sites-2026-layer';
    const isVisible = map.getLayoutProperty(layer, 'visibility') === 'visible';
    map.setLayoutProperty(layer, 'visibility', isVisible ? 'none' : 'visible');
}
// ── Chatiboi Lake toggle ───────────────────────────────────────────────────
function toggleChatiboiLayer(map) {
    const fill    = 'chatiboi-lake-fill';
    const outline = 'chatiboi-lake-outline';
    const isVisible = map.getLayoutProperty(fill, 'visibility') === 'visible';
    const next = isVisible ? 'none' : 'visible';
    map.setLayoutProperty(fill,    'visibility', next);
    map.setLayoutProperty(outline, 'visibility', next);
}
// ───────────────────────────────────────────────────────────────────────────
// ── Vulnerable Lakes 2026 — blinking outline toggle ──────────────────────
let glofLakesBlinkInterval = null;

function toggleGlofLakes(map) {
    const fillLayer = 'glof-lakes-fill';
    const outLayer  = 'glof-lakes-outline';
    const pinLayer  = 'glof-lakes-centroid';
    const isVisible = map.getLayoutProperty(pinLayer, 'visibility') === 'visible';

    if (!isVisible) {
        // Show polygon layers AND centroid ring layer
        if (map.getLayer(fillLayer)) map.setLayoutProperty(fillLayer, 'visibility', 'visible');
        if (map.getLayer(outLayer)) map.setLayoutProperty(outLayer, 'visibility', 'visible');
        if (map.getLayer(pinLayer)) map.setLayoutProperty(pinLayer, 'visibility', 'visible');

        // Blink ring icon
        let iconOn = true;
        glofLakesBlinkInterval = setInterval(function () {
            if (map.getLayer(pinLayer)) {
                map.setPaintProperty(pinLayer, 'icon-opacity', iconOn ? 1 : 0);
            }
            iconOn = !iconOn;
        }, 500);
    } else {
        // Stop blinking and hide everything
        if (glofLakesBlinkInterval !== null) {
            clearInterval(glofLakesBlinkInterval);
            glofLakesBlinkInterval = null;
        }
        if (map.getLayer(pinLayer)) {
            map.setPaintProperty(pinLayer, 'icon-opacity', 1); // reset for next show
            map.setLayoutProperty(pinLayer, 'visibility', 'none');
        }
        if (map.getLayer(fillLayer)) map.setLayoutProperty(fillLayer, 'visibility', 'none');
        if (map.getLayer(outLayer)) map.setLayoutProperty(outLayer, 'visibility', 'none');
    }
}
// ─────────────────────────────────────────────────────────────────────────────

function isLayerVisible(layerId) {
    return !!(map1 && map1.getLayer(layerId) && map1.getLayoutProperty(layerId, 'visibility') === 'visible');
}

function setLayerVisibility(layerId, isVisible) {
    if (!map1 || !map1.getLayer(layerId)) {
        return;
    }
    map1.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
    refreshActiveLayersLegend();
}

// Store for point customizations
window.layerCustomizations = window.layerCustomizations || {};
window.activeLayersLegendOrder = window.activeLayersLegendOrder || [];
let draggedLegendItem = null;

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.max(0, R);
    G = Math.max(0, G);
    B = Math.max(0, B);

    let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function recreatePinIcon(imageName, baseColor) {
    const size = 50;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    const centerX = size / 2;
    const centerY = 20;

    context.beginPath();
    context.moveTo(centerX, size - 4);
    context.bezierCurveTo(centerX - 13, 33, 11, 19, centerX, 7);
    context.bezierCurveTo(size - 11, 19, centerX + 13, 33, centerX, size - 4);
    context.closePath();
    context.fillStyle = baseColor;
    context.fill();

    context.beginPath();
    context.arc(centerX, centerY, 15.5, 0, Math.PI * 2);
    context.fillStyle = '#3f3f46';
    context.fill();

    context.beginPath();
    context.arc(centerX, centerY, 12, 0, Math.PI * 2);
    context.fillStyle = baseColor;
    context.fill();

    context.beginPath();
    context.arc(centerX, centerY, 6.2, 0, Math.PI * 2);
    context.fillStyle = '#f8fafc';
    context.fill();

    context.beginPath();
    context.arc(centerX, centerY, 3.1, 0, Math.PI * 2);
    context.fillStyle = shadeColor(baseColor, -20);
    context.fill();

    const imageData = {
        width: size,
        height: size,
        data: new Uint8Array(context.getImageData(0, 0, size, size).data)
    };

    if (map1 && map1.hasImage(imageName)) {
        map1.updateImage(imageName, imageData);
    }
}

window.glofOriginalLayerSizes = window.glofOriginalLayerSizes || {};

function normalizeScaleValue(rawValue, fallbackValue = 1) {
    const parsedValue = parseFloat(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function buildScaledIconSize(layerId, scaleValue) {
    const baseSize = window.glofOriginalLayerSizes[layerId];

    if (baseSize === undefined || baseSize === null) {
        return scaleValue;
    }

    if (Array.isArray(baseSize)) {
        try {
            return ['*', baseSize, scaleValue];
        } catch (e) {
            return scaleValue;
        }
    }

    if (typeof baseSize === 'number' && Number.isFinite(baseSize)) {
        return baseSize * scaleValue;
    }

    if (typeof baseSize === 'object') {
        try {
            if (baseSize.stops && Array.isArray(baseSize.stops)) {
                const scaledStops = baseSize.stops.map(stop => {
                    if (Array.isArray(stop) && stop.length === 2 && typeof stop[1] === 'number') {
                        return [stop[0], stop[1] * scaleValue];
                    }
                    return stop;
                });
                return Object.assign({}, baseSize, { stops: scaledStops });
            }
            return baseSize;
        } catch (e) {
            return baseSize;
        }
    }

    if (typeof baseSize === 'string') {
        const parsed = parseFloat(baseSize);
        if (Number.isFinite(parsed)) {
            return parsed * scaleValue;
        }
    }

    return scaleValue;
}

function applyCustomization(layerIds, color, size, opacity, iconElement) {
    if (!map1) return;
    
    const layerArray = Array.isArray(layerIds) ? layerIds : [layerIds];
    
    layerArray.forEach(layerId => {
        if (!map1.getLayer(layerId)) return;
        
        const layerType = map1.getLayer(layerId).type;
        
        if (layerType === 'symbol') {
            let layoutIconImg;
            try {
                layoutIconImg = map1.getLayoutProperty(layerId, 'icon-image');
            } catch(e) {}
            if (layoutIconImg && !Array.isArray(layoutIconImg)) {
                const imageName = layoutIconImg;
                recreatePinIcon(imageName, color);
                
                if (!window.glofOriginalLayerSizes[layerId]) {
                    const currentSize = map1.getLayoutProperty(layerId, 'icon-size');
                    window.glofOriginalLayerSizes[layerId] = currentSize || 1;
                }
                const scaleValue = normalizeScaleValue(size, 1);
                const scaledIconSize = buildScaledIconSize(layerId, scaleValue);
                map1.setLayoutProperty(layerId, 'icon-size', scaledIconSize);

                if (opacity !== undefined) {
                    map1.setPaintProperty(layerId, 'icon-opacity', parseFloat(opacity));
                    if (map1.getLayoutProperty(layerId, 'text-field')) {
                        map1.setPaintProperty(layerId, 'text-opacity', parseFloat(opacity));
                    }
                }
            }
        } else if (layerType === 'circle') {
            // It's a circle layer
            map1.setPaintProperty(layerId, 'circle-color', color);
            
            if (!window.glofOriginalLayerSizes[layerId]) {
                const currentSize = map1.getPaintProperty(layerId, 'circle-radius');
                window.glofOriginalLayerSizes[layerId] = currentSize || 6;
            }
            
            const scaleValue = normalizeScaleValue(size, 1);
            const scaledIconSize = buildScaledIconSize(layerId, scaleValue);
            map1.setPaintProperty(layerId, 'circle-radius', scaledIconSize);

            if (opacity !== undefined) {
                map1.setPaintProperty(layerId, 'circle-opacity', parseFloat(opacity));
                map1.setPaintProperty(layerId, 'circle-stroke-opacity', parseFloat(opacity));
            }
        } else if (layerType === 'fill') {
            // It's a fill (polygon) layer
            map1.setPaintProperty(layerId, 'fill-color', color);
            
            if (opacity !== undefined) {
                map1.setPaintProperty(layerId, 'fill-opacity', parseFloat(opacity));
            }
        } else if (layerType === 'line') {
            // It's a line layer
            map1.setPaintProperty(layerId, 'line-color', color);
            
            if (!window.glofOriginalLayerSizes[layerId]) {
                const currentSize = map1.getPaintProperty(layerId, 'line-width');
                window.glofOriginalLayerSizes[layerId] = currentSize || 2;
            }
            
            const scaleValue = normalizeScaleValue(size, 1);
            const scaledIconSize = buildScaledIconSize(layerId, scaleValue);
            map1.setPaintProperty(layerId, 'line-width', scaledIconSize);

            if (opacity !== undefined) {
                map1.setPaintProperty(layerId, 'line-opacity', parseFloat(opacity));
            }
        } else if (layerType === 'raster') {
            // It's a raster/image layer
            if (opacity !== undefined) {
                map1.setPaintProperty(layerId, 'raster-opacity', parseFloat(opacity));
            }
        }
    });

    if (iconElement) {
        iconElement.style.background = color;
        if (iconElement.classList.contains('icon-line')) {
            iconElement.style.border = 'none';
        } else {
            iconElement.style.border = `1px solid ${shadeColor(color, -40)}`;
        }
        if (opacity !== undefined) {
            iconElement.style.opacity = opacity;
        }
    }
}

function getLegendLayerKey(layer) {
    return layer.layerId || layer.id;
}

function normalizeLegendOrder(enabledLayers) {
    const existingOrder = Array.isArray(window.activeLayersLegendOrder)
        ? window.activeLayersLegendOrder
        : [];
    const orderSet = new Set(existingOrder);
    const newKeys = [];

    enabledLayers.forEach((layer) => {
        const key = getLegendLayerKey(layer);
        layer.legendKey = key;
        if (key && !orderSet.has(key)) {
            newKeys.push(key);
            orderSet.add(key);
        }
    });

    if (newKeys.length) {
        window.activeLayersLegendOrder = existingOrder.concat(newKeys);
    }

    const orderLookup = new Map(window.activeLayersLegendOrder.map((key, index) => [key, index]));
    enabledLayers.sort((a, b) => {
        const aIndex = orderLookup.has(a.legendKey) ? orderLookup.get(a.legendKey) : Number.MAX_SAFE_INTEGER;
        const bIndex = orderLookup.has(b.legendKey) ? orderLookup.get(b.legendKey) : Number.MAX_SAFE_INTEGER;
        if (aIndex === bIndex) {
            return a.menuIndex - b.menuIndex;
        }
        return aIndex - bIndex;
    });
}

function applyLegendLayerOrder(legendItems) {
    if (!map1 || !map1.getLayer || !Array.isArray(legendItems)) {
        return;
    }

    const orderedLayerIds = legendItems
        .map((item) => item.dataset.layerId)
        .filter((layerId) => layerId && map1.getLayer(layerId));

    for (let index = orderedLayerIds.length - 1; index >= 0; index -= 1) {
        map1.moveLayer(orderedLayerIds[index]);
    }
}

function syncLegendOrderFromDom(container) {
    const legendContainer = container || document.getElementById('active-layers-legend-items');
    if (!legendContainer) {
        return;
    }

    const items = Array.from(legendContainer.querySelectorAll('.active-layers-legend-item'));
    const visibleKeys = items.map((item) => item.dataset.layerKey).filter(Boolean);
    const existingOrder = Array.isArray(window.activeLayersLegendOrder)
        ? window.activeLayersLegendOrder
        : [];
    const remainingKeys = existingOrder.filter((key) => !visibleKeys.includes(key));
    window.activeLayersLegendOrder = visibleKeys.concat(remainingKeys);
    applyLegendLayerOrder(items);
}

function handleLegendDragStart(event) {
    const handle = event.target;
    const item = handle.closest('.active-layers-legend-item');
    if (!item || !event.dataTransfer) {
        return;
    }

    draggedLegendItem = item;
    item.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.dataset.layerKey || '');
}

function handleLegendDragOver(event) {
    event.preventDefault();
    const container = event.currentTarget;
    if (!container || !draggedLegendItem) {
        return;
    }

    const targetItem = event.target.closest('.active-layers-legend-item');
    if (!targetItem || targetItem === draggedLegendItem) {
        return;
    }

    const rect = targetItem.getBoundingClientRect();
    const offset = event.clientY - rect.top;
    const insertAfter = offset > rect.height / 2;

    if (insertAfter) {
        if (targetItem.nextSibling !== draggedLegendItem) {
            container.insertBefore(draggedLegendItem, targetItem.nextSibling);
        }
    } else if (targetItem.previousSibling !== draggedLegendItem) {
        container.insertBefore(draggedLegendItem, targetItem);
    }
}

function handleLegendDragEnd() {
    if (draggedLegendItem) {
        draggedLegendItem.classList.remove('is-dragging');
        draggedLegendItem = null;
    }
    syncLegendOrderFromDom();
}

function bindLegendDragHandlers() {
    const legendContainer = document.getElementById('active-layers-legend-items');
    if (!legendContainer || legendContainer.dataset.dragHandlersBound === 'true') {
        return;
    }

    legendContainer.addEventListener('dragover', handleLegendDragOver);
    legendContainer.addEventListener('drop', (event) => {
        event.preventDefault();
        syncLegendOrderFromDom(legendContainer);
    });
    legendContainer.dataset.dragHandlersBound = 'true';
}

function getDefaultColorForLayer(layerId) {
    const id = layerId.toLowerCase();
    // PMD categorized layers
    if (id.includes('pmd-sensors-arg')) return '#ca8a04';
    if (id.includes('pmd-sensors-aws')) return '#e11d48';
    if (id.includes('pmd-sensors-wl-r')) return '#2563eb';
    if (id.includes('pmd-sensors-wl-l')) return '#0d9488';
    if (id.includes('pmd-sensors-wp')) return '#9333ea';
    if (id.includes('pmd-sensors-dg')) return '#ea580c';
    
    if (id.includes('vulnerable-melting-glaciers')) return '#00aeff';
    if (id.includes('vulnerable-melting-points')) return '#ff3d00';
    if (id.includes('glof-ii')) return '#facc15';
    if (id.includes('akah')) return '#22c55e';
    if (id.includes('undp')) return '#fb923c';
    if (id.includes('bri-ff')) return '#f87171';
    if (id.includes('gmrc')) return '#0ea5e9';
    return '#facc15'; // Default fallback yellow
}

function refreshActiveLayersLegend() {
    const legendItemsContainer = document.getElementById('active-layers-legend-items');
    const legendPanel = document.getElementById('active-layers-legend');
    const menu = document.getElementById('menu');

    if (!legendItemsContainer || !legendPanel || !menu) {
        return;
    }

    const checkedInputs = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked'));
    let hasRiskZonationChecked = false;
    
    const enabledLayers = checkedInputs
        .map((inputElement, index) => {
            let layerName = '';
            const row = inputElement.closest('.toggle-row');
            const labelSpan = row ? row.querySelector('.toggle-label') : null;
            if (labelSpan) {
                layerName = labelSpan.textContent.trim();
            } else {
                const label = menu.querySelector(`label[for="${inputElement.id}"]`);
                layerName = label ? label.textContent.trim() : '';
            }
            
            if (layerName === 'Risk Zonation') {
                hasRiskZonationChecked = true;
                return null;
            }
            
            let layerIds = [];
            if (inputElement.dataset.layer) {
                layerIds.push(inputElement.dataset.layer);
            } else {
                layerIds = parseLayerIdsFromToggleInput(inputElement);
            }
            
            // Fallback for hardcoded functions that don't pass the array inline
            if (!layerIds.length) {
                const id = inputElement.id;
                if (id === 'inventory-toggle') layerIds = ['glacial-lakes-inventory-fill', 'glacial-lakes-inventory-outline', 'glacial-lakes-inventory-centers'];
                else if (id === 'quick-incident-2025-toggle') layerIds = ['incident'];
                else if (id === 'quick-station-points-toggle') layerIds = ['station-points-animated-layer', 'station-points-animated-halo-layer', 'station-points-label-layer'];
                else if (id === 'quick-high-temp-2026-toggle') layerIds = ['high-temp-warning-area'];
                else if (id === 'lst-layer-toggle') layerIds = ['lst-month-1'];
                else if (id === 'risk-zonation-ava-toggle') layerIds = ['akah-hzd-ava-layer', 'akah-hzd-ava-outline-layer'];
                else if (id === 'risk-zonation-dbf-toggle') layerIds = ['akah-hzd-dbf-layer', 'akah-hzd-dbf-outline-layer'];
                else if (id === 'risk-zonation-bnk-toggle') layerIds = ['akah-hzd-bnk-layer', 'akah-hzd-bnk-outline-layer'];
                else if (id === 'risk-zonation-fld-toggle') layerIds = ['akah-hzd-fld-layer', 'akah-hzd-fld-outline-layer'];
                else if (id === 'risk-zonation-lds-toggle') layerIds = ['akah-hzd-lds-layer', 'akah-hzd-lds-outline-layer'];
                else if (id === 'risk-zonation-rkf-toggle') layerIds = ['akah-hzd-rkf-layer', 'akah-hzd-rkf-outline-layer'];
                else if (id === 'risk-zonation-ufl-toggle') layerIds = ['akah-hzd-ufl-layer', 'akah-hzd-ufl-outline-layer'];
                else if (id === 'quick-vulsites-2025-toggle') layerIds = ['vulSites'];
                else if (id === 'quick-vullakes-2025-toggle') layerIds = ['vulLakes'];
                else if (id === 'quick-vulsites-2026-toggle') layerIds = ['vul-sites-2026-layer'];
                else if (id === 'quick-vullakes-2026-toggle') layerIds = ['glof-lakes-centroid'];
                else if (id === 'quick-vulnerable-melting-glaciers-toggle') layerIds = ['vulnerable-melting-glaciers-layer', 'vulnerable-melting-glaciers-outline'];
                else if (id === 'quick-vulnerable-melting-points-toggle') layerIds = ['vulnerable-melting-points-layer', 'vulnerable-melting-points-outline', 'vulnerable-melting-points-circle'];
            }

            return {
                id: inputElement.id,
                menuIndex: index,
                layerName,
                legendIcon: inputElement.dataset.legendIcon || '',
                layerId: layerIds[0] || '',
                layerIds: layerIds.filter(id => !!id),
                inputId: inputElement.id
            };
        })
        .filter((layer) => layer && layer.layerName.length > 0 && layer.layerId);

    if (hasRiskZonationChecked) {
        enabledLayers.push({
            id: 'virtual-risk-zonation-toggle',
            menuIndex: 999,
            layerName: 'Risk Zonation',
            legendIcon: 'icon-untracked',
            layerId: 'virtual-risk-zonation-layer',
            layerIds: [],
            inputId: 'virtual-risk-zonation-toggle',
            isVirtualRiskZonation: true
        });
    }

    legendItemsContainer.innerHTML = '';

    if (!enabledLayers.length) {
        legendPanel.classList.add('is-hidden');
        return;
    }

    legendPanel.classList.remove('is-hidden');

    normalizeLegendOrder(enabledLayers);

    enabledLayers.forEach((layer) => {
        const item = document.createElement('div');
        item.className = 'active-layers-legend-item';
        item.dataset.layerId = layer.layerId || '';
        item.dataset.layerKey = layer.legendKey || '';

        const dragHandle = document.createElement('button');
        dragHandle.type = 'button';
        dragHandle.className = 'legend-drag-handle';
        dragHandle.textContent = '☰';
        dragHandle.title = 'Drag to reorder';
        dragHandle.setAttribute('aria-label', 'Drag to reorder layer');
        dragHandle.draggable = true;
        dragHandle.addEventListener('dragstart', handleLegendDragStart);
        dragHandle.addEventListener('dragend', handleLegendDragEnd);

        let layerType = null;
        if (layer.layerId && map1 && map1.getLayer(layer.layerId)) {
            layerType = map1.getLayer(layer.layerId).type;
        }

        const icon = document.createElement('span');
        let iconClass = getLegendIconClass(layer);
        
        if (layer.id === 'inventory-toggle') {
            iconClass = 'icon-cyan-dot';
            layerType = 'symbol';
        } else if (layerType === 'line') {
            iconClass = 'icon-line';
        } else if (layerType === 'fill') {
            iconClass = 'icon-polygon';
        }
        
        icon.className = `active-layers-legend-icon ${iconClass}`;
        icon.setAttribute('aria-hidden', 'true');

        if (iconClass === 'icon-untracked' || iconClass === 'icon-default') {
            icon.style.opacity = '0';
            icon.style.pointerEvents = 'none';
        }

        let defaultColor = getDefaultColorForLayer(layer.layerId || layer.inputId);
        let actualColor = defaultColor;
        if (layerType === 'line') {
            try { actualColor = map1.getPaintProperty(layer.layerId, 'line-color'); } catch(e){}
        } else if (layerType === 'fill') {
            try { actualColor = map1.getPaintProperty(layer.layerId, 'fill-color'); } catch(e){}
        } else if (layerType === 'circle') {
            try { actualColor = map1.getPaintProperty(layer.layerId, 'circle-color'); } catch(e){}
        }
        
        if (typeof actualColor !== 'string') {
            actualColor = defaultColor; 
        }

        if (layerType === 'line') {
            icon.style.backgroundColor = actualColor;
            icon.style.borderColor = 'transparent';
        } else if (layerType === 'fill') {
            icon.style.backgroundColor = actualColor;
            icon.style.borderColor = '#ffffff';
        } else if (layer.layerId && layer.layerId.includes('pmd-sensors')) {
            icon.style.backgroundColor = defaultColor;
            icon.style.borderColor = '#ffffff';
        }

        const text = document.createElement('span');
        text.textContent = layer.layerName;

        // Wrapper for icon and text (left-aligned)
        const leftWrapper = document.createElement('span');
        leftWrapper.className = 'active-layers-legend-left';
        leftWrapper.appendChild(dragHandle);
        leftWrapper.appendChild(icon);
        leftWrapper.appendChild(text);

        item.appendChild(leftWrapper);

        // Determine count: prefer precomputed counts from map loader, fallback to inspecting source data.
        let count = null;
        try {
            if (window.layerFeatureCounts && Number.isFinite(window.layerFeatureCounts[layer.layerId])) {
                count = window.layerFeatureCounts[layer.layerId];
            } else if (map1 && map1.getLayer && map1.getLayer(layer.layerId)) {
                const srcId = map1.getLayer(layer.layerId).source;
                const src = map1.getSource(srcId);
                const data = (src && (src._data || src.serialize && src.serialize().data || src.data)) || null;
                if (data && Array.isArray(data.features)) {
                    count = data.features.length;
                }
            }
        } catch (e) {
            count = null;
        }

        // Do not display count numbers for any layers in the Vulnerable Lakes section
        const checkbox = document.getElementById(layer.id);
        const isVulnerableLake = checkbox && checkbox.closest('#sec-vlakes');

        if (Number.isFinite(count) && !isVulnerableLake) {
            const countSpan = document.createElement('span');
            countSpan.textContent = String(count);
            countSpan.className = 'active-layers-legend-count';
            item.appendChild(countSpan);
        }

        const controlsWrap = document.createElement('div');
        controlsWrap.className = 'legend-controls-wrap';
        controlsWrap.style.display = 'flex';

        let settingsBtn = null;
        let settingsPanel = null;
        let isCustomizable = false;
        let currentOpt = { color: '#cccccc', opacity: 1, size: 1 };

        if (layer.layerId && map1 && map1.getLayer(layer.layerId)) {
            const layerType = map1.getLayer(layer.layerId).type;
            let layoutIconImg = undefined;
            if (layerType === 'symbol') {
                try {
                    layoutIconImg = map1.getLayoutProperty(layer.layerId, 'icon-image');
                } catch (e) {}
            }
            
            isCustomizable = true; // Make ANY valid layer type we find editable through generic properties if possible, or fallback safely
            currentOpt.color = getDefaultColorForLayer(layer.layerId);

            if (isCustomizable) {
                settingsBtn = document.createElement('button');
                settingsBtn.innerHTML = '&#9881;';
                settingsBtn.className = 'legend-settings-btn';
                settingsBtn.title = 'Customize styling';
                
                settingsPanel = document.createElement('div');
                settingsPanel.className = 'legend-settings-panel';
                settingsPanel.style.display = 'none';

                if(!window.layerCustomizations[layer.layerId]) {
                    window.layerCustomizations[layer.layerId] = { color: currentOpt.color, opacity: 1, size: 1 };
                }
                currentOpt = window.layerCustomizations[layer.layerId];

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = currentOpt.color;
                
                const opacityIcon = document.createElement('i');
                opacityIcon.className = 'fas fa-adjust';
                opacityIcon.style.color = '#94a3b8';
                opacityIcon.style.marginLeft = '4px';
                opacityIcon.style.fontSize = '12px';
                opacityIcon.title = 'Opacity';

                const opacityInput = document.createElement('input');
                opacityInput.type = 'number';
                opacityInput.min = '0.0';
                opacityInput.max = '1.0';
                opacityInput.step = '0.1';
                opacityInput.value = currentOpt.opacity !== undefined ? currentOpt.opacity : 1;
                opacityInput.className = 'legend-number-input';
                
                const sizeIcon = document.createElement('i');
                sizeIcon.className = 'fas fa-search-plus';
                sizeIcon.style.color = '#94a3b8';
                sizeIcon.style.marginLeft = '4px';
                sizeIcon.style.fontSize = '12px';
                sizeIcon.title = 'Size scale';

                const sizeInput = document.createElement('input');
                sizeInput.type = 'number';
                sizeInput.min = '0.1';
                sizeInput.max = '5.0';
                sizeInput.step = '0.1';
                sizeInput.value = currentOpt.size !== undefined ? currentOpt.size : 1;
                sizeInput.className = 'legend-number-input';

                settingsPanel.appendChild(opacityIcon);
                settingsPanel.appendChild(opacityInput);
                
                // Hide color picker for risk zonation layers since their styles are predefined multi-color rules
                const isRiskZonation = layer.layerName.toLowerCase().includes('risk') || 
                                       layer.layerName.toLowerCase().includes('zonation') || 
                                       layer.layerId.toLowerCase().includes('risk') ||
                                       layer.layerName.toLowerCase().includes('susceptibility') ||
                                       layer.inputId === 'risk-zonation-ava-toggle' ||
                                       layer.inputId === 'risk-zonation-dbf-toggle' ||
                                       layer.inputId === 'risk-zonation-bnk-toggle' ||
                                       layer.inputId === 'risk-zonation-fld-toggle' ||
                                       layer.inputId === 'risk-zonation-lds-toggle' ||
                                       layer.inputId === 'risk-zonation-rkf-toggle' ||
                                       layer.inputId === 'risk-zonation-ufl-toggle';

                if (layerType !== 'raster' && !isRiskZonation) {
                    settingsPanel.insertBefore(colorInput, opacityIcon);
                }
                
                if (layerType !== 'fill' && layerType !== 'raster') {
                    settingsPanel.appendChild(sizeIcon);
                    settingsPanel.appendChild(sizeInput);
                }

                controlsWrap.appendChild(settingsBtn);

                settingsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'flex' : 'none';
                });

                const onUpdate = () => {
                    currentOpt.color = colorInput.value;
                    currentOpt.opacity = opacityInput.value;
                    currentOpt.size = sizeInput.value;
                    applyCustomization(layer.layerIds, currentOpt.color, currentOpt.size, currentOpt.opacity, icon);
                };

                colorInput.addEventListener('input', onUpdate);
                opacityInput.addEventListener('change', onUpdate);
                sizeInput.addEventListener('change', onUpdate);
            }
        }

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&#10005;'; // cross symbol
        closeBtn.className = 'legend-settings-btn';
        closeBtn.title = 'Remove layer';
        closeBtn.style.color = '#ef4444';

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (layer.isVirtualRiskZonation) {
                const checkedRiskInputs = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked'))
                    .filter(input => {
                        const row = input.closest('.toggle-row');
                        const labelSpan = row ? row.querySelector('.toggle-label') : null;
                        const labelText = labelSpan ? labelSpan.textContent.trim() : (menu.querySelector(`label[for="${input.id}"]`)?.textContent.trim() || '');
                        return labelText === 'Risk Zonation';
                    });
                checkedRiskInputs.forEach(cb => cb.click());
            } else {
                const checkbox = document.getElementById(layer.inputId || layer.id);
                if (checkbox) {
                    checkbox.click();
                } else if (layer.inputId) {
                    try {
                        const cb = document.querySelector(`input[data-layer-id="${layer.layerId}"]`) || document.getElementById(layer.inputId);
                        if(cb) cb.click();
                    } catch(e) {}
                }
            }
        });

        controlsWrap.appendChild(closeBtn);
        if (settingsPanel) {
            controlsWrap.appendChild(settingsPanel);
        }
        
        item.appendChild(controlsWrap);

        if (isCustomizable && (currentOpt.color !== getDefaultColorForLayer(layer.layerId) || currentOpt.opacity !== 1 || currentOpt.size !== 1)) {
            applyCustomization(layer.layerIds, currentOpt.color, currentOpt.size, currentOpt.opacity, icon);
        }

        if (layer.isVirtualRiskZonation) {
            const subLegend = document.createElement('div');
            subLegend.className = 'risk-zonation-sub-legend';
            subLegend.innerHTML = `
                <span class="sub-legend-item">
                    <span class="sub-legend-color" style="background-color: #7d0800;"></span>
                    <span class="sub-legend-text">High</span>
                </span>
                <span class="sub-legend-item">
                    <span class="sub-legend-color" style="background-color: #f0e02e;"></span>
                    <span class="sub-legend-text">Medium</span>
                </span>
                <span class="sub-legend-item">
                    <span class="sub-legend-color" style="background-color: #00990f;"></span>
                    <span class="sub-legend-text">Low</span>
                </span>
            `;
            item.appendChild(subLegend);
        }

        legendItemsContainer.appendChild(item);
    });

    applyLegendLayerOrder(Array.from(legendItemsContainer.querySelectorAll('.active-layers-legend-item')));
}

function getLegendIconClass(layer) {
    const inputId = String(layer && layer.id ? layer.id : '');
    const layerName = String(layer && layer.layerName ? layer.layerName : '');
    const explicitLegendIcon = String(layer && layer.legendIcon ? layer.legendIcon : '').trim();

    if (explicitLegendIcon) {
        if (explicitLegendIcon === 'icon-default') {
            return 'icon-untracked';
        }
        return explicitLegendIcon;
    }

    if (inputId === 'inventory-toggle') {
        return 'icon-cyan-dot';
    }

    if (inputId === 'quick-akah-toggle') {
        return 'icon-circle-red-small';
    }

    if (inputId === 'quick-vulsites-2026-toggle') {
        return 'icon-red-pin';
    }

    if (inputId === 'quick-vullakes-2026-toggle') {
        return 'icon-red-ring';
    }

    const normalizedName = layerName.toLowerCase();

    if (inputId === 'quick-gmrc-wapda-toggle') {
        return 'icon-blue-destination';
    }

    if (inputId === 'quick-glof-ii-toggle') {
        return 'icon-yellow-destination';
    }

    if (
        inputId === 'quick-glof-ii-damaged-toggle' ||
        inputId === 'quick-high-temp-2026-toggle' ||
        normalizedName.includes('damaged') ||
        normalizedName.includes('warning')
    ) {
        return 'icon-warning';
    }

        if (
            inputId === 'quick-akah-stations-toggle' ||
            normalizedName.includes('station') ||
            normalizedName.includes('sensor')
        ) {
        return 'icon-green-destination';
    }

    return 'icon-untracked';
}

function initializeActiveLayersLegend() {
    const menu = document.getElementById('menu');
    if (!menu) {
        refreshActiveLayersLegend();
        return;
    }

    if (menu.dataset.activeLayersLegendBound !== 'true') {
        bindLegendDragHandlers();
        menu.addEventListener('change', refreshActiveLayersLegend);
        menu.dataset.activeLayersLegendBound = 'true';
    }

    refreshActiveLayersLegend();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeActiveLayersLegend);
} else {
    initializeActiveLayersLegend();
}

function toggleGlacialLakesInventory(isChecked) {
    setLayerVisibility('glacial-lakes-inventory-fill', isChecked);
    setLayerVisibility('glacial-lakes-inventory-outline', isChecked);
    setLayerVisibility('glacial-lakes-inventory-centers', isChecked);
}

function toggleQuickAkahLayer(isChecked) {
    setLayerVisibility('akah-infrastructure-layer', isChecked);
}

function toggleQuickPopulatedPlaces(isChecked) {
    setLayerVisibility('populated-places-points-layer', isChecked);
    setLayerVisibility('populated-places-name-label-layer', isChecked);
    setLayerVisibility('populated-places-population-label-layer', isChecked);

    if (!isChecked && typeof window.hidePopulatedPlacesHoverAnimationMarker === 'function') {
        window.hidePopulatedPlacesHoverAnimationMarker();
    }
}

function toggleQuickGmrcWapda(isChecked) {
    setLayerVisibility('gmrc-wapda-points-layer', isChecked);
}

function toggleQuickPdmaKp(isChecked) {
    setLayerVisibility('pdma-kp-points-layer', isChecked);
}

function toggleQuickEvK2CNR(isChecked) {
    setLayerVisibility('evk2cnr-points-layer', isChecked);
}

function toggleQuickGlofII(isChecked) {
    setLayerVisibility('glof-ii-stations-layer', isChecked);
}

function toggleQuickGlofIIDamagedStations(isChecked) {
    setLayerVisibility('glof-ii-damaged-stations-layer', isChecked);
}

function toggleQuickAkahStations(isChecked) {
    setLayerVisibility('akah-stations-layer', isChecked);
}

function toggleQuickUndpAllSensors(isChecked) {
    setLayerVisibility('undp-all-sensors-layer', isChecked);
}

function toggleQuickBriFfSensors(isChecked) {
    setLayerVisibility('bri-ff-sensors-layer', isChecked);
}

function toggleQuickVulnerableMeltingGlaciers(isChecked) {
    setLayerVisibility('vulnerable-melting-glaciers-layer', isChecked);
    setLayerVisibility('vulnerable-melting-glaciers-outline', isChecked);
}

function toggleQuickVulnerableMeltingPoints(isChecked) {
    setLayerVisibility('vulnerable-melting-points-layer', isChecked);
    setLayerVisibility('vulnerable-melting-points-outline', isChecked);
    setLayerVisibility('vulnerable-melting-points-circle', isChecked);
}

function toggleFloodSusceptibility(isChecked) {
    setLayerVisibility('flood-susceptibility-layer', isChecked);
}

const akahHazardTypeLayerMap = {
    ava: ['akah-hzd-ava-layer', 'akah-hzd-ava-outline-layer'],
    dbf: ['akah-hzd-dbf-layer', 'akah-hzd-dbf-outline-layer'],
    bnk: ['akah-hzd-bnk-layer', 'akah-hzd-bnk-outline-layer'],
    fld: ['akah-hzd-fld-layer', 'akah-hzd-fld-outline-layer'],
    lds: ['akah-hzd-lds-layer', 'akah-hzd-lds-outline-layer'],
    rkf: ['akah-hzd-rkf-layer', 'akah-hzd-rkf-outline-layer'],
    ufl: ['akah-hzd-ufl-layer', 'akah-hzd-ufl-outline-layer']
};

function toggleAkahHazardType(typeCode, isChecked) {
    const layerIds = akahHazardTypeLayerMap[typeCode];
    if (!Array.isArray(layerIds)) {
        return;
    }
    layerIds.forEach((layerId) => setLayerVisibility(layerId, isChecked));
}

function toggleQuickVulnerableSites2025(isChecked) {
    setLayerVisibility('vulSites', isChecked);
    if (isChecked) {
        changeVideo1(DEFAULT_TOP_VIDEO);
        changeVideo2(DEFAULT_BOTTOM_VIDEO);
    }
}

function toggleQuickVulnerableLakes2025(isChecked) {
    setLayerVisibility('vulLakes', isChecked);
}

function toggleQuickIncident2025(isChecked) {
    const incidentIsVisible = isLayerVisible('incident');
    if (incidentIsVisible !== isChecked) {
        handleIncidentButton();
    }
}

function toggleQuickVulnerableSites2026(isChecked) {
    setLayerVisibility('vul-sites-2026-layer', isChecked);
}

function toggleQuickVulnerableLakes2026(isChecked) {
    const lakesVisible = isLayerVisible('glof-lakes-centroid');
    if (lakesVisible !== isChecked) {
        toggleGlofLakes(map1);
    }
}

function toggleQuickStationPoints(isChecked) {
    setLayerVisibility('station-points-layer', false);
    setLayerVisibility('station-points-animated-halo-layer', isChecked);
    setLayerVisibility('station-points-animated-layer', isChecked);
    setLayerVisibility('station-points-label-layer', isChecked);

    if (isChecked) {
        enableStationPointAnimation();
        return;
    }

    disableStationPointAnimation();
    closeStationForecastWidget();
}

const STATION_FORECAST_CSV_URL = 'data/station%20forecast%20data.csv';
const STATION_POINTS_GEOJSON_URL = 'data/geojsons/station_points.geojson';
const STATION_ANIMATION_SPEED_PER_SECOND = 1.6;

let stationForecastLoadPromise = null;
let stationForecastHeaders = [];
let stationForecastHeaderLookup = {};
let stationForecastSeries = {};
let stationForecastTimeline = [];
let stationForecastChart = null;
let stationAnimationMetadataLoadPromise = null;
let stationAnimationStationNames = [];
let stationAnimationHeaderByStationName = {};
let stationAnimationCurrentPosition = 0;
let stationAnimationPlayRafId = null;
let stationAnimationLastFrameTs = 0;
let stationAnimationMinValue = 0;
let stationAnimationMaxValue = 1;

function normalizeStationName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function splitCsvRow(rowText) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < rowText.length; i += 1) {
        const char = rowText[i];

        if (char === '"') {
            if (inQuotes && rowText[i + 1] === '"') {
                currentField += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }

    fields.push(currentField);
    return fields;
}

function buildStationForecastTimeline(dateValues) {
    const countsByDate = {};
    const indexByDate = {};

    dateValues.forEach((dateValue) => {
        countsByDate[dateValue] = (countsByDate[dateValue] || 0) + 1;
    });

    return dateValues.map((dateValue) => {
        const currentIndex = indexByDate[dateValue] || 0;
        const totalCount = countsByDate[dateValue] || 1;
        const stepHours = 24 / totalCount;
        const hour = Math.max(0, Math.min(23, Math.round(currentIndex * stepHours)));

        indexByDate[dateValue] = currentIndex + 1;

        return `${dateValue} ${String(hour).padStart(2, '0')}:00`;
    });
}

function parseStationForecastCsv(csvText) {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        throw new Error('Station forecast CSV is empty or invalid.');
    }

    const allHeaders = splitCsvRow(lines[0]).map((header) => header.trim());
    const headers = allHeaders.slice(1);

    if (!headers.length) {
        throw new Error('No station columns found in station forecast CSV.');
    }

    const rows = [];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
        const fields = splitCsvRow(lines[lineIndex]);
        const dateValue = (fields[0] || '').trim();

        if (!dateValue) {
            continue;
        }

        const values = headers.map((_, valueIndex) => {
            const rawValue = (fields[valueIndex + 1] || '').trim();
            const numericValue = Number.parseFloat(rawValue);
            return Number.isFinite(numericValue) ? numericValue : null;
        });

        rows.push({
            date: dateValue,
            values
        });
    }

    if (!rows.length) {
        throw new Error('No forecast records found in station forecast CSV.');
    }

    stationForecastHeaders = headers;
    stationForecastSeries = {};
    stationForecastHeaderLookup = {};
    stationForecastTimeline = buildStationForecastTimeline(rows.map((row) => row.date));

    headers.forEach((header, headerIndex) => {
        stationForecastSeries[header] = rows.map((row) => row.values[headerIndex]);
        stationForecastHeaderLookup[normalizeStationName(header)] = header;
    });
}

async function ensureStationForecastDataLoaded() {
    if (stationForecastHeaders.length && stationForecastTimeline.length) {
        return;
    }

    if (stationForecastLoadPromise) {
        return stationForecastLoadPromise;
    }

    stationForecastLoadPromise = (async () => {
        const response = await fetch(STATION_FORECAST_CSV_URL, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error('Unable to load data/station forecast data.csv');
        }

        const csvText = await response.text();
        parseStationForecastCsv(csvText);
    })().finally(() => {
        stationForecastLoadPromise = null;
    });

    return stationForecastLoadPromise;
}

function resolveStationForecastHeader(stationName) {
    const exactInput = String(stationName || '').trim();

    if (!exactInput) {
        return null;
    }

    // Primary path: exact station name match between GeoJSON and CSV header.
    if (Object.prototype.hasOwnProperty.call(stationForecastSeries, exactInput)) {
        return exactInput;
    }

    // Strict fallback only for casing/diacritic formatting differences.
    const normalizedInput = normalizeStationName(exactInput);

    if (!normalizedInput) {
        return null;
    }

    if (stationForecastHeaderLookup[normalizedInput]) {
        return stationForecastHeaderLookup[normalizedInput];
    }

    const compactInput = normalizedInput.replace(/\s+/g, '');
    if (compactInput) {
        const normalizedHeaderKey = Object.keys(stationForecastHeaderLookup).find((key) => {
            return key.replace(/\s+/g, '') === compactInput;
        });

        if (normalizedHeaderKey) {
            return stationForecastHeaderLookup[normalizedHeaderKey];
        }
    }

    return null;
}

function getStationAnimationElements() {
    const panel = document.getElementById('station-animation-panel');
    const date = document.getElementById('station-animation-date');
    const slider = document.getElementById('station-animation-slider');
    const playButton = document.getElementById('station-animation-play-btn');
    const range = document.getElementById('station-animation-range');

    if (!panel || !date || !slider || !playButton || !range) {
        return null;
    }

    return { panel, date, slider, playButton, range };
}

function getStationTimelineDateLabel(index) {
    const rawLabel = stationForecastTimeline[index];
    if (typeof rawLabel !== 'string') {
        return '';
    }

    const dateOnly = rawLabel.split(' ')[0];
    return dateOnly || rawLabel;
}

function clampStationAnimationIndex(index) {
    if (!stationForecastTimeline.length) {
        return 0;
    }
    return Math.max(0, Math.min(stationForecastTimeline.length - 1, index));
}

function setStationAnimationPanelVisible(isVisible) {
    const elements = getStationAnimationElements();
    if (!elements) {
        return;
    }

    elements.panel.classList.toggle('is-visible', isVisible);
}

function setStationAnimationPlayButtonState(isPlaying) {
    const elements = getStationAnimationElements();
    if (!elements) {
        return;
    }

    elements.playButton.textContent = isPlaying ? '\u23F8' : '\u25B6';
    elements.playButton.setAttribute(
        'aria-label',
        isPlaying ? 'Pause station forecast animation' : 'Play station forecast animation'
    );
}

function stopStationAnimationPlayback() {
    if (stationAnimationPlayRafId !== null) {
        cancelAnimationFrame(stationAnimationPlayRafId);
        stationAnimationPlayRafId = null;
    }

    stationAnimationLastFrameTs = 0;

    setStationAnimationPlayButtonState(false);
}

function syncStationAnimationSliderBounds() {
    const elements = getStationAnimationElements();
    if (!elements) {
        return;
    }

    const maxIndex = Math.max(0, stationForecastTimeline.length - 1);
    elements.slider.min = '0';
    elements.slider.max = String(maxIndex);
    elements.slider.step = '0.01';
    elements.slider.value = String(clampStationAnimationIndex(stationAnimationCurrentPosition));
}

function computeStationAnimationValueExtents() {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    Object.values(stationForecastSeries).forEach((series) => {
        if (!Array.isArray(series)) {
            return;
        }

        series.forEach((value) => {
            if (!Number.isFinite(value)) {
                return;
            }
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
        });
    });

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
        stationAnimationMinValue = 0;
        stationAnimationMaxValue = 1;
        return;
    }

    if (maxValue <= minValue) {
        stationAnimationMinValue = minValue;
        stationAnimationMaxValue = minValue + 1;
        return;
    }

    stationAnimationMinValue = minValue;
    stationAnimationMaxValue = maxValue;
}

function extractStationPointNamesFromGeojson(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) {
        return [];
    }

    const seen = new Set();
    const names = [];

    geojson.features.forEach((feature) => {
        const properties = feature && feature.properties ? feature.properties : {};
        const stationName = String(properties.name || properties.Name || '').trim();

        if (!stationName || seen.has(stationName)) {
            return;
        }

        seen.add(stationName);
        names.push(stationName);
    });

    return names;
}

async function ensureStationAnimationMetadataLoaded() {
    if (stationAnimationStationNames.length && Object.keys(stationAnimationHeaderByStationName).length) {
        return;
    }

    if (stationAnimationMetadataLoadPromise) {
        return stationAnimationMetadataLoadPromise;
    }

    stationAnimationMetadataLoadPromise = (async () => {
        await ensureStationForecastDataLoaded();

        const response = await fetch(STATION_POINTS_GEOJSON_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Unable to load station points GeoJSON for animation.');
        }

        const stationGeojson = await response.json();
        stationAnimationStationNames = extractStationPointNamesFromGeojson(stationGeojson);
        stationAnimationHeaderByStationName = {};

        stationAnimationStationNames.forEach((stationName) => {
            const header = resolveStationForecastHeader(stationName);
            if (header) {
                stationAnimationHeaderByStationName[stationName] = header;
            }
        });

        computeStationAnimationValueExtents();
        syncStationAnimationSliderBounds();
    })().finally(() => {
        stationAnimationMetadataLoadPromise = null;
    });

    return stationAnimationMetadataLoadPromise;
}

function getInterpolatedStationSeriesValue(series, position) {
    if (!Array.isArray(series) || !series.length) {
        return null;
    }

    const lowerIndex = Math.max(0, Math.min(series.length - 1, Math.floor(position)));
    const upperIndex = Math.max(0, Math.min(series.length - 1, Math.ceil(position)));
    const interpolationFactor = Math.max(0, Math.min(1, position - lowerIndex));

    const lowerValue = series[lowerIndex];
    const upperValue = series[upperIndex];

    if (Number.isFinite(lowerValue) && Number.isFinite(upperValue)) {
        return lowerValue + ((upperValue - lowerValue) * interpolationFactor);
    }

    if (Number.isFinite(lowerValue)) {
        return lowerValue;
    }

    if (Number.isFinite(upperValue)) {
        return upperValue;
    }

    return null;
}

function buildStationAnimationValueByStationMap(position) {
    const valueByStation = {};

    stationAnimationStationNames.forEach((stationName) => {
        const header = stationAnimationHeaderByStationName[stationName];
        if (!header) {
            return;
        }

        const series = stationForecastSeries[header];
        if (!Array.isArray(series)) {
            return;
        }

        const value = getInterpolatedStationSeriesValue(series, position);
        if (Number.isFinite(value)) {
            valueByStation[stationName] = value;
        }
    });

    return valueByStation;
}

function buildStationValueMatchExpression(valueByStation, fallbackValue) {
    const expression = [
        'match',
        ['to-string', ['coalesce', ['get', 'name'], ['get', 'Name'], '']]
    ];

    Object.keys(valueByStation).forEach((stationName) => {
        expression.push(stationName, valueByStation[stationName]);
    });

    expression.push(fallbackValue);
    return expression;
}

function buildStationAnimationRadiusExpression(valueByStation) {
    const valueExpression = buildStationValueMatchExpression(valueByStation, stationAnimationMinValue);
    const range = stationAnimationMaxValue - stationAnimationMinValue;

    return [
        'interpolate', ['linear'], valueExpression,
        stationAnimationMinValue, 5.8,
        stationAnimationMinValue + (range * 0.45), 9.8,
        stationAnimationMinValue + (range * 0.75), 14.2,
        stationAnimationMaxValue, 18.8
    ];
}

function buildStationAnimationHaloRadiusExpression(valueByStation) {
    const valueExpression = buildStationValueMatchExpression(valueByStation, stationAnimationMinValue);
    const range = stationAnimationMaxValue - stationAnimationMinValue;

    return [
        'interpolate', ['linear'], valueExpression,
        stationAnimationMinValue, 12,
        stationAnimationMinValue + (range * 0.45), 17,
        stationAnimationMinValue + (range * 0.75), 22.5,
        stationAnimationMaxValue, 28
    ];
}

function buildStationAnimationColorExpression(valueByStation) {
    const valueExpression = buildStationValueMatchExpression(valueByStation, stationAnimationMinValue);
    const range = stationAnimationMaxValue - stationAnimationMinValue;

    return [
        'interpolate', ['linear'], valueExpression,
        stationAnimationMinValue, '#00b6ff',
        stationAnimationMinValue + (range * 0.45), '#ffef00',
        stationAnimationMinValue + (range * 0.75), '#ff8c00',
        stationAnimationMaxValue, '#ff1744'
    ];
}

function updateStationAnimationMetadataText(position, valueByStation) {
    const elements = getStationAnimationElements();
    if (!elements) {
        return;
    }

    const frameValues = Object.values(valueByStation).filter((value) => Number.isFinite(value));
    const lowerIndex = clampStationAnimationIndex(Math.floor(position));
    const upperIndex = clampStationAnimationIndex(Math.ceil(position));
    const lowerDateLabel = getStationTimelineDateLabel(lowerIndex);
    const upperDateLabel = getStationTimelineDateLabel(upperIndex);
    const dateLabel = lowerIndex === upperIndex
        ? lowerDateLabel
        : `${lowerDateLabel} to ${upperDateLabel}`;

    elements.date.textContent = `Date: ${dateLabel || '--'}`;

    if (!frameValues.length) {
        elements.range.textContent = 'Values: --';
        return;
    }

    const minValue = Math.min(...frameValues);
    const maxValue = Math.max(...frameValues);
    elements.range.textContent = `Values: ${minValue.toFixed(2)} to ${maxValue.toFixed(2)}`;
}

function applyStationPointAnimationFrame(position) {
    if (!stationForecastTimeline.length) {
        return;
    }

    const clampedPosition = clampStationAnimationIndex(position);
    stationAnimationCurrentPosition = clampedPosition;

    const elements = getStationAnimationElements();
    if (elements) {
        elements.slider.value = String(clampedPosition);
    }

    const valueByStation = buildStationAnimationValueByStationMap(clampedPosition);
    const radiusExpression = buildStationAnimationRadiusExpression(valueByStation);
    const haloRadiusExpression = buildStationAnimationHaloRadiusExpression(valueByStation);
    const colorExpression = buildStationAnimationColorExpression(valueByStation);

    if (map1 && map1.getLayer('station-points-animated-layer')) {
        map1.setPaintProperty('station-points-animated-layer', 'circle-radius', radiusExpression);
        map1.setPaintProperty('station-points-animated-layer', 'circle-color', colorExpression);
    }

    if (map1 && map1.getLayer('station-points-animated-halo-layer')) {
        map1.setPaintProperty('station-points-animated-halo-layer', 'circle-radius', haloRadiusExpression);
        map1.setPaintProperty('station-points-animated-halo-layer', 'circle-color', colorExpression);
    }

    updateStationAnimationMetadataText(clampedPosition, valueByStation);
}

function handleStationAnimationSlider(value) {
    const parsedValue = Number.parseFloat(value);
    if (!Number.isFinite(parsedValue)) {
        return;
    }

    stopStationAnimationPlayback();
    applyStationPointAnimationFrame(parsedValue);
}

function runStationAnimationFrame(timestamp) {
    if (stationAnimationPlayRafId === null || !stationForecastTimeline.length) {
        return;
    }

    if (!stationAnimationLastFrameTs) {
        stationAnimationLastFrameTs = timestamp;
    }

    // Clamp elapsedSeconds to maximum 0.1s to avoid huge animation jumps or browser hangs from inactive tabs
    const elapsedSeconds = Math.min(0.1, Math.max(0, (timestamp - stationAnimationLastFrameTs) / 1000));
    stationAnimationLastFrameTs = timestamp;

    const maxPosition = Math.max(0, stationForecastTimeline.length - 1);
    let nextPosition = stationAnimationCurrentPosition + (elapsedSeconds * STATION_ANIMATION_SPEED_PER_SECOND);

    if (maxPosition > 0) {
        while (nextPosition > maxPosition) {
            nextPosition -= maxPosition;
        }
    } else {
        nextPosition = 0;
    }

    applyStationPointAnimationFrame(nextPosition);
    stationAnimationPlayRafId = requestAnimationFrame(runStationAnimationFrame);
}

// Reset frame timestamp on tab focus/visibility changes to prevent jump skips
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stationAnimationLastFrameTs = 0;
    }
});

function startStationAnimationPlayback() {
    if (stationAnimationPlayRafId !== null || !stationForecastTimeline.length) {
        return;
    }

    setStationAnimationPlayButtonState(true);
    stationAnimationLastFrameTs = 0;
    stationAnimationPlayRafId = requestAnimationFrame(runStationAnimationFrame);
}

function toggleStationAnimationPlay() {
    if (stationAnimationPlayRafId !== null) {
        stopStationAnimationPlayback();
        return;
    }

    startStationAnimationPlayback();
}

async function enableStationPointAnimation() {
    setStationAnimationPanelVisible(true);

    try {
        await ensureStationAnimationMetadataLoaded();
        syncStationAnimationSliderBounds();
        applyStationPointAnimationFrame(stationAnimationCurrentPosition);
        startStationAnimationPlayback();
    } catch (error) {
        const elements = getStationAnimationElements();
        if (elements) {
            elements.date.textContent = 'Date: Unable to load station animation data';
            elements.range.textContent = error && error.message ? error.message : 'Station animation is unavailable.';
        }
        console.error(error);
    }
}

function disableStationPointAnimation() {
    stopStationAnimationPlayback();
    setStationAnimationPanelVisible(false);
}

function reapplyStationPointAnimationFrame() {
    if (!isLayerVisible('station-points-animated-layer')) {
        return;
    }
    applyStationPointAnimationFrame(stationAnimationCurrentPosition);
}

window.handleStationAnimationSlider = handleStationAnimationSlider;
window.toggleStationAnimationPlay = toggleStationAnimationPlay;
window.enableStationPointAnimation = enableStationPointAnimation;
window.disableStationPointAnimation = disableStationPointAnimation;
window.reapplyStationPointAnimationFrame = reapplyStationPointAnimationFrame;

function getStationForecastElements() {
    const widget = document.getElementById('station-forecast-widget');
    const title = document.getElementById('station-forecast-title');
    const subtitle = document.getElementById('station-forecast-subtitle');
    const canvas = document.getElementById('stationForecastChart');

    if (!widget || !title || !subtitle || !canvas) {
        return null;
    }

    return { widget, title, subtitle, canvas };
}

function ensureStationForecastChart() {
    if (stationForecastChart) {
        return stationForecastChart;
    }

    const elements = getStationForecastElements();
    if (!elements) {
        return null;
    }

    const context = elements.canvas.getContext('2d');
    if (!context) {
        return null;
    }

    stationForecastChart = new Chart(context, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Station Forecast',
                    data: [],
                    borderColor: '#38bdf8',
                    borderWidth: 2.4,
                    backgroundColor: (chartContext) => {
                        const chart = chartContext.chart;
                        const chartArea = chart.chartArea;

                        if (!chartArea) {
                            return 'rgba(56, 189, 248, 0.22)';
                        }

                        const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.40)');
                        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.04)');

                        return gradient;
                    },
                    fill: true,
                    tension: 0.34,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHitRadius: 12,
                    pointBackgroundColor: '#f8fafc',
                    pointBorderColor: '#1d4ed8',
                    pointBorderWidth: 1.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 900,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(13, 27, 42, 0.95)',
                    borderColor: '#1d4ed8',
                    borderWidth: 1,
                    titleColor: '#dbeafe',
                    bodyColor: '#e2e8f0',
                    padding: 10,
                    callbacks: {
                        label: (tooltipItem) => {
                            const value = tooltipItem.parsed.y;
                            return `Value: ${Number(value).toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.15)'
                    },
                    ticks: {
                        color: '#bfdbfe',
                        autoSkip: true,
                        maxTicksLimit: 8,
                        maxRotation: 0,
                        callback: function (value) {
                            const rawLabel = this.getLabelForValue(value);
                            if (typeof rawLabel !== 'string') {
                                return rawLabel;
                            }
                            return rawLabel.split(' ')[0];
                        },
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.15)'
                    },
                    ticks: {
                        color: '#bfdbfe',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });

    return stationForecastChart;
}

function openStationForecastWidget() {
    const elements = getStationForecastElements();
    if (!elements) {
        return;
    }

    elements.widget.classList.add('is-visible');

    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.classList.add('station-forecast-active');
    }

    if (typeof window.renderRiskZonationLegend === 'function') {
        window.renderRiskZonationLegend();
    }
}

function closeStationForecastWidget() {
    const elements = getStationForecastElements();
    if (!elements) {
        return;
    }

    elements.widget.classList.remove('is-visible');

    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.classList.remove('station-forecast-active');
    }

    if (typeof window.renderRiskZonationLegend === 'function') {
        window.renderRiskZonationLegend();
    }
}

function renderStationForecastUnavailable(stationName, message) {
    const elements = getStationForecastElements();
    if (!elements) {
        return;
    }

    elements.title.textContent = `${stationName} Forecast`;
    elements.subtitle.textContent = message;

    const chart = ensureStationForecastChart();
    if (chart) {
        chart.data.labels = [];
        chart.data.datasets[0].label = 'Station Forecast';
        chart.data.datasets[0].data = [];
        chart.update();
    }

    openStationForecastWidget();
}

function renderStationForecastSeries(stationName, matchedHeader, values) {
    const elements = getStationForecastElements();
    const chart = ensureStationForecastChart();

    if (!elements || !chart) {
        return;
    }

    const firstDate = stationForecastTimeline.length ? stationForecastTimeline[0].split(' ')[0] : '';
    const lastDate = stationForecastTimeline.length ? stationForecastTimeline[stationForecastTimeline.length - 1].split(' ')[0] : '';

    elements.title.textContent = `${stationName} Forecast`;
    elements.subtitle.textContent = `${matchedHeader} | ${values.length} values | ${firstDate} to ${lastDate}`;

    chart.data.labels = stationForecastTimeline;
    chart.data.datasets[0].label = `${matchedHeader} Forecast`;
    chart.data.datasets[0].data = values;
    chart.update();

    openStationForecastWidget();
}

async function handleStationPointSelection(stationName) {
    const displayName = String(stationName || 'Station').trim();

    try {
        await ensureStationForecastDataLoaded();
    } catch (error) {
        renderStationForecastUnavailable(displayName, error.message || 'Unable to load station forecast data.');
        return;
    }

    const matchedHeader = resolveStationForecastHeader(displayName);
    if (!matchedHeader) {
        renderStationForecastUnavailable(displayName, 'No matching station column found in station forecast data.');
        return;
    }

    const values = stationForecastSeries[matchedHeader];
    if (!Array.isArray(values) || !values.length) {
        renderStationForecastUnavailable(displayName, 'No forecast values found for this station.');
        return;
    }

    renderStationForecastSeries(displayName, matchedHeader, values);
}

window.handleStationPointSelection = handleStationPointSelection;
window.closeStationForecastWidget = closeStationForecastWidget;

function toggleUlterRiskZonation(isChecked) {
    const ulterRiskLayers = [
        'ulter-risk-high-layer',
        'ulter-risk-medium-layer',
        'ulter-risk-low-layer'
    ];

    const availableLayers = ulterRiskLayers.filter((layerId) => map1 && map1.getLayer(layerId));

    if (!availableLayers.length) {
        const ulterToggle = document.getElementById('ulter-rz-toggle');
        if (ulterToggle) {
            ulterToggle.checked = false;
        }
        console.warn('Ulter Risk Zonation layers are not added yet. Add data source/layers after URL is available.');
        return;
    }

    availableLayers.forEach((layerId) => setLayerVisibility(layerId, isChecked));
}

function toggleAlertsArchive(isChecked) {
    if (isChecked) {
        openPanelModal('alertsArchive');
        return;
    }

    const modal = document.getElementById('panelModal');
    if (modal && modal.dataset.activePanel === 'alertsArchive') {
        closePanelModal();
    }
}

let alertsArchiveImageItems = [];
let alertsArchiveViewerIndex = -1;

function updateAlertsArchiveViewer() {
    if (!alertsArchiveImageItems.length || alertsArchiveViewerIndex < 0) {
        return;
    }

    const imageEl = document.getElementById('alerts-archive-viewer-image');
    const captionEl = document.getElementById('alerts-archive-viewer-caption');
    const counterEl = document.getElementById('alerts-archive-viewer-count');
    const current = alertsArchiveImageItems[alertsArchiveViewerIndex];

    if (!imageEl || !captionEl || !counterEl || !current) {
        return;
    }

    imageEl.src = current.href;
    imageEl.alt = current.fileName;
    captionEl.textContent = current.fileName;
    counterEl.textContent = `${alertsArchiveViewerIndex + 1} / ${alertsArchiveImageItems.length}`;
}

function openAlertsArchiveViewer(index) {
    if (!alertsArchiveImageItems.length) {
        return;
    }

    const viewer = document.getElementById('alerts-archive-viewer');
    if (!viewer) {
        return;
    }

    const length = alertsArchiveImageItems.length;
    alertsArchiveViewerIndex = ((index % length) + length) % length;
    updateAlertsArchiveViewer();
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
}

function stepAlertsArchiveViewer(step) {
    if (!alertsArchiveImageItems.length) {
        return;
    }

    alertsArchiveViewerIndex = (alertsArchiveViewerIndex + step + alertsArchiveImageItems.length) % alertsArchiveImageItems.length;
    updateAlertsArchiveViewer();
}

function closeAlertsArchiveViewer() {
    const viewer = document.getElementById('alerts-archive-viewer');
    if (!viewer) {
        return;
    }

    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    alertsArchiveViewerIndex = -1;
}

function handleAlertsArchiveViewerBackdrop(event) {
    if (event.target && event.target.id === 'alerts-archive-viewer') {
        closeAlertsArchiveViewer();
    }
}

async function renderAlertsArchive() {
    const modal = document.getElementById('panelModal');
    const body = document.getElementById('panelModalBody');
    if (!modal || !body || modal.dataset.activePanel !== 'alertsArchive') {
        return;
    }

    const alertsFolderPath = 'Alerts/';
    const imageExtRegex = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

    try {
        const response = await fetch(alertsFolderPath, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Unable to access Alerts folder listing');
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const images = Array.from(doc.querySelectorAll('a[href]'))
            .map((anchor) => anchor.getAttribute('href'))
            .filter(Boolean)
            .map((href) => {
                try {
                    return new URL(href, new URL(alertsFolderPath, window.location.href));
                } catch (_error) {
                    return null;
                }
            })
            .filter((url) => url && /\/alerts\//i.test(url.pathname) && imageExtRegex.test(url.pathname));

        const uniqueImages = images.filter((url, idx, arr) =>
            arr.findIndex((other) => other.pathname === url.pathname) === idx
        );

        alertsArchiveImageItems = uniqueImages.map((url) => ({
            href: url.href,
            fileName: decodeURIComponent(url.pathname.split('/').pop() || 'Alert Image')
        }));
        alertsArchiveViewerIndex = -1;

        if (!alertsArchiveImageItems.length) {
            body.innerHTML = `
                <div class="alerts-archive-empty">
                    <i class="fas fa-folder-open"></i>
                    <h4>No Alerts Found</h4>
                    <p>Add images to the Alerts folder and reopen Alerts Archive.</p>
                </div>
            `;
            return;
        }

        const cardsHtml = alertsArchiveImageItems.map((item, index) => {
            return `
                <figure class="alerts-archive-card">
                    <button type="button" class="alerts-archive-thumb-btn" onclick="openAlertsArchiveViewer(${index})" aria-label="Open alert image">
                        <img src="${item.href}" alt="${item.fileName}" loading="lazy">
                    </button>
                    <figcaption>${item.fileName}</figcaption>
                </figure>
            `;
        }).join('');

        body.innerHTML = `
            <div class="alerts-archive-wrap">
                <div class="alerts-archive-head">
                    <span><i class="fas fa-images"></i> Alerts Gallery</span>
                    <strong>${alertsArchiveImageItems.length} Image${alertsArchiveImageItems.length === 1 ? '' : 's'}</strong>
                </div>
                <div class="alerts-archive-grid">${cardsHtml}</div>

                <div id="alerts-archive-viewer" class="alerts-archive-viewer" aria-hidden="true" onclick="handleAlertsArchiveViewerBackdrop(event)">
                    <button type="button" class="alerts-archive-nav alerts-archive-nav-prev" onclick="stepAlertsArchiveViewer(-1)" aria-label="Previous alert image">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="alerts-archive-viewer-stage">
                        <button type="button" class="alerts-archive-viewer-close" onclick="closeAlertsArchiveViewer()" aria-label="Close full image">&times;</button>
                        <img id="alerts-archive-viewer-image" src="" alt="Full alert image">
                        <div class="alerts-archive-viewer-meta">
                            <span id="alerts-archive-viewer-caption"></span>
                            <strong id="alerts-archive-viewer-count"></strong>
                        </div>
                    </div>
                    <button type="button" class="alerts-archive-nav alerts-archive-nav-next" onclick="stepAlertsArchiveViewer(1)" aria-label="Next alert image">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        alertsArchiveImageItems = [];
        alertsArchiveViewerIndex = -1;
        body.innerHTML = `
            <div class="alerts-archive-empty">
                <i class="fas fa-triangle-exclamation"></i>
                <h4>Unable to Load Alerts Archive</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function hideHighTempWarningPanel() {
    const warningPanel = document.getElementById('top_video_warning_chart');
    if (warningPanel) {
        warningPanel.style.display = 'none';
    }
}

let highTempWarningPopup = null;

function showHighTempWarningPopup() {
    const warningCoordinates = [75.33670798647735, 35.86669398878782];

    if (highTempWarningPopup) {
        highTempWarningPopup.remove();
        highTempWarningPopup = null;
    }

    const popupHTML = `
        <div class="incident-video-container">
            <button class="popup-close-btn" onclick="closeHighTempWarningPopup()">&times;</button>
            <video controls autoplay muted loop style="width: 300px; height: 200px; border-radius: 8px; border: 3px solid #ff0037; display: block;">
                <source src="data/arando.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="incident-info" style="text-align: center; margin-top: 8px; font-size: 14px; color: white;">
                <strong>Latest Imagery, March 2026</strong>
            </div>
        </div>
    `;

    highTempWarningPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: [0, -18],
        className: 'incident-video-popup-mapbox'
    })
    .setLngLat(warningCoordinates)
    .setHTML(popupHTML)
    .addTo(map1);
}

function closeHighTempWarningPopup() {
    if (highTempWarningPopup) {
        highTempWarningPopup.remove();
        highTempWarningPopup = null;
    }
}

function showHighTempWarning(forceVisible = null) {
    const topVideo = document.getElementById('top_video');
    const warningPanel = document.getElementById('top_video_warning_chart');
    const warningLayerId = 'high-temp-warning-area';
    const currentVisible = isLayerVisible(warningLayerId);
    const shouldShow = typeof forceVisible === 'boolean' ? forceVisible : !currentVisible;

    if (shouldShow) {
        if (topVideo) {
            topVideo.pause();
            topVideo.style.display = 'none';
        }

        if (warningPanel) {
            warningPanel.style.display = 'block';
        }

        if (map1.getLayer(warningLayerId)) {
            map1.setLayoutProperty(warningLayerId, 'visibility', 'visible');
        }

        showHighTempWarningPopup();

        map1.flyTo({
            center: [75.33, 35.86],
            zoom: 10,
            essential: true
        });
    } else {
        if (map1.getLayer(warningLayerId)) {
            map1.setLayoutProperty(warningLayerId, 'visibility', 'none');
        }

        closeHighTempWarningPopup();
        hideHighTempWarningPanel();

        if (topVideo) {
            topVideo.style.display = 'block';
            topVideo.play().catch(() => {});
        }
    }

    const highTempToggle = document.getElementById('quick-high-temp-2026-toggle');
    if (highTempToggle) {
        highTempToggle.checked = shouldShow;
    }
}

document.getElementById("menuToggle").addEventListener("click", function() {
    var menu = document.getElementById("menu");
    
    if (menu.style.display === "none" || menu.style.display === "") {
      menu.style.display = "block"; // Show menu
    } else {
      menu.style.display = "none"; // Hide menu
    }
  });

let layerTourTimer = null;
let layerTourStops = [];
let layerTourCurrentIndex = 0;
let layerTourRunning = false;
const layerTourGeojsonCache = {};
let layerTourSpeedLevel = 3;

const layerTourSpeedProfiles = {
    1: { label: 'Slow', intervalMs: 4800 },
    2: { label: 'Easy', intervalMs: 3900 },
    3: { label: 'Normal', intervalMs: 3200 },
    4: { label: 'Fast', intervalMs: 2500 },
    5: { label: 'Max', intervalMs: 1800 }
};

function getLayerTourElements() {
    return {
        select: document.getElementById('layer-tour-select'),
        button: document.getElementById('layer-tour-btn'),
        status: document.getElementById('layer-tour-status')
    };
}

function setLayerTourStatus(text) {
    const { status } = getLayerTourElements();
    if (status) {
        status.textContent = text;
    }
}

function getLayerTourIntervalMs() {
    const profile = layerTourSpeedProfiles[layerTourSpeedLevel] || layerTourSpeedProfiles[3];
    return profile.intervalMs;
}

function restartLayerTourTimer() {
    if (!layerTourRunning || !layerTourStops.length) {
        return;
    }

    if (layerTourTimer) {
        clearInterval(layerTourTimer);
        layerTourTimer = null;
    }

    layerTourTimer = setInterval(() => {
        layerTourCurrentIndex = (layerTourCurrentIndex + 1) % layerTourStops.length;
        flyToLayerTourStop(layerTourCurrentIndex);
    }, getLayerTourIntervalMs());
}

function isLikelyCustomLayer(layer) {
    if (!layer || !layer.source) {
        return false;
    }
    const sourceId = String(layer.source);
    return sourceId !== 'composite' && !sourceId.toLowerCase().includes('mapbox');
}

function parseLayerIdsFromToggleInput(inputElement) {
    const ids = [];
    if (!inputElement) {
        return ids;
    }

    const directLayerId = inputElement.dataset ? inputElement.dataset.layer : '';
    if (directLayerId) {
        ids.push(directLayerId);
    }

    const onClick = inputElement.getAttribute('onclick') || '';
    const listMatch = onClick.match(/\[([^\]]+)\]/);
    if (!listMatch || !listMatch[1]) {
        return ids;
    }

    listMatch[1]
        .split(',')
        .map((value) => value.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
        .forEach((layerId) => ids.push(layerId));

    return ids;
}

function getCheckedToggleLayerIds() {
    const checkedInputs = Array.from(document.querySelectorAll('#menu input[type="checkbox"]:checked'));
    const unique = new Set();
    checkedInputs.forEach((input) => {
        parseLayerIdsFromToggleInput(input).forEach((layerId) => unique.add(layerId));
    });
    return Array.from(unique);
}

function getLayerFriendlyName(layerId) {
    const candidates = Array.from(document.querySelectorAll('#menu input[type="checkbox"]'));
    for (const input of candidates) {
        const linkedIds = parseLayerIdsFromToggleInput(input);
        if (!linkedIds.includes(layerId)) {
            continue;
        }

        const row = input.closest('.toggle-row');
        const labelSpan = row ? row.querySelector('.toggle-label') : null;
        if (labelSpan && labelSpan.textContent) {
            return labelSpan.textContent.trim();
        }
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label && label.textContent) {
            return label.textContent.trim();
        }
    }
    return layerId;
}

function refreshLayerTourOptions() {
    const { select } = getLayerTourElements();
    if (!select || !map1 || !map1.getStyle()) {
        return;
    }

    const selectedValue = select.value;
    const checkedLayerIds = getCheckedToggleLayerIds();
    const styleLayers = map1.getStyle().layers || [];
    const visibleLayerIds = styleLayers
        .filter((layer) => {
            if (!isLikelyCustomLayer(layer)) {
                return false;
            }
            return map1.getLayoutProperty(layer.id, 'visibility') === 'visible';
        })
        .map((layer) => layer.id);

    const candidateIds = Array.from(new Set([...checkedLayerIds, ...visibleLayerIds]))
        .filter((layerId) => map1.getLayer(layerId))
        .filter((layerId) => {
            const layer = map1.getLayer(layerId);
            return ['circle', 'symbol', 'line', 'fill'].includes(layer.type);
        });

    select.innerHTML = '<option value="">Select opened layer</option>';
    candidateIds.forEach((layerId) => {
        const option = document.createElement('option');
        option.value = layerId;
        option.textContent = getLayerFriendlyName(layerId);
        select.appendChild(option);
    });

    if (selectedValue && candidateIds.includes(selectedValue)) {
        select.value = selectedValue;
    }
}

function flattenCoordinates(coords, collector) {
    if (!Array.isArray(coords)) {
        return;
    }

    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        collector.push([coords[0], coords[1]]);
        return;
    }

    coords.forEach((child) => flattenCoordinates(child, collector));
}

function getRepresentativeCoordinatesFromGeometry(geometry) {
    if (!geometry || !geometry.type) {
        return null;
    }

    if (geometry.type === 'Point') {
        return geometry.coordinates;
    }

    if (geometry.type === 'MultiPoint') {
        return Array.isArray(geometry.coordinates) && geometry.coordinates.length
            ? geometry.coordinates[0]
            : null;
    }

    const allPoints = [];
    flattenCoordinates(geometry.coordinates, allPoints);
    if (!allPoints.length) {
        return null;
    }

    if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        return allPoints[Math.floor(allPoints.length / 2)];
    }

    let minLng = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLng = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;

    allPoints.forEach((point) => {
        minLng = Math.min(minLng, point[0]);
        maxLng = Math.max(maxLng, point[0]);
        minLat = Math.min(minLat, point[1]);
        maxLat = Math.max(maxLat, point[1]);
    });

    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

async function getGeojsonFeaturesFromSource(sourceId) {
    if (!map1 || !sourceId) {
        return [];
    }

    const style = map1.getStyle && map1.getStyle();
    const sourceDef = style && style.sources ? style.sources[sourceId] : null;
    if (!sourceDef || sourceDef.type !== 'geojson') {
        return [];
    }

    if (sourceDef.data && typeof sourceDef.data === 'object' && Array.isArray(sourceDef.data.features)) {
        return sourceDef.data.features;
    }

    if (typeof sourceDef.data === 'string') {
        const sourceUrl = sourceDef.data;
        if (Array.isArray(layerTourGeojsonCache[sourceUrl])) {
            return layerTourGeojsonCache[sourceUrl];
        }

        const response = await fetch(sourceUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Unable to load layer source: ${sourceId}`);
        }

        const geojson = await response.json();
        const features = Array.isArray(geojson && geojson.features) ? geojson.features : [];
        layerTourGeojsonCache[sourceUrl] = features;
        return features;
    }

    return [];
}

async function getLayerTourStops(layerId) {
    if (!map1 || !map1.getLayer(layerId)) {
        return [];
    }

    const layer = map1.getLayer(layerId);
    const sourceFeatures = await getGeojsonFeaturesFromSource(layer.source);
    let features = [];

    if (sourceFeatures.length) {
        features = sourceFeatures;
    } else {
        try {
            const queryOptions = {};
            if (layer['source-layer']) {
                queryOptions.sourceLayer = layer['source-layer'];
            }
            features = map1.querySourceFeatures(layer.source, queryOptions) || [];
        } catch (_error) {
            features = [];
        }
    }

    if (!features.length) {
        features = map1.queryRenderedFeatures({ layers: [layerId] }) || [];
    }

    const stops = [];
    const layerType = layer.type;
    const targetZoom = layerType === 'fill' ? 10.8 : (layerType === 'line' ? 11.3 : 12.5);
    const seenNonPoint = new Set();

    features.forEach((feature, index) => {
        const coordinates = getRepresentativeCoordinatesFromGeometry(feature.geometry);
        if (!coordinates) {
            return;
        }

        if (layerType !== 'symbol' && layerType !== 'circle') {
            const key = `${coordinates[0].toFixed(6)}|${coordinates[1].toFixed(6)}`;
            if (seenNonPoint.has(key)) {
                return;
            }
            seenNonPoint.add(key);
        }

        stops.push({
            center: coordinates,
            zoom: targetZoom,
            index
        });
    });

    return stops;
}

function flyToLayerTourStop(index) {
    if (!layerTourRunning || !layerTourStops.length) {
        return;
    }

    const boundedIndex = ((index % layerTourStops.length) + layerTourStops.length) % layerTourStops.length;
    layerTourCurrentIndex = boundedIndex;
    const stop = layerTourStops[boundedIndex];

    map1.flyTo({
        center: stop.center,
        zoom: stop.zoom,
        speed: 0.7,
        curve: 1.25,
        essential: true
    });

    setLayerTourStatus(`Stop ${boundedIndex + 1} / ${layerTourStops.length}`);
}

function stopLayerTourIfRunning() {
    if (layerTourTimer) {
        clearInterval(layerTourTimer);
        layerTourTimer = null;
    }

    layerTourRunning = false;
    layerTourStops = [];
    layerTourCurrentIndex = 0;

    const { button } = getLayerTourElements();
    if (button) {
        button.textContent = 'Start Tour';
    }

    setLayerTourStatus('Idle');
}

function updateLayerTourSpeed(value) {
    const numericValue = Number.parseInt(value, 10);
    if (!Number.isFinite(numericValue) || !layerTourSpeedProfiles[numericValue]) {
        return;
    }

    layerTourSpeedLevel = numericValue;
    const profile = layerTourSpeedProfiles[layerTourSpeedLevel];
    const speedValueEl = document.getElementById('layer-tour-speed-value');
    if (speedValueEl) {
        speedValueEl.textContent = profile.label;
    }

    if (layerTourRunning) {
        restartLayerTourTimer();
    }
}

async function toggleLayerTour() {
    if (!map1) {
        return;
    }

    if (layerTourRunning) {
        stopLayerTourIfRunning();
        return;
    }

    refreshLayerTourOptions();
    const { select, button } = getLayerTourElements();
    if (!select) {
        return;
    }

    const selectedLayerId = select.value;
    if (!selectedLayerId) {
        setLayerTourStatus('Select a layer first');
        return;
    }

    setLayerTourStatus('Loading points...');
    let stops = [];
    try {
        stops = await getLayerTourStops(selectedLayerId);
    } catch (error) {
        setLayerTourStatus((error && error.message) ? error.message : 'Unable to read layer source');
        return;
    }

    if (!stops.length) {
        setLayerTourStatus('No features found in selected layer');
        return;
    }

    layerTourStops = stops;
    layerTourCurrentIndex = 0;
    layerTourRunning = true;
    if (button) {
        button.textContent = 'Stop Tour';
    }

    flyToLayerTourStop(layerTourCurrentIndex);

    restartLayerTourTimer();
}

window.refreshLayerTourOptions = refreshLayerTourOptions;
window.toggleLayerTour = toggleLayerTour;
window.stopLayerTourIfRunning = stopLayerTourIfRunning;
window.updateLayerTourSpeed = updateLayerTourSpeed;

document.addEventListener('change', function (event) {
    const target = event.target;
    if (target && target.matches && target.matches('#menu input[type="checkbox"]')) {
        setTimeout(refreshLayerTourOptions, 0);
    }
});

function openPanelModal(panelType) {
    const modal = document.getElementById('panelModal');
    const title = document.getElementById('panelModalTitle');
    const body = document.getElementById('panelModalBody');
    const alertsArchiveToggle = document.getElementById('alerts-archive-toggle');

    if (!modal || !title || !body) {
        return;
    }

    modal.dataset.activePanel = panelType;
    body.classList.remove('alerts-archive-mode');
    if (alertsArchiveToggle) {
        alertsArchiveToggle.checked = panelType === 'alertsArchive';
    }

    if (panelType === 'controlChart') {
        title.textContent = 'Control Chart';
        body.innerHTML = '<iframe src="https://flo.uri.sh/visualisation/27852382/embed" frameborder="0" allowfullscreen scrolling="no" title="Control Chart"></iframe>';
    } else if (panelType === 'top_video_warning_chart') {
        title.textContent = 'High Temp Warning';
        body.innerHTML = '<iframe src="https://flo.uri.sh/visualisation/28273388/embed#theme=dark" frameborder="0" allowfullscreen scrolling="no" title="High Temp Warning"></iframe>';
    } else if (panelType === 'alertsArchive') {
        title.textContent = 'Alerts Archive';
        body.classList.add('alerts-archive-mode');
        body.innerHTML = '<div class="alerts-archive-loading"><i class="fas fa-spinner fa-spin"></i> Loading alerts archive...</div>';
        renderAlertsArchive();
    } else if (panelType === 'glaciersDataContainer') {
        title.textContent = 'Glaciers Data';
        body.innerHTML = '<img src="data/basemap-icons/Glaciers_data.png" alt="Glaciers Data">';
    } else if (panelType === 'lakeMapPreview') {
        const previewImg = document.getElementById('lake-map-preview-img');
        const previewCaption = document.getElementById('lake-map-preview-caption');
        const previewSrc = previewImg ? previewImg.getAttribute('src') : '';

        if (!previewSrc) {
            return;
        }

        const previewTitle = (previewCaption && previewCaption.textContent) ? previewCaption.textContent : 'Map Preview';
        title.textContent = `${previewTitle} Map`;
        body.innerHTML = `<img src="${previewSrc}" alt="${previewTitle} map">`;
    } else if (panelType === 'lakeTempChart') {
        title.textContent = `${window.currentActiveLakeName || 'Lake'} Temperature Trend`;
        body.innerHTML = `
            <div style="width: 100%; height: 100%; padding: 24px; box-sizing: border-box; background: rgba(3, 8, 18, 0.6); display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="width: 100%; flex: 1; min-height: 0; position: relative;">
                    <canvas id="lakeTempChartModalCanvas" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        `;
        setTimeout(() => {
            renderLakeTempChartInModal();
        }, 120);
    } else if (panelType === 'lakeAreaVideo') {
        const videoSrc = getLakeVideoPath(currentActiveLakeCollapseId);
        title.textContent = `${window.currentActiveLakeName || 'Lake'} Area Change Video`;
        body.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 8px; overflow: hidden; position: relative;">
                <video id="lakeAreaVideoModalPlayer" controls autoplay loop muted style="max-width: 100%; max-height: 100%; object-fit: contain;"></video>
            </div>
        `;
        const modalPlayer = document.getElementById('lakeAreaVideoModalPlayer');
        if (modalPlayer) {
            modalPlayer.src = videoSrc;
            modalPlayer.onerror = function() {
                body.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #94a3b8; height: 100%;">
                        <i class="fas fa-video-slash" style="font-size: 48px; color: #3b82f6;"></i>
                        <span style="font-size: 18px; font-weight: 600;">Video coming soon for this lake</span>
                    </div>
                `;
            };
        }
    } else {
        return;
    }

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closePanelModal() {
    const modal = document.getElementById('panelModal');
    const body = document.getElementById('panelModalBody');
    const alertsArchiveToggle = document.getElementById('alerts-archive-toggle');

    if (!modal || !body) {
        return;
    }

    const activePanel = modal.dataset.activePanel;

    modal.classList.remove('is-open');
    closeAlertsArchiveViewer();
    body.classList.remove('alerts-archive-mode');
    body.innerHTML = '';
    document.body.style.overflow = '';
    modal.dataset.activePanel = '';
    alertsArchiveImageItems = [];
    alertsArchiveViewerIndex = -1;

    if (activePanel === 'alertsArchive' && alertsArchiveToggle) {
        alertsArchiveToggle.checked = false;
    }
}

function handlePanelModalBackdrop(event) {
    if (event.target && event.target.id === 'panelModal') {
        closePanelModal();
    }
}

document.addEventListener('keydown', function (event) {
    const modal = document.getElementById('panelModal');
    const viewer = document.getElementById('alerts-archive-viewer');
    const alertsViewerOpen = !!(modal && modal.classList.contains('is-open') && modal.dataset.activePanel === 'alertsArchive' && viewer && viewer.classList.contains('is-open'));

    if (alertsViewerOpen && event.key === 'ArrowLeft') {
        event.preventDefault();
        stepAlertsArchiveViewer(-1);
        return;
    }

    if (alertsViewerOpen && event.key === 'ArrowRight') {
        event.preventDefault();
        stepAlertsArchiveViewer(1);
        return;
    }

    if (event.key === 'Escape') {
        if (alertsViewerOpen) {
            event.preventDefault();
            closeAlertsArchiveViewer();
            return;
        }
        closePanelModal();
    }
});

const DEFAULT_TOP_VIDEO = 'data/badswat1.mp4';
const DEFAULT_BOTTOM_VIDEO = 'data/badswat2.mp4';

const accordionVideoStates = {
    'badswat-collapse': {
        topVideo: DEFAULT_TOP_VIDEO,
        bottomVideo: 'data/36Sites.mp4'
    },
    'pindoru-collapse': {
        topVideo: 'data/Pindoru_Chaat.mp4',
        bottomVideo: DEFAULT_BOTTOM_VIDEO
    },
    'thalu-collapse': {
        topVideo: 'data/thalu2.mp4',
        bottomVideo: 'data/thalu.mp4'
    },
    'darkot-collapse': {
        topVideo: 'data/darkut_lake.mp4',
        hideBottom: true
    }
};

const accordionVideoStack = [];

const accordionMapImageStates = {
    'pindoru-collapse': {
        src: 'Maps/Pindoru chaat.jpg',
        title: 'Pindoru Chaat'
    },
    'chatiboi-collapse': {
        src: 'Maps/Chatboi lake.jpg',
        title: 'Chatboi Lake'
    },
    'ishokoman-collapse': {
        src: 'Maps/Ishkoman.jpg',
        title: 'Ishkoman'
    },
    'lusht-collapse': {
        src: 'Maps/Lusht.jpg',
        title: 'Lusht'
    },
    'ulter-collapse': {
        src: 'Maps/Ulter.jpg',
        title: 'Ulter'
    },
    'badswat-collapse': {
        src: 'Maps/Badswat.jpg',
        title: 'Badswat'
    },
    'darkot-collapse': {
        src: 'Maps/Darkut.jpg',
        title: 'Darkut'
    },
    'gulmit-collapse': {
        src: 'Maps/Gulmit.jpg',
        title: 'Gulmit'
    },
    'hiranchi-collapse': {
        src: 'Maps/Hinarchi.jpg',
        title: 'Hinarchi'
    },
    'reshun-collapse': {
        src: 'Maps/Reshun.jpg',
        title: 'Reshun'
    },
    'terset-hundur-collapse': {
        src: 'Maps/Tersat Hundur.jpg',
        title: 'Tersat Hundur'
    },
    'shisper-collapse': {
        src: 'Maps/Shishper.jpg',
        title: 'Shisper'
    }
};

const accordionMapImageStack = [];

const accordionChartLakeMap = {
    'badswat-collapse': 'Badswat',
    'pindoru-collapse': 'Pindoru Chaat',
    'reshun-collapse': 'Reshun',
    'thalu-collapse': 'Thalo 1',
    'darkot-collapse': 'Darkut',
    'chatiboi-collapse': 'Chatiboi',
    'brep-collapse': 'Brep',
    'ishokoman-collapse': 'Ishkoman',
    'lusht-collapse': 'Lasht',
    'ulter-collapse': 'Ultar',
    'terset-hundur-collapse': 'Tersat Hundur',
    'shisper-collapse': 'Shisper'
};

function syncChartsForAccordion(accordionId) {
    const lakeName = accordionChartLakeMap[accordionId];
    if (!lakeName) {
        return;
    }

    const areaSelect = document.getElementById('lake-select');
    if (areaSelect) {
        areaSelect.value = lakeName;
        if (typeof updateLakeChart === 'function') {
            updateLakeChart();
        }
    }

    const volumeSelect = document.getElementById('vol-lake-select');
    if (volumeSelect) {
        volumeSelect.value = lakeName;
        if (typeof updateVolumeChart === 'function') {
            updateVolumeChart();
        }
    }
}

function registerAccordionChartHandlers() {
    const menuAccordion = document.getElementById('menu-accordion');
    if (!menuAccordion) {
        return;
    }

    menuAccordion.addEventListener('show.bs.collapse', function (event) {
        const collapseId = event && event.target ? event.target.id : null;
        if (!collapseId) {
            return;
        }
        syncChartsForAccordion(collapseId);
    });
}

function setLakeMapPreview(state) {
    const preview = document.getElementById('lake-map-preview');
    const previewImg = document.getElementById('lake-map-preview-img');
    const previewCaption = document.getElementById('lake-map-preview-caption');

    if (!preview || !previewImg || !previewCaption) {
        return;
    }

    if (!state) {
        preview.style.display = 'none';
        previewImg.removeAttribute('src');
        previewCaption.textContent = 'Map Preview';
        if (typeof updateActiveLegendOffset === 'function') {
            updateActiveLegendOffset();
        }
        return;
    }

    previewImg.src = state.src;
    previewCaption.textContent = state.title;
    preview.style.display = 'block';
    if (typeof updateActiveLegendOffset === 'function') {
        updateActiveLegendOffset();
    }
}

function initLakeMapPreviewAspectObserver() {
    const preview = document.getElementById('lake-map-preview');
    const previewImg = document.getElementById('lake-map-preview-img');
    if (!preview || !previewImg) return;

    function adjustAspect() {
        if (previewImg.naturalWidth && previewImg.naturalHeight) {
            preview.style.aspectRatio = `${previewImg.naturalWidth} / ${previewImg.naturalHeight}`;
        }
    }

    previewImg.addEventListener('load', adjustAspect);
    
    if (previewImg.complete) {
        adjustAspect();
    }
}

function syncAccordionMapPreview() {
    const activeAccordionId = accordionMapImageStack[accordionMapImageStack.length - 1];
    
    const stateMap = activeAccordionId ? accordionMapImageStates[activeAccordionId] : null;
    setLakeMapPreview(stateMap || null);
}

function registerAccordionMapPreviewHandlers() {
    const menuAccordion = document.getElementById('menu-accordion');
    if (menuAccordion) {
        menuAccordion.addEventListener('show.bs.collapse', function (event) {
            const collapseId = event && event.target ? event.target.id : null;
            if (!collapseId || accordionMapImageStates[collapseId]) {
                return;
            }
            accordionMapImageStack.length = 0;
            setLakeMapPreview(null);
        });
    }

    const allAccordionIds = new Set([
        ...Object.keys(accordionMapImageStates)
    ]);

    allAccordionIds.forEach((accordionId) => {
        const collapseElement = document.getElementById(accordionId);

        if (!collapseElement) {
            return;
        }

        collapseElement.addEventListener('show.bs.collapse', function () {
            const existingIndex = accordionMapImageStack.indexOf(accordionId);
            if (existingIndex !== -1) {
                accordionMapImageStack.splice(existingIndex, 1);
            }
            accordionMapImageStack.push(accordionId);
            syncAccordionMapPreview();
        });

        collapseElement.addEventListener('hide.bs.collapse', function () {
            const existingIndex = accordionMapImageStack.indexOf(accordionId);
            if (existingIndex !== -1) {
                accordionMapImageStack.splice(existingIndex, 1);
            }
            syncAccordionMapPreview();
        });
    });
}

function showvideo(videoDivId) {
    const videoElement = document.getElementById(videoDivId);
    if (videoElement) {
        if (videoDivId === 'top_video') {
            hideHighTempWarningPanel();
        }
        videoElement.style.display = 'block';
    }
}

function changeVideo1(newPath) {
    const videoElement = document.getElementById("top_video"); // Assuming it's a <video> tag
    hideHighTempWarningPanel();
    videoElement.style.display = "block";
    videoElement.src = newPath;
    videoElement.load(); // Reload video source
    videoElement.play(); // Play new video
}

function changeVideo2(newPath) {
    const videoElement = document.getElementById("bot_video"); // Assuming it's a <video> tag
    videoElement.style.display = "block";
    videoElement.src = newPath;
    videoElement.load(); // Reload video source
    videoElement.play(); // Play new video
}

function hidevideo(videoDivId) {
    const videoElement = document.getElementById(videoDivId);
    if (videoElement) {
        videoElement.style.display = "none";
    } else {
        console.warn("No element found with ID:", videoDivId);
    }
}

function changeVideoSourceOnly(videoId, newPath) {
    const videoElement = document.getElementById(videoId);
    if (!videoElement) return;

    if (newPath) {
        const urlPath = new URL(newPath, window.location.href).href;
        if (videoElement.src !== urlPath) {
            videoElement.src = newPath;
            videoElement.load();
            videoElement.play().catch(err => {
                console.warn("Playback prevented or interrupted: ", err);
            });
        }
    } else {
        videoElement.src = "";
        videoElement.load();
    }
}

function restoreDefaultVideosSourceOnly() {
    changeVideoSourceOnly('top_video', DEFAULT_TOP_VIDEO);
    changeVideoSourceOnly('bot_video', DEFAULT_BOTTOM_VIDEO);
}

function applyAccordionVideoState(accordionId) {
    const state = accordionVideoStates[accordionId];

    if (!state) {
        restoreDefaultVideosSourceOnly();
        return;
    }

    if (state.topVideo) {
        changeVideoSourceOnly('top_video', state.topVideo);
    } else {
        changeVideoSourceOnly('top_video', DEFAULT_TOP_VIDEO);
    }

    if (state.hideBottom) {
        changeVideoSourceOnly('bot_video', "");
    } else {
        changeVideoSourceOnly('bot_video', state.bottomVideo || DEFAULT_BOTTOM_VIDEO);
    }
}

function syncAccordionVideos() {
    const activeAccordionId = accordionVideoStack[accordionVideoStack.length - 1];

    if (!activeAccordionId) {
        restoreDefaultVideosSourceOnly();
        return;
    }

    applyAccordionVideoState(activeAccordionId);
}

function registerAccordionVideoHandlers() {
    Object.keys(accordionVideoStates).forEach((accordionId) => {
        const collapseElement = document.getElementById(accordionId);

        if (!collapseElement) {
            return;
        }

        collapseElement.addEventListener('show.bs.collapse', function () {
            const existingIndex = accordionVideoStack.indexOf(accordionId);
            if (existingIndex !== -1) {
                accordionVideoStack.splice(existingIndex, 1);
            }
            accordionVideoStack.push(accordionId);
            syncAccordionVideos();
        });

        collapseElement.addEventListener('hide.bs.collapse', function () {
            const existingIndex = accordionVideoStack.indexOf(accordionId);
            if (existingIndex !== -1) {
                accordionVideoStack.splice(existingIndex, 1);
            }
            syncAccordionVideos();
        });
    });
}

document.addEventListener('DOMContentLoaded', registerAccordionVideoHandlers);
document.addEventListener('DOMContentLoaded', registerAccordionChartHandlers);
document.addEventListener('DOMContentLoaded', registerAccordionMapPreviewHandlers);
document.addEventListener('DOMContentLoaded', refreshLayerTourOptions);
document.addEventListener('DOMContentLoaded', function () {
    updateLayerTourSpeed(layerTourSpeedLevel);
});


//____________________________________________________________________________________________________________________________________________________________________________________
function setMapCenter(map, longitude, latitude, zoomLevel = null, bearing = 0, pitch = 0) {
    // Use map.flyTo() for smooth transition
    map.flyTo({
        center: [longitude, latitude],
        zoom: zoomLevel,
        pitch: 40,
        bearing: bearing,
        essential: true // Ensures the animation happens even if the user prefers reduced motion
    });
}

function accordionZoom(map, layerId, zoomLevel, lat, lng) {
    const visibility = map.getLayoutProperty(layerId, 'visibility');

    if (visibility === 'visible') {
        map.setLayoutProperty(layerId, 'visibility', 'none');
    } else {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        setMapCenter(map, Number(lng), Number(lat), Number(zoomLevel));
    }
}
let blinkingIntervals = {}; // Store blinking intervals for multiple layers

function makeLayerBlink(map, layerId, interval = 500) {
    // If blinking is already active, stop it
    if (blinkingIntervals[layerId]) {
        clearInterval(blinkingIntervals[layerId]);
        delete blinkingIntervals[layerId]; // Remove reference
        map.setPaintProperty(layerId, 'circle-stroke-opacity', 1); // Ensure it's fully visible
        console.log(`Stopped blinking for layer: ${layerId}`);
        return;
    }

    // Ensure the layer exists
    if (!map.getLayer(layerId)) {
        console.error(`Layer ${layerId} not found!`);
        return;
    }

    let isVisible = true;

    // Start blinking and store the interval ID
    blinkingIntervals[layerId] = setInterval(() => {
        isVisible = !isVisible;
        map.setPaintProperty(layerId, 'circle-stroke-opacity', isVisible ? 1 : 0);
    }, interval);

    console.log(`Started blinking for layer: ${layerId}`);
}
// Generic popup function
function addPopup(layerId, contentCallback) {
    map1.on('click', layerId, (e) => {
        const coordinates = e.lngLat;
        const properties = e.features[0].properties;

        const popupContent = contentCallback(properties);

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map1);
    });

    // Optional: change the cursor on hover
    map1.on('mouseenter', layerId, () => {
        map1.getCanvas().style.cursor = 'pointer';
    });
    map1.on('mouseleave', layerId, () => {
        map1.getCanvas().style.cursor = '';
    });
}

//____________________________________________________________________________________________________________________________________________________________________________________
function toggleLayersVisibility(map, layerIds) {
    layerIds.forEach(layerId => {
        const visibility = map.getLayoutProperty(layerId, 'visibility');

        map.setLayoutProperty(
            layerId, 
            'visibility', 
            visibility === 'visible' ? 'none' : 'visible'
        );
    });
}//____________________________________________________________________________________________________________________________________________________________________________________
window.currentBasemapType = 'hybrid'; // Default basemap type

function updateMapLabelsColor() {
    const basemapType = window.currentBasemapType || 'hybrid';
    const isLight = (basemapType === 'light');

    const textColor = isLight ? '#000000' : '#ffffff';
    const textHaloColor = isLight ? '#ffffff' : '#000000';
    const textHaloWidth = isLight ? 2.0 : 1.2;

    const labelLayers = [
        'district-boundary-label-layer',
        'populated-places-name-label-layer',
        'populated-places-population-label-layer',
        'station-points-label-layer',
        'gmrc-wapda-label-layer',
        'glof-ii-label-layer',
        'glof-ii-damaged-stations-label-layer',
        'undp-all-sensors-label-layer',
        'bri-ff-sensors-label-layer'
    ];

    // Read any active travel route labels from toggles
    const routeToggles = document.querySelectorAll('.route-toggle');
    routeToggles.forEach(toggle => {
        let routeName = '';
        if (toggle.id === 'route-arandu-toggle') routeName = 'arandu';
        else if (toggle.id === 'route-bashu-valley-toggle') routeName = 'bashu valley';
        else if (toggle.id === 'route-ghulkin-toggle') routeName = 'ghulkin';
        else if (toggle.id === 'route-hopper-toggle') routeName = 'hopper';
        else if (toggle.id === 'route-khaplu-toggle') routeName = 'Khaplu';

        if (routeName) {
            const labelLayerId = `route-label-${routeName.replace(/\s+/g, '-').toLowerCase()}`;
            labelLayers.push(labelLayerId);
        }
    });

    labelLayers.forEach(layerId => {
        if (map1.getLayer(layerId)) {
            let color = textColor;
            if (layerId === 'populated-places-population-label-layer' && !isLight) {
                color = '#ffff00'; // Keep yellow on dark theme for highlight!
            } else if (layerId === 'district-boundary-label-layer' && !isLight) {
                color = '#f8fafc';
            }

            map1.setPaintProperty(layerId, 'text-color', color);
            map1.setPaintProperty(layerId, 'text-halo-color', textHaloColor);
            map1.setPaintProperty(layerId, 'text-halo-width', textHaloWidth);
        }
    });

    window._originalMapTextSizes = window._originalMapTextSizes || {};

    const styleLayers = map1.getStyle().layers;
    styleLayers.forEach(layer => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            if (!window._originalMapTextSizes[layer.id]) {
                window._originalMapTextSizes[layer.id] = layer.layout['text-size'] || 18;
            }

            if (isLight) {
                // Increase text size for ALL labels in light theme
                map1.setLayoutProperty(layer.id, 'text-size', ['*', 2.25, window._originalMapTextSizes[layer.id]]);

                // Enforce black color for native mapbox text labels
                if (!labelLayers.includes(layer.id)) {
                    map1.setPaintProperty(layer.id, 'text-color', '#000000');
                    map1.setPaintProperty(layer.id, 'text-halo-color', '#ffffff');
                    map1.setPaintProperty(layer.id, 'text-halo-width', 1.0);
                }
            } else {
                // Restore original sizes
                map1.setLayoutProperty(layer.id, 'text-size', window._originalMapTextSizes[layer.id]);
            }
        }
    });
}
window.updateMapLabelsColor = updateMapLabelsColor;

function changeBasemap(type) {
    // Reset cached text sizes when a new basemap is loaded to prevent issues with different base styles
    window._originalMapTextSizes = {};
    
    console.log("Selected Basemap:", type);
    window.currentBasemapType = type;

    // Update active class in basemap selector rows
    const basemapRows = document.querySelectorAll('.basemap-row');
    if (basemapRows.length > 0) {
        basemapRows.forEach(row => {
            if (row.getAttribute('data-basemap') === type) {
                row.classList.add('active');
            } else {
                row.classList.remove('active');
            }
        });
    }
    
    if (!map1) {
        console.error("Map instance is not available.");
        return;
    }

    let styleUrl = "";
    switch (type) {
        case "hybrid":
            styleUrl = "mapbox://styles/sarim240/clzme7200005801pb0o9tcw7r";
            break;
        case "terrain":
            styleUrl = "mapbox://styles/mapbox/outdoors-v11";
            break;
        case "light":
            styleUrl = "mapbox://styles/mapbox/light-v10";
            break;
        case "dark":
            styleUrl = "mapbox://styles/mapbox/dark-v10";
            break;
    }

    // Save only visible layers
    const visibleLayers = map1.getStyle().layers
        .filter(layer => map1.getLayoutProperty(layer.id, 'visibility') === 'visible')
        .map(layer => layer.id);

    console.log("Visible layers before basemap change:", visibleLayers);

    // Change the basemap style
    map1.setStyle(styleUrl);

    // Re-add layers once the new style has loaded
    map1.on('style.load', function () {
        visibleLayers.forEach(layerId => {
            if (map1.getLayer(layerId)) {
                map1.setLayoutProperty(layerId, 'visibility', 'visible');
            } else {
                console.warn(`Layer ${layerId} was not found in the new style.`);
            }
        });

        if (typeof window.reapplyStationPointAnimationFrame === 'function') {
            window.reapplyStationPointAnimationFrame();
        }

        // Apply high contrast labels color configuration based on active theme
        updateMapLabelsColor();

        console.log("Restored visibility for layers:", visibleLayers);
    });
}

//____________________________________________________________________________________________________________________________________________________________________________________
// Function to handle incident button click
let incidentPopup = null;

function handleIncidentButton() {
    console.log("Incident button clicked!");
    
    // Check if incident layer is currently visible
    const currentVisibility = map1.getLayoutProperty('incident', 'visibility');
    const isIncidentVisible = currentVisibility === 'visible';
    
    // Toggle incident layer visibility
    toggleLayersVisibility(map1, ['incident']);
    
    if (!isIncidentVisible) {
        // Incident is being shown - show video popup
        showIncidentVideo();
        
        // Zoom to the incident location
        const incidentCoords = [74.574942, 36.350894]; // Coordinates from your geojson
        map1.flyTo({
            center: incidentCoords,
            zoom: 12,
            essential: true
        });
    } else {
        // Incident is being hidden - hide video popup
        closeIncidentVideo();
    }
}

// Function to show incident video popup attached to the map point
function showIncidentVideo() {
    // Incident coordinates (same as in incident.js)
    const incidentCoordinates = [74.574942, 36.350894];
    
    // Create popup HTML with video
    const popupHTML = `
        <div class="incident-video-container">
            <button class="popup-close-btn" onclick="closeIncidentVideo()">&times;</button>
            <video id="incident-popup-video" controls autoplay muted loop style="width: 300px; height: 200px; border-radius: 8px; border: 3px solid #00b0b6; display: block;">
                <source src="data/Hassanabad.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="incident-info" style="text-align: center; margin-top: 8px; font-size: 14px; color: white;">
                <strong>Hassanabad Incident</strong><br>
                <small>GLOF Event Location</small>
            </div>
        </div>
    `;
    
    // Create and show the popup attached to the incident point
    incidentPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: [0, -25],
        className: 'incident-video-popup-mapbox'
    })
    .setLngLat(incidentCoordinates)
    .setHTML(popupHTML)
    .addTo(map1);
}

// Function to close incident video popup
function closeIncidentVideo() {
    if (incidentPopup) {
        incidentPopup.remove();
        incidentPopup = null;
    }
}

// ============================================================
// LAKE TEMPERATURE FORECAST CHART (GOOGLE SHEET TELEMETRY)
// ============================================================

const LAKE_TEMP_GIDS = {
    'darkot-collapse': { name: 'Darkut', gid: '0' },
    'thalu-collapse': { name: 'Thalo', gid: '1438256342' },
    'pindoru-collapse': { name: 'Pindoru Chaat', gid: '1511487579' },
    'chatiboi-collapse': { name: 'Chatiboi', gid: '1755543447' },
    'lusht-collapse': { name: 'Lasht', gid: '931317354' },
    'badswat-collapse': { name: 'Badswat', gid: '2026285818' },
    'ishokoman-collapse': { name: 'Iskoman', gid: '1704219657' },
    'terset-hundur-collapse': { name: 'Tersat Hundur', gid: '1587227881' },
    'ulter-collapse': { name: 'Ultar', gid: '1695337647' },
    'reshun-collapse': { name: 'Reshun', gid: '751299395' },
    'brep-collapse': { name: 'Brep', gid: '1311199872' },
    // Fallbacks for other accordions in the list:
    'gulmit-collapse': { name: 'Gulmit', gid: 'mock' },
    'hiranchi-collapse': { name: 'Hinarchi', gid: 'mock' },
    'shisper-collapse': { name: 'Shisper', gid: '2127384431' },
    'hisper-incident': { name: 'Hisper', gid: '8512550' }
};

const LAKE_TEMP_DATES = [
    "8-June", "9-June", "10-June", "11-June", "12-June", "13-June", "14-June", 
    "15-June", "16-June", "17-June", "18-Jun", "19-Jun", "20-Jun", "21-Jun", 
    "22-Jun", "23-Jun"
];

const LAKE_TEMP_FALLBACKS = {
    'Darkut': [8.8, 9.6, 9.5, 10.3, 11.9, 13.3, 10.2, 10.9, 12.3, 13.6, 13.7, 12.7, 14.0, 14.1, 19.0, 20.0],
    'Thalo': [-1.5, -0.7, -0.4, -0.3, 1.9, 3.0, 2.3, 1.1, 3.4, 3.6, 4.1, 3.9, 3.7, 4.4, 7.9, 8.5],
    'Pindoru Chaat': [0.5, 1.2, 1.8, 2.3, 3.4, 4.1, 3.8, 4.2, 5.1, 5.8, 6.3, 6.0, 6.8, 7.2, 10.1, 11.2],
    'Chatiboi': [-2.1, -1.8, -1.2, -0.9, 0.4, 1.1, 0.8, 0.5, 1.6, 2.1, 2.5, 2.3, 3.1, 3.5, 5.9, 6.8],
    'Lasht': [4.5, 5.1, 4.9, 5.8, 7.1, 8.3, 6.8, 7.2, 8.5, 9.2, 9.8, 9.1, 10.3, 10.7, 14.2, 15.1],
    'Badswat': [12.8, 13.3, 11.1, 14.6, 17.2, 19.0, 12.8, 15.9, 18.6, 19.9, 20.5, 19.8, 21.3, 21.6, 20.6, 21.0],
    'Iskoman': [10.2, 11.1, 10.8, 11.5, 12.8, 13.9, 11.5, 12.3, 13.8, 14.5, 15.1, 14.3, 15.6, 16.0, 19.2, 20.1],
    'Tersat Hundur': [6.8, 7.2, 7.0, 7.9, 9.1, 10.2, 8.8, 9.5, 10.8, 11.3, 11.9, 11.2, 12.4, 12.8, 15.9, 16.8],
    'Ultar': [1.2, 1.9, 1.5, 2.3, 3.8, 4.9, 3.5, 4.1, 5.6, 6.2, 6.8, 6.1, 7.3, 7.7, 10.9, 11.8],
    'Reshun': [9.5, 10.2, 9.9, 10.8, 12.1, 13.2, 11.8, 12.5, 13.8, 14.3, 14.9, 14.2, 15.4, 15.8, 18.9, 19.8],
    'Brep': [7.8, 8.5, 8.2, 9.1, 10.3, 11.4, 9.8, 10.5, 11.8, 12.3, 12.9, 12.2, 13.4, 13.8, 16.9, 17.8],
    'Shisper': [7.8, 8.4, 8.1, 9.2, 10.5, 11.7, 9.0, 10.1, 11.4, 12.2, 12.8, 11.9, 13.1, 13.4, 18.0, 17.5],
    'Hisper': [2.6, 3.9, 4.1, 3.4, 5.0, 4.8, 5.3, 5.1, 5.2, 5.9, 6.4, 5.6, 5.6, 5.8, 13.4, 15.5]
};



let activeLakeTempChart = null;
let activeLakeTempModalChart = null;
let currentActiveLakeName = '';
let currentActiveLakeCollapseId = '';
let currentActiveLakeData = [];

function isRightContainerVisible() {
    const ids = ['top_video', 'top_video_warning_chart', 'bot_video', 'controlChart', 'glaciersDataContainer'];
    return ids.some(id => {
        const el = document.getElementById(id);
        return el && window.getComputedStyle(el).display !== 'none';
    });
}

function updateActiveLegendOffset() {
    if (window.ContainerManager) {
        window.ContainerManager.scheduleLayout();
    }
}

function updateWidgetStacking() {
    const tempWidget = document.getElementById('lake-temp-widget');
    const videoWidget = document.getElementById('lake-video-widget');
    const areaWidget = document.getElementById('lake-area-widget');
    const riskLegend = document.getElementById('risk-zonation-legend');
    
    const isVisible = (tempWidget && tempWidget.classList.contains('is-visible')) || 
                      (videoWidget && videoWidget.classList.contains('is-visible')) ||
                      (areaWidget && areaWidget.classList.contains('is-visible'));
    
    if (riskLegend) {
        riskLegend.classList.toggle('risk-zonation-legend--with-temp', isVisible);
    }
}

function closeLakeTempWidget() {
    const widget = document.getElementById('lake-temp-widget');
    if (widget) {
        widget.classList.remove('is-visible');
    }
    updateActiveLegendOffset();
}

// ============================================================
// LAKE AREA CHANGE VIDEO WIDGET
// ============================================================

const LAKE_VIDEO_FILES = {
    'darkot-collapse': 'Darkut.mp4',
    'thalu-collapse': 'Thalo 1&2.mp4',
    'pindoru-collapse': 'Pindoru Chaat.mp4',
    'chatiboi-collapse': 'Chatiboi.mp4',
    'lusht-collapse': 'Lasht.mp4',
    'badswat-collapse': 'Badswat.mp4',
    'ishokoman-collapse': 'Ishkoman.mp4',
    'terset-hundur-collapse': 'Tersat Hundur.mp4',
    'ulter-collapse': 'Ulter.mp4',
    'shisper-collapse': 'Shishper.mp4',
    'reshun-collapse': 'Reshun.mp4'
};

function getLakeVideoPath(accordionId) {
    if (accordionId === 'hisper-incident') {
        return 'data/Hisper/Hisper GLOF 7th Jun.mp4';
    }
    const filename = LAKE_VIDEO_FILES[accordionId];
    if (!filename) return '';
    return `data/Lake Area Change Videos/${encodeURIComponent(filename)}`;
}

function showLakeVideoWidget(accordionId) {
    const config = LAKE_TEMP_GIDS[accordionId];
    if (!config) {
        closeLakeVideoWidget();
        return;
    }

    const lakeName = config.name;
    const widget = document.getElementById('lake-video-widget');
    const player = document.getElementById('lakeAreaVideoPlayer');
    const gifPlayer = document.getElementById('lakeAreaGifPlayer');
    const placeholder = document.getElementById('lake-video-placeholder');

    if (!widget || !player || !gifPlayer || !placeholder) return;
    
    // Slide widget in smoothly
    widget.classList.add('is-visible');
    
    const videoSrc = getLakeVideoPath(accordionId);
    
    if (!videoSrc) {
        player.style.display = 'none';
        player.pause();
        player.src = '';
        gifPlayer.style.display = 'none';
        gifPlayer.removeAttribute('src');
        placeholder.style.display = 'flex';
        const placeholderText = placeholder.querySelector('span');
        if (placeholderText) {
            placeholderText.textContent = `Video coming soon for ${lakeName}`;
        }
        updateActiveLegendOffset();
        return;
    }

    const isGif = videoSrc.toLowerCase().endsWith('.gif');
    
    if (isGif) {
        player.style.display = 'none';
        player.pause();
        player.src = '';
        
        gifPlayer.style.display = 'block';
        gifPlayer.src = videoSrc;
        placeholder.style.display = 'none';
    } else {
        gifPlayer.style.display = 'none';
        gifPlayer.removeAttribute('src');
        
        player.style.display = 'block';
        placeholder.style.display = 'none';
        player.src = videoSrc;
        
        player.onerror = function() {
            player.style.display = 'none';
            placeholder.style.display = 'flex';
            const placeholderText = placeholder.querySelector('span');
            if (placeholderText) {
                placeholderText.textContent = `Video coming soon for ${lakeName}`;
            }
        };
        
        player.load();
        player.play().catch(err => {
            console.warn("Auto-play was prevented by the browser. Awaiting user interaction.", err);
        });
    }

    updateActiveLegendOffset();
}

function closeLakeVideoWidget() {
    const widget = document.getElementById('lake-video-widget');
    const player = document.getElementById('lakeAreaVideoPlayer');
    const gifPlayer = document.getElementById('lakeAreaGifPlayer');
    if (widget) {
        widget.classList.remove('is-visible');
    }
    if (player) {
        player.pause();
        player.src = '';
    }
    if (gifPlayer) {
        gifPlayer.removeAttribute('src');
        gifPlayer.style.display = 'none';
    }
    updateActiveLegendOffset();
}

// ============================================================
// LAKE AREA CHANGE WIDGET (DYNAMIC SATELLITE DERIVED)
// ============================================================

let activeWaveAnimationId = null;
let activeGaugeAnimationId = null;
let activeParticleAnimationId = null;
let rippleIntervalId = null;
let currentGaugeAvgArea = 0;

const localLakeAreaData = [
    { district: 'GHIZER',      name: 'Darkut',         values: [202000, 215000, 222900, 219100, 221600, 221400, 244200] },
    { district: 'UPPER DIR',   name: 'Thalo 1',        values: [233000, 273700, 259200, 227200, 137800, 263100, 257742] },
    { district: 'CHITRAL',     name: 'Thalo 2',        values: [42700,  164400, 172100, 182800, 164600, 62200,  165634] },
    { district: 'CHITRAL',     name: 'Pindoru Chaat',  values: [219500, 238500, 250700, 274200, 293700, 301200, 301543] },
    { district: 'CHITRAL',     name: 'Near Chatiboi',  values: [10500,  9500,   3900,   3500,   4300,   4200,   5639]   },
    { district: 'CHITRAL',     name: 'Chatiboi',       values: [211900, 186800, 201600, 202900, 244000, 221000, 234499] },
    { district: 'CHITRAL',     name: 'Lasht',          values: [27300,  17500,  40400,  52300,  74200,  77800,  58208]  },
    { district: 'GHIZER',      name: 'Badswat',        values: [750600, 690700, 792500, 825000, 720900, 738800, 836474] },
    { district: 'GHIZER',      name: 'Ishkoman',       values: [74400,  72700,  77300,  72300,  74800,  79900,  83694]  },
    { district: 'GHIZER',      name: 'Tersat Hundur',  values: [140400, 135500, 134900, 136200, 134900, 134800, 150139] },
    { district: 'HUNZA NAGAR', name: 'Ultar',          values: [12000,  11100,  11000,  9600,   8600,   71,     8962]   },
    { district: 'CHITRAL',     name: 'Reshun',         values: [2900,   1400,   1900,   3000,   3700,   2700,   2819]   },
    { district: 'CHITRAL',     name: 'Brep',           values: [24900,  19900,  16400,  17300,  23100,  25000,  22577]  },
    { district: 'HUNZA NAGAR', name: 'Shisper',        values: [27300,  17500,  40400,  52300,  74200,  77800,  63200]  }
];

function showLakeAreaWidget(accordionId) {
    const config = LAKE_TEMP_GIDS[accordionId];
    if (!config) {
        closeLakeAreaWidget();
        return;
    }

    const lakeName = config.name;
    const widget = document.getElementById('lake-area-widget');
    if (!widget) return;

    // Slide widget in smoothly
    widget.classList.add('is-visible');

    // Populate dynamic data
    populateLakeAreaWidgetData(lakeName);

    // Start wave canvas animation
    startWaveAnimation();

    // Start particle animation
    startParticleAnimation();

    updateActiveLegendOffset();
}

function closeLakeAreaWidget() {
    const widget = document.getElementById('lake-area-widget');
    if (widget) {
        widget.classList.remove('is-visible');
    }
    if (activeWaveAnimationId) {
        cancelAnimationFrame(activeWaveAnimationId);
        activeWaveAnimationId = null;
    }
    if (activeGaugeAnimationId) {
        cancelAnimationFrame(activeGaugeAnimationId);
        activeGaugeAnimationId = null;
    }
    if (activeParticleAnimationId) {
        cancelAnimationFrame(activeParticleAnimationId);
        activeParticleAnimationId = null;
    }
    if (rippleIntervalId) {
        clearInterval(rippleIntervalId);
        rippleIntervalId = null;
    }
    updateActiveLegendOffset();
}

function populateLakeAreaWidgetData(lakeName) {
    const searchName = lakeName.toLowerCase().replace('sk', 'shk').replace('set', 'sat');
    let lake = localLakeAreaData.find(l => l.name.toLowerCase() === searchName || l.name.toLowerCase() === lakeName.toLowerCase());
    
    if (!lake) {
        lake = { district: 'NORTHERN AREAS', name: lakeName, values: [null, null, null, null, null, null, null] };
    }

    const titleEl = document.getElementById('gp-title-text');
    const lakeNumEl = document.getElementById('lakeNum');
    const labLabelYear = document.getElementById('labLabelYear');
    const tsMaxNote = document.getElementById('tsMaxNote');
    const tsRows = document.getElementById('tsRows');
    const glofFooterT = document.getElementById('glofFooterT');

    const districtName = lake.district.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    if (titleEl) titleEl.textContent = `${lake.name} Lake, ${districtName}`.toUpperCase();

    const values = lake.values;
    const curArea = values[values.length - 1]; // 2026

    // Calculate the 5-year average dynamically using only the non-null years 2021, 2022, 2023, 2024, 2025 (indices 1 to 5)
    const fiveYearValues = values.slice(1, 6).filter(v => v !== null && v !== undefined && !isNaN(v));
    const avgArea = fiveYearValues.length > 0 ? Math.round(fiveYearValues.reduce((a, b) => a + b, 0) / fiveYearValues.length) : null;
    
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    const maxArea = validValues.length > 0 ? Math.max(...validValues) : null;

    const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
    const maxIndex = maxArea !== null ? values.indexOf(maxArea) : -1;
    const maxYear = maxIndex !== -1 ? years[maxIndex] : '-';

    if (labLabelYear) labLabelYear.textContent = 'Current Lake Area';
    if (tsMaxNote) tsMaxNote.textContent = `max = ${maxYear}`;

    if (lakeNumEl) {
        animateWidgetCounter(lakeNumEl, curArea, 1800);
    }

    if (tsRows) {
        tsRows.innerHTML = '';
        for (let i = 6; i >= 0; i--) {
            const yr = years[i];
            const area = values[i];

            if (area === null || area === undefined || isNaN(area)) {
                const row = document.createElement('div');
                row.className = 'ts-row';
                row.style.animationDelay = `${0.45 + (6 - i) * 0.1}s`;
                row.innerHTML = `
                    <div class="ts-yr" style="color: #93c5fd">${yr}</div>
                    <div class="ts-track">
                        <div class="ts-fill" style="--w: 0%; background: transparent; animation-delay: ${0.5 + (6 - i) * 0.1}s;">
                        </div>
                        <div class="ts-bar-val">-</div>
                    </div>
                    <div class="ts-val" style="font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; text-align: right; white-space: nowrap; color: #93c5fd;">
                        -
                    </div>`;
                tsRows.appendChild(row);
                continue;
            }

            const pct = maxArea ? Math.round((area / maxArea) * 100) : 0;
            
            const isUp = avgArea !== null ? area >= avgArea : true;
            const chg = avgArea ? ((area - avgArea) / avgArea * 100).toFixed(1) : null;
            const grad = isUp
                ? 'linear-gradient(90deg,#5a0a0a,#a02020,#e74c3c)'
                : 'linear-gradient(90deg,#0a2e15,#0f5c28,#2ecc71)';

            const chgText = chg !== null ? `${isUp ? '▲' : '▼'}${Math.abs(chg)}%` : '-';

            const row = document.createElement('div');
            row.className = 'ts-row';
            row.style.animationDelay = `${0.45 + (6 - i) * 0.1}s`;
            row.innerHTML = `
                <div class="ts-yr" style="color: ${isUp ? '#e74c3c' : '#2ecc71'}">${yr}</div>
                <div class="ts-track">
                    <div class="ts-fill" style="--w: ${pct}%; background: ${grad}; animation-delay: ${0.5 + (6 - i) * 0.1}s;">
                        <div class="ts-fill-shine"></div>
                        <div class="ts-fill-ripple"></div>
                    </div>
                    <div class="ts-bar-val">${area.toLocaleString()} m²</div>
                </div>
                <div class="ts-val ${isUp ? 'up' : 'dn'}" style="font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; text-align: right; white-space: nowrap;">
                    ${chgText}
                </div>`;
            tsRows.appendChild(row);
        }
    }

    if (glofFooterT) {
        const today = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        glofFooterT.textContent = `Sentinel-2 · ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    }

    // Trigger gauge animation safely
    const anomalyPercent = (curArea !== null && avgArea !== null && avgArea > 0) ? ((curArea - avgArea) / avgArea) * 100 : null;
    startGaugeAnimation(anomalyPercent, avgArea);
}

function animateWidgetCounter(el, target, duration) {
    if (target === null || target === undefined || isNaN(target)) {
        el.textContent = '-';
        return;
    }
    const start = performance.now();
    function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(ease * target).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
}

function startWaveAnimation() {
    const wc = document.getElementById('waterCanvas');
    if (!wc) return;
    const wctx = wc.getContext('2d');

    function resizeWater() {
        wc.width = wc.offsetWidth || 210;
        wc.height = wc.offsetHeight || 220;
    }
    resizeWater();

    const wWaves = [
        { A: 7,   f: 0.030, sp: 0.030, ph: 0.0, r: 185, g: 12,  b: 12,  a: 0.95 },
        { A: 5,   f: 0.052, sp: 0.050, ph: 2.1, r: 145, g: 8,   b: 8,   a: 0.72 },
        { A: 4,   f: 0.020, sp: 0.018, ph: 4.6, r: 225, g: 45,  b: 25,  a: 0.48 },
        { A: 3,   f: 0.068, sp: 0.075, ph: 1.3, r: 100, g: 5,   b: 5,   a: 0.38 },
        { A: 2.5, f: 0.090, sp: 0.110, ph: 3.2, r: 255, g: 70,  b: 45,  a: 0.22 },
        { A: 2,   f: 0.045, sp: 0.035, ph: 5.1, r: 160, g: 20,  b: 20,  a: 0.18 }
    ];

    const ripples = [];
    function spawnRipple() {
        const W = wc.width, H = wc.height;
        ripples.push({
            x: W * 0.15 + Math.random() * W * 0.7,
            y: H * 0.42 + Math.random() * H * 0.35,
            r: 0, maxR: 10 + Math.random() * 14,
            a: 0.35 + Math.random() * 0.2,
            spd: 0.18 + Math.random() * 0.2
        });
    }

    if (rippleIntervalId) clearInterval(rippleIntervalId);
    rippleIntervalId = setInterval(spawnRipple, 900);

    const glints = [];
    for (let i = 0; i < 8; i++) {
        glints.push({
            x: Math.random(),
            y: 0.42 + Math.random() * 0.38,
            w: 0.025 + Math.random() * 0.04,
            h: 0.006 + Math.random() * 0.008,
            spd: 0.002 + Math.random() * 0.004,
            ph: Math.random() * Math.PI * 2,
            a: 0.10 + Math.random() * 0.08
        });
    }

    const bubbles = [];
    for (let i = 0; i < 18; i++) {
        bubbles.push({
            x: Math.random(),
            y: 0.5 + Math.random() * 0.45,
            r: 0.7 + Math.random() * 2.0,
            spd: 0.00025 + Math.random() * 0.0005,
            ph: Math.random() * Math.PI * 2,
            a: 0.12 + Math.random() * 0.18
        });
    }

    let wt = 0;
    if (activeWaveAnimationId) {
        cancelAnimationFrame(activeWaveAnimationId);
    }

    function drawWater() {
        if (!document.getElementById('lake-area-widget')?.classList.contains('is-visible')) {
            return;
        }
        const W = wc.width, H = wc.height;
        wctx.clearRect(0, 0, W, H);
        const lakeFrac = 0.42;

        wWaves.forEach(wv => {
            wctx.beginPath();
            wctx.moveTo(0, H);
            for (let x = 0; x <= W; x += 1.5) {
                const y = H * lakeFrac
                    + wv.A * Math.sin(wv.f * x + wv.ph + wt * wv.sp)
                    + wv.A * 0.40 * Math.sin(wv.f * 1.9 * x - wv.ph * 0.6 - wt * wv.sp * 0.5)
                    + wv.A * 0.18 * Math.sin(wv.f * 3.3 * x + wv.ph * 1.4 + wt * wv.sp * 1.5)
                    + wv.A * 0.08 * Math.sin(wv.f * 5.1 * x - wv.ph * 2.1 + wt * wv.sp * 2.2);
                wctx.lineTo(x, y);
            }
            wctx.lineTo(W, H);
            wctx.lineTo(0, H);
            wctx.closePath();
            wctx.fillStyle = `rgba(${wv.r},${wv.g},${wv.b},${wv.a})`;
            wctx.fill();
        });

        glints.forEach(g => {
            const gx = g.x * W, gy = g.y * H, gw = g.w * W, gh = g.h * H;
            const flicker = 0.4 + 0.6 * Math.abs(Math.sin(wt * g.spd * 60 + g.ph));
            wctx.save();
            wctx.globalAlpha = g.a * flicker;
            wctx.fillStyle = 'rgba(255,180,160,1)';
            wctx.beginPath();
            wctx.ellipse(gx + Math.sin(wt * 0.012 + g.ph) * gw * 0.5, gy, gw, gh, Math.sin(wt * 0.008 + g.ph) * 0.25, 0, Math.PI * 2);
            wctx.fill();
            wctx.restore();
        });

        bubbles.forEach(b => {
            b.y -= b.spd;
            if (b.y < 0.40) b.y = 0.55 + Math.random() * 0.38;
            const bx = b.x * W + Math.sin(wt * 0.012 + b.ph) * W * 0.012, by = b.y * H;
            wctx.save();
            wctx.globalAlpha = b.a * (0.5 + 0.5 * Math.sin(wt * 0.035 + b.ph));
            wctx.strokeStyle = 'rgba(255,140,120,0.85)';
            wctx.lineWidth = 0.7;
            wctx.beginPath();
            wctx.arc(bx, by, b.r, 0, Math.PI * 2);
            wctx.stroke();
            wctx.restore();
        });

        for (let i = ripples.length - 1; i >= 0; i--) {
            const rp = ripples[i];
            rp.r += rp.spd;
            const frac = rp.r / rp.maxR;
            wctx.save();
            wctx.globalAlpha = rp.a * (1 - frac);
            wctx.strokeStyle = 'rgba(255,120,100,0.9)';
            wctx.lineWidth = 0.8;
            wctx.beginPath();
            wctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
            wctx.stroke();
            wctx.restore();
            if (rp.r >= rp.maxR) ripples.splice(i, 1);
        }

        wt++;
        activeWaveAnimationId = requestAnimationFrame(drawWater);
    }

    drawWater();
}

function drawGauge(val) {
    const gc = document.getElementById('gaugeCanvas');
    if (!gc) return;
    const gctx = gc.getContext('2d');
    const W = gc.offsetWidth || 195;
    gc.width = W;
    gc.height = 145;
    gctx.clearRect(0, 0, W, 145);
    const cx = W / 2, cy = 128, R = Math.min(cx - 10, 86), sw = 16;
    const sa = Math.PI, ea = Math.PI * 2, span = ea - sa;

    // Use dynamic limit, defaulting to 25%
    const limit = window.currentGaugeLimit || 25;

    // zone tracks (Symmetric: Green < -5%, Yellow [-5%, +5%], Red > +5%)
    const transitionLow = (-5 + limit) / (limit * 2);
    const transitionHigh = (5 + limit) / (limit * 2);
    [
        { from: 0,              to: transitionLow,  col: '#0d4020' }, // Green (Safe/Decreased: < -5%)
        { from: transitionLow,  to: transitionHigh, col: '#5a4008' }, // Yellow (Average/Normal: -5% to +5%)
        { from: transitionHigh, to: 1.0,            col: '#6a0d0d' }  // Red (Danger/Increased: > +5%)
    ].forEach(z => {
        const a0 = sa + span * z.from + 0.02, a1 = sa + span * z.to - 0.02;
        gctx.beginPath();
        gctx.arc(cx, cy, R, a0, a1);
        gctx.strokeStyle = z.col;
        gctx.lineWidth = sw;
        gctx.lineCap = 'butt';
        gctx.stroke();
    });

    // tick dividers (Symmetric: 5 points)
    for (let i = 0; i <= 4; i++) {
        const a = sa + span / 4 * i;
        gctx.beginPath();
        gctx.moveTo(cx + Math.cos(a) * (R - sw * 0.6), cy + Math.sin(a) * (R - sw * 0.6));
        gctx.lineTo(cx + Math.cos(a) * (R + sw * 0.5), cy + Math.sin(a) * (R + sw * 0.5));
        gctx.strokeStyle = '#06090f';
        gctx.lineWidth = 1.5;
        gctx.stroke();
    }

    // tick labels (Symmetric: dynamically matching the limit)
    const tickLabels = [
        { label: `-${limit}%`, angle: Math.PI },
        { label: '0%',   angle: Math.PI * 1.5 },
        { label: `+${limit}%`,  angle: Math.PI * 2 }
    ];
    tickLabels.forEach(t => {
        gctx.fillStyle = '#ffffff';
        gctx.font = `700 12px Rajdhani,sans-serif`;
        gctx.textAlign = 'center';
        gctx.textBaseline = 'middle';
        const offsetR = R + sw + 11;
        gctx.fillText(t.label, cx + Math.cos(t.angle) * offsetR, cy + Math.sin(t.angle) * offsetR);
    });

    const isValValid = val !== null && val !== undefined && !isNaN(val);
    const needleVal = isValValid ? val : 0;

    // filled arc (Symmetric out from center 0% straight up)
    const fillFrac = Math.max(0, Math.min((needleVal + limit) / (limit * 2), 1));
    const fa = sa + span * fillFrac;
    
    if (isValValid && Math.abs(val) > 0.1) {
        const grd = gctx.createLinearGradient(cx - R, cy, cx + R, cy);
        grd.addColorStop(0, '#0f6e2e');
        grd.addColorStop(0.5, '#c07010');
        grd.addColorStop(1, '#e74c3c');
        
        gctx.beginPath();
        if (val > 0) {
            gctx.arc(cx, cy, R, sa + span * 0.5, fa);
        } else {
            gctx.arc(cx, cy, R, fa, sa + span * 0.5);
        }
        gctx.strokeStyle = grd;
        gctx.lineWidth = sw;
        gctx.lineCap = 'round';
        gctx.stroke();
    }

    // tip dot (drawn at the needle end, color-coded by anomaly value)
    const ex = cx + Math.cos(fa) * R, ey = cy + Math.sin(fa) * R;
    gctx.beginPath();
    gctx.arc(ex, ey, sw * 0.48, 0, Math.PI * 2);
    gctx.fillStyle = !isValValid ? '#ffb03b' : (val >= 5 ? '#ff6655' : (val <= -5 ? '#2ecc71' : '#ffb03b'));
    gctx.fill();

    // avg marker (blue tick straight up at 0% average)
    gctx.beginPath();
    gctx.moveTo(cx + Math.cos(sa + span * 0.5) * (R - sw * 0.75), cy + Math.sin(sa + span * 0.5) * (R - sw * 0.75));
    gctx.lineTo(cx + Math.cos(sa + span * 0.5) * (R + sw * 0.75), cy + Math.sin(sa + span * 0.5) * (R + sw * 0.75));
    gctx.strokeStyle = '#3498db';
    gctx.lineWidth = 2.5;
    gctx.stroke();

    // needle
    const needleA = sa + span * fillFrac;
    const ndx = cx + Math.cos(needleA) * (R - 8), ndy = cy + Math.sin(needleA) * (R - 8);
    gctx.beginPath();
    gctx.moveTo(cx, cy);
    gctx.lineTo(ndx, ndy);
    gctx.strokeStyle = 'rgba(255,255,255,0.65)';
    gctx.lineWidth = 1.8;
    gctx.lineCap = 'round';
    gctx.stroke();

    gctx.beginPath();
    gctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    gctx.fillStyle = !isValValid ? '#ffb03b' : (val >= 5 ? '#e74c3c' : (val <= -5 ? '#2ecc71' : '#ffb03b'));
    gctx.fill();

    // percentage text (Responsive Sci-Fi styled text showing actual calculation)
    gctx.fillStyle = !isValValid ? '#ffb03b' : (val >= 5 ? '#e74c3c' : (val <= -5 ? '#2ecc71' : '#ffb03b'));
    gctx.font = `700 26px Rajdhani,sans-serif`;
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    
    if (!isValValid) {
        gctx.fillText('-', cx, cy - 28);
    } else {
        const sign = val >= 0 ? '+' : '';
        const formattedVal = val.toFixed(1);
        gctx.fillText(sign + formattedVal + '%', cx, cy - 28);
    }
    
    gctx.fillStyle = '#ffffff';
    gctx.font = `700 14px Rajdhani,sans-serif`;
    const avgStr = (currentGaugeAvgArea !== null && currentGaugeAvgArea !== undefined && !isNaN(currentGaugeAvgArea) && currentGaugeAvgArea > 0)
        ? `${currentGaugeAvgArea.toLocaleString()} m²`
        : '-';
    gctx.fillText(avgStr, cx, cy - 12);
}

function startGaugeAnimation(targetAnomaly, avgArea) {
    currentGaugeAvgArea = avgArea || 0;
    const gc = document.getElementById('gaugeCanvas');
    if (!gc) return;

    if (targetAnomaly === null || targetAnomaly === undefined || isNaN(targetAnomaly)) {
        if (activeGaugeAnimationId) {
            cancelAnimationFrame(activeGaugeAnimationId);
            activeGaugeAnimationId = null;
        }
        drawGauge(null);
        return;
    }

    // 1. Determine dynamic gauge limit based on the actual anomaly size
    const absAnomaly = Math.abs(targetAnomaly);
    let limit = 25;
    if (absAnomaly > 50) {
        limit = 100;
    } else if (absAnomaly > 25) {
        limit = 50;
    }
    window.currentGaugeLimit = limit;

    let gcur = 0;
    const target = Math.max(-limit, Math.min(targetAnomaly, limit));

    if (activeGaugeAnimationId) {
        cancelAnimationFrame(activeGaugeAnimationId);
    }

    function animGauge() {
        if (!document.getElementById('lake-area-widget')?.classList.contains('is-visible')) {
            return;
        }
        let done = false;
        const step = limit / 18; // Keep needle rotation speeds feeling fluid
        if (target >= gcur) {
            gcur = Math.min(gcur + step, target);
            if (gcur >= target) done = true;
        } else {
            gcur = Math.max(gcur - step, target);
            if (gcur <= target) done = true;
        }
        drawGauge(gcur);
        if (!done) {
            activeGaugeAnimationId = requestAnimationFrame(animGauge);
        } else {
            drawGauge(target);
        }
    }
    
    drawGauge(0);
    setTimeout(animGauge, 500);
}

function startParticleAnimation() {
    const pc = document.getElementById('particleCanvas');
    if (!pc) return;
    pc.width = pc.offsetWidth || 400;
    const pctx = pc.getContext('2d');
    const particles = [];
    for (let i = 0; i < 65; i++) {
        particles.push({
            x: Math.random() * pc.width,
            y: Math.random() * 28,
            r: 0.7 + Math.random() * 1.8,
            spd: 0.25 + Math.random() * 0.7,
            a: 0.15 + Math.random() * 0.45,
            col: Math.random() < 0.65 ? '231,76,60' : '52,152,219'
        });
    }

    if (activeParticleAnimationId) {
        cancelAnimationFrame(activeParticleAnimationId);
    }

    function drawParticles() {
        if (!document.getElementById('lake-area-widget')?.classList.contains('is-visible')) {
            return;
        }
        pctx.clearRect(0, 0, pc.width, 28);
        pctx.fillStyle = '#040710';
        pctx.fillRect(0, 0, pc.width, 28);
        particles.forEach(p => {
            p.x += p.spd;
            if (p.x > pc.width + 3) p.x = -3;
            pctx.beginPath();
            pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            pctx.fillStyle = `rgba(${p.col},${p.a})`;
            pctx.fill();
        });
        activeParticleAnimationId = requestAnimationFrame(drawParticles);
    }
    drawParticles();
}

// Builds the beautiful neon-themed Chart.js temperature chart
function drawLakeTempChart(canvasId, labels, dataPoints, isModal = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    
    // Create elegant line gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 200);
    gradient.addColorStop(0, 'rgba(29, 78, 216, 0.45)');  // Bright neon blue transparent
    gradient.addColorStop(1, 'rgba(29, 78, 216, 0.0)');   // Completely transparent

    // Destroy existing chart to prevent rendering conflicts
    if (!isModal && activeLakeTempChart) {
        activeLakeTempChart.destroy();
    }
    if (isModal && activeLakeTempModalChart) {
        activeLakeTempModalChart.destroy();
    }

    const chartConfig = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: dataPoints,
                borderColor: '#60a5fa', // Neon blue color
                borderWidth: isModal ? 3.5 : 2.5,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#1d4ed8',
                pointBorderWidth: 2,
                pointRadius: isModal ? 5.5 : 4.2,
                pointHoverRadius: isModal ? 8 : 6,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4 // Smooth cubic interpolation curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We show metadata in header, keep graph tidy
                },
                tooltip: {
                    backgroundColor: 'rgba(8, 17, 31, 0.95)',
                    titleColor: '#93c5fd',
                    bodyColor: '#ffffff',
                    borderColor: '#1d4ed8',
                    borderWidth: 1.5,
                    cornerRadius: 6,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Temp: ${context.parsed.y} °C`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(147, 197, 253, 0.08)',
                        tickColor: 'rgba(147, 197, 253, 0.15)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: isModal ? 12 : 9.5,
                            family: "'Segoe UI', sans-serif"
                        },
                        maxRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: isModal ? 16 : 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(147, 197, 253, 0.08)',
                        tickColor: 'rgba(147, 197, 253, 0.15)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: isModal ? 12 : 9.5,
                            family: "'Segoe UI', sans-serif"
                        },
                        callback: function(value) {
                            return value + '°C';
                        }
                    }
                }
            },
            animations: {
                tension: {
                    duration: 800,
                    easing: 'easeOutQuart',
                    from: 1,
                    to: 0.4,
                    loop: false
                }
            }
        }
    };

    const newChart = new Chart(ctx, chartConfig);
    if (!isModal) {
        activeLakeTempChart = newChart;
    } else {
        activeLakeTempModalChart = newChart;
    }
    return newChart;
}

// Formats spreadsheet dates cleanly
function parseCSVDate(rawDate) {
    if (!rawDate) return '';
    return String(rawDate).trim();
}

// Core function triggered when lake is selected
async function showLakeTempChart(accordionId) {
    const config = LAKE_TEMP_GIDS[accordionId];
    if (!config) {
        closeLakeTempWidget();
        return;
    }

    const lakeName = config.name;
    currentActiveLakeName = lakeName;
    window.currentActiveLakeName = lakeName; // global store for modal
    currentActiveLakeCollapseId = accordionId;

    const widget = document.getElementById('lake-temp-widget');
    const titleEl = document.getElementById('lake-temp-title');
    const subtitleEl = document.getElementById('lake-temp-subtitle');

    if (!widget || !titleEl) return;

    // Set title and loading state
    titleEl.textContent = `${lakeName} Temperature Forecast`;
    if (subtitleEl) {
        subtitleEl.textContent = "Loading live telemetry...";
    }

    // Slide widget in smoothly
    widget.classList.add('is-visible');
    updateActiveLegendOffset();

    // 1. If GID is mock/none, show "Telemetry not available" and draw an empty chart
    if (!config.gid || config.gid === 'mock') {
        currentActiveLakeData = [];
        drawLakeTempChart('lakeTempChartCanvas', LAKE_TEMP_DATES, [], false);
        if (subtitleEl) {
            subtitleEl.textContent = "Telemetry not available (-)";
        }
        return;
    }

    // 2. Instantly render high-fidelity fallback data
    let chartData = LAKE_TEMP_FALLBACKS[lakeName] || [];
    currentActiveLakeData = chartData;
    drawLakeTempChart('lakeTempChartCanvas', LAKE_TEMP_DATES, chartData, false);

    const sheetCsvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTaQYCw9Jd6PgaRjuYOlk8aG0u59lV7iS0I62R5grvMVaIOEeK7dXZpGT1_nOGeiehaOLj-nzHhPxpO/pub?output=csv&gid=${config.gid}`;

    try {
        const response = await fetch(sheetCsvUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error("Network response not ok");
        
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        
        if (lines.length < 2) throw new Error("Empty CSV dataset");

        const parsedLabels = [];
        const parsedData = [];

        // Parse CSV lines: skips header (Name, Temperature)
        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(',');
            if (cells.length >= 2) {
                const dateLabel = parseCSVDate(cells[0]);
                const tempVal = parseFloat(cells[1]);
                if (dateLabel && !isNaN(tempVal)) {
                    parsedLabels.push(dateLabel);
                    parsedData.push(tempVal);
                }
            }
        }

        if (parsedData.length > 0 && currentActiveLakeName === lakeName) {
            currentActiveLakeData = parsedData;
            // Redraw chart smoothly with live spreadsheet data
            drawLakeTempChart('lakeTempChartCanvas', parsedLabels, parsedData, false);
            if (subtitleEl) {
                subtitleEl.textContent = "Live telemetry (Google Sheets)";
            }
        }
    } catch (err) {
        console.warn("Failed to fetch live spreadsheet data. Falling back to high-fidelity cache.", err);
        if (currentActiveLakeName === lakeName && subtitleEl) {
            subtitleEl.textContent = "Forecast trend (cached)";
        }
    }
}

// Handles drawing full-screen version in the center modal
function renderLakeTempChartInModal() {
    const labels = LAKE_TEMP_DATES;
    // Attempt to match dates if live parsed labels are currently drawn, otherwise fallback
    const liveLabels = activeLakeTempChart ? activeLakeTempChart.data.labels : labels;
    
    drawLakeTempChart('lakeTempChartModalCanvas', liveLabels, currentActiveLakeData, true);
}

// Binds show/hide collapse event listeners to the bootstrap accordion
function registerAccordionLakeTempChartHandlers() {
    Object.keys(LAKE_TEMP_GIDS).forEach((accordionId) => {
        const collapseElement = document.getElementById(accordionId);
        if (!collapseElement) return;

        collapseElement.addEventListener('show.bs.collapse', function () {
            showLakeTempChart(accordionId);
            showLakeVideoWidget(accordionId);
            showLakeAreaWidget(accordionId);
        });

        collapseElement.addEventListener('hide.bs.collapse', function () {
            if (currentActiveLakeCollapseId === accordionId) {
                closeLakeTempWidget();
                closeLakeVideoWidget();
                closeLakeAreaWidget();
            }
        });
    });

    // Handle Active Layers Legend mutation to dynamically adjust offsets
    const activeLegend = document.getElementById('active-layers-legend');
    if (activeLegend) {
        const legendObserver = new MutationObserver(() => {
            updateActiveLegendOffset();
        });
        legendObserver.observe(activeLegend, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            childList: true,
            subtree: true
        });
        
        // Initial setup
        setTimeout(updateActiveLegendOffset, 500);
    }
}

// Wire DomContentLoaded setup
document.addEventListener('DOMContentLoaded', registerAccordionLakeTempChartHandlers);
document.addEventListener('DOMContentLoaded', updateActiveLegendOffset);
document.addEventListener('DOMContentLoaded', initLakeMapPreviewAspectObserver);
window.addEventListener('resize', updateActiveLegendOffset);

//____________________________________________________________________________________________________________________________________________________________________________________
// Land Surface Temperature (LST) Controls
const lstMonthNames = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
let currentLSTMonth = 1;
let lstPlayInterval = null;

function toggleLST(isChecked) {
    const panel = document.getElementById('lst-panel');
    if (isChecked) {
        panel.style.display = 'block';
        // Reset to January
        currentLSTMonth = 1;
        document.getElementById('lst-month-slider').value = 1;
        document.getElementById('lst-month-label').textContent = lstMonthNames[0];
        document.getElementById('lst-opacity-slider').value = 100;
        document.getElementById('lst-opacity-value').textContent = '100%';
        document.getElementById('lst-opacity-row').style.display = 'none';
        document.getElementById('lst-play-btn').textContent = '\u25B6';
        map1.setPaintProperty('lst-month-1', 'raster-opacity', 1.0);
        map1.setLayoutProperty('lst-month-1', 'visibility', 'visible');
    } else {
        _lstStopPlay();
        panel.style.display = 'none';
        for (let i = 1; i <= 12; i++) {
            map1.setLayoutProperty(`lst-month-${i}`, 'visibility', 'none');
        }
    }
}

function changeLSTMonth(value) {
    const newMonth = parseInt(value);
    const opacity = parseInt(document.getElementById('lst-opacity-slider').value) / 100;
    map1.setLayoutProperty(`lst-month-${currentLSTMonth}`, 'visibility', 'none');
    map1.setLayoutProperty(`lst-month-${newMonth}`, 'visibility', 'visible');
    map1.setPaintProperty(`lst-month-${newMonth}`, 'raster-opacity', opacity);
    currentLSTMonth = newMonth;
    document.getElementById('lst-month-label').textContent = lstMonthNames[newMonth - 1];
    document.getElementById('lst-month-slider').value = newMonth;
}

function changeLSTOpacity(value) {
    const opacity = parseInt(value) / 100;
    document.getElementById('lst-opacity-value').textContent = value + '%';
    map1.setPaintProperty(`lst-month-${currentLSTMonth}`, 'raster-opacity', opacity);
}

function toggleLSTOpacityBar() {
    const row = document.getElementById('lst-opacity-row');
    const visible = row.style.display === 'flex';
    row.style.display = visible ? 'none' : 'flex';
}

function toggleLSTPlay() {
    if (lstPlayInterval) {
        _lstStopPlay();
    } else {
        document.getElementById('lst-play-btn').textContent = '\u23F8';
        lstPlayInterval = setInterval(() => {
            const next = (currentLSTMonth % 12) + 1;
            changeLSTMonth(next);
        }, 1200);
    }
}

function _lstStopPlay() {
    if (lstPlayInterval) {
        clearInterval(lstPlayInterval);
        lstPlayInterval = null;
    }
    const btn = document.getElementById('lst-play-btn');
    if (btn) btn.textContent = '\u25B6';
}

function closeLSTPanel() {
    _lstStopPlay();
    document.getElementById('lst-panel').style.display = 'none';
    document.getElementById('lst-opacity-row').style.display = 'none';
    const toggle = document.getElementById('lst-layer-toggle');
    if (toggle) toggle.checked = false;
    for (let i = 1; i <= 12; i++) {
        map1.setLayoutProperty(`lst-month-${i}`, 'visibility', 'none');
    }
}

// ============================================================
// DYNAMIC GOOGLE SHEET SYNCHRONIZATION FOR LAKE CHANGES
// ============================================================

window.updateGlobalLakeData = function(sheetData) {
    if (!sheetData || !Array.isArray(sheetData)) return;
    
    // 1. Update localLakeAreaData in controls.js in-place
    localLakeAreaData.length = 0;
    sheetData.forEach(item => {
        localLakeAreaData.push({
            district: item.district,
            name: item.name,
            values: item.values
        });
    });

    // 2. Update lakeAreaData in index.html in-place
    if (window.lakeAreaData) {
        window.lakeAreaData.length = 0;
        sheetData.forEach(item => {
            window.lakeAreaData.push({
                district: item.district,
                name: item.name,
                values: item.values,
                volume: item.volume
            });
        });
    }

    // 3. Re-render charts
    if (typeof updateLakeChart === 'function') {
        updateLakeChart();
    }
    if (typeof updateVolumeChart === 'function') {
        updateVolumeChart();
    }

    // 4. Update the sidebar widget if it is currently open
    if (typeof currentActiveLakeCollapseId === 'string' && currentActiveLakeCollapseId && typeof populateLakeAreaWidgetData === 'function') {
        const config = LAKE_TEMP_GIDS[currentActiveLakeCollapseId];
        if (config && config.name) {
            populateLakeAreaWidgetData(config.name);
        }
    }
    
    console.log('Successfully updated global lake data from Google Sheet:', sheetData);
};

async function loadLakeDataFromGoogleSheet() {
    try {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPovMmHkW7h2JxasR4hrKDOfdU9mrMm8u9CSrsFWieWEr0SmB-2FRhzAfIsdlc2lwgQQjadEPzeLQD/pubhtml/sheet?headers=false&gid=0';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed with status ' + response.status);
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const rows = doc.querySelectorAll('.ritz table.waffle tbody tr');
        
        const sheetData = [];
        
        rows.forEach((row, index) => {
            if (index < 2) return; // Skip headers
            
            const cols = row.querySelectorAll('td');
            if (cols.length < 16) return;
            
            let district = cols[0].textContent.trim().toUpperCase();
            let name = cols[1].textContent.trim();
            if (!district || !name) return;

            // Normalize 'HUNZA' to 'HUNZA NAGAR' to align with dropdown options and active config states
            if (district === 'HUNZA') {
                district = 'HUNZA NAGAR';
            }
            
            // Normalize names to match dropdown values and static array names
            name = name.replace(/_1/g, ' 1')
                       .replace(/_2/g, ' 2')
                       .replace(/ Glacial Lake/gi, '')
                       .replace(/ Glacial lake/gi, '')
                       .replace(/ chaat/gi, ' Chaat')
                       .trim();
            
            // Areas 2020 to 2025 (indices 2 to 7)
            const values = [];
            for (let i = 2; i <= 7; i++) {
                const valStr = cols[i].textContent.trim().replace(/,/g, '');
                const valFloat = parseFloat(valStr);
                values.push(isNaN(valFloat) ? null : Math.round(valFloat));
            }
            
            // Current Area for 2026 is in cols[15]
            const currentAreaStr = cols[15].textContent.trim().replace(/,/g, '');
            const currentAreaFloat = parseFloat(currentAreaStr);
            values.push(isNaN(currentAreaFloat) ? null : Math.round(currentAreaFloat));
            
            // Volumes 2020 to 2025 (indices 9 to 14)
            const volume = [];
            for (let i = 9; i <= 14; i++) {
                const valStr = cols[i].textContent.trim().replace(/,/g, '');
                const valFloat = parseFloat(valStr);
                volume.push(isNaN(valFloat) ? null : valFloat);
            }
            
            sheetData.push({
                district,
                name,
                values,
                volume
            });
        });
        
        if (sheetData.length > 0) {
            window.updateGlobalLakeData(sheetData);
        }
    } catch (e) {
        console.error('Failed to load live Google Sheet data, using static fallbacks:', e);
    }
}

document.addEventListener('DOMContentLoaded', loadLakeDataFromGoogleSheet);

// Dynamic Container Repositioning Mechanism based on visibility and slot preferences
let containerObserver = null;

// ============================================================
// SLOT-BASED CONTAINER STACK MANAGER
// ============================================================
// Layout model:
//
//  [col 0 - center-right]  [col 1 - rightmost]
//  ┌──────────────┐         ┌──────────────┐
//  │  lake-area   │ s2      │  top_video   │ s3  ← top slot
//  │   widget     │ s1 ←span2             │
//  ├──────────────┤         ├──────────────┤
//  │  lake-temp   │ s0      │  bot_video   │ s2
//  └──────────────┘         ├──────────────┤
//                           │  ctrl chart  │ s1
//                           ├──────────────┤
//                           │    legend    │ s0  ← ALWAYS pinned bottom-right
//                           └──────────────┘
//
// Rules:
//  1. Legend is ALWAYS slot 0 col 1 (bottom-right corner). Pinned.
//  2. Each column has SLOT_COUNT vertical slots of SLOT_H px.
//  3. `span:2` containers occupy 2 consecutive slots (lake-area widget etc).
//  4. Containers try their preferred col first, overflow to next col if full.
//  5. All movement is CSS-transition animated (no jumping).
// ============================================================

(function () {
    'use strict';

    // ── Tuneable constants ────────────────────────────────────
    const COL_GAP    = 16;         // px — horizontal gap between columns
    const RIGHT_EDGE = 52;         // px — from right viewport edge (toggle rail)
    const BOTTOM_EDGE = 12;        // px — from bottom viewport edge
    const EASE       = '0.28s cubic-bezier(0.4, 0, 0.2, 1)';

    // ── Container registry ────────────────────────────────────
    // col  : 1 = rightmost column, 0 = one left, 2 = two left
    // span : number of slots this container occupies vertically
    // pinned : forces the container to slot 0 of its column (bottom anchor)
    const REGISTRY = [
        // Legend — pinned to bottom of right column, always
        { id: 'active-layers-legend',    col: 1, span: 1, pinned: true,  z: 15 },
        { id: 'risk-zonation-legend',    col: 1, span: 1, pinned: true,  z: 15 },

        // Right column standard containers (col 1)
        { id: 'top_video',               col: 1, span: 1, pinned: false, z: 10 },
        { id: 'top_video_warning_chart', col: 1, span: 1, pinned: false, z: 10 },
        { id: 'bot_video',               col: 1, span: 1, pinned: false, z: 10 },
        { id: 'controlChart',            col: 1, span: 1, pinned: false, z: 10 },
        { id: 'glaciersDataContainer',   col: 1, span: 1, pinned: false, z: 10 },

        // Lake widgets — preferred col 0, lake-area spans 2 slots
        { id: 'lake-area-widget',        col: 0, span: 2, pinned: false, z: 11 },
        { id: 'lake-temp-widget',        col: 0, span: 1, pinned: false, z: 11 },
        { id: 'lake-video-widget',       col: 0, span: 1, pinned: false, z: 11 },
        { id: 'lake-map-preview',        col: 0, span: 1, pinned: false, z: 11 },
    ];

    // ── Helpers ───────────────────────────────────────────────

    function isVisible(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none'
            && cs.visibility !== 'hidden'
            && el.offsetParent !== null;
    }

    // slotMap[colIdx][slotIdx] = true if occupied
    function makeSlotMap() {
        return { 0: [], 1: [], 2: [] };
    }

    function occupySlots(slotMap, colIdx, start, span) {
        for (let i = start; i < start + span; i++) {
            slotMap[colIdx][i] = true;
        }
    }

    function findFreeSlot(slotMap, colIdx, span, minSlot, SLOT_COUNT, SLOT_H, SLOT_GAP, col1Offset, viewportHeight, activeLegendId) {
        function getSlotBottom(sIdx) {
            if (colIdx === 1 && activeLegendId) {
                return col1Offset + (sIdx - 1) * (SLOT_H + SLOT_GAP);
            }
            return BOTTOM_EDGE + sIdx * (SLOT_H + SLOT_GAP);
        }

        for (let start = minSlot; start <= SLOT_COUNT - span; start++) {
            let free = true;
            for (let i = start; i < start + span; i++) {
                if (slotMap[colIdx][i]) { free = false; break; }
            }
            if (!free) continue;

            // Check if it fits within the viewport vertically
            const bottom = getSlotBottom(start);
            const topEdge = bottom + (span * SLOT_H + (span - 1) * SLOT_GAP);
            if (topEdge <= viewportHeight - 12) {
                return start;
            } else {
                break;
            }
        }
        return -1;
    }

    function getRightContainersMaxColumn() {
        let maxCol = 0; // 0: none, 1: col 1, 2: col 2, 3: col 3
        REGISTRY.forEach(def => {
            if (def.id !== 'active-layers-legend' && def.id !== 'risk-zonation-legend' && isVisible(def.id)) {
                if (def.actualCol === 2) {
                    maxCol = Math.max(maxCol, 3);
                } else if (def.actualCol === 0) {
                    maxCol = Math.max(maxCol, 2);
                } else if (def.actualCol === 1) {
                    maxCol = Math.max(maxCol, 1);
                }
            }
        });
        return maxCol;
    }

    // ── Layout pass ───────────────────────────────────────────

    function layout() {
        if (_obs) _obs.disconnect();

        const mapEl = document.getElementById('map');
        const viewportHeight = mapEl ? mapEl.clientHeight : window.innerHeight;

        // Dynamic, responsive sizes matching GLOF portal
        const vw = window.innerWidth / 100;
        const COL_W = Math.round(22 * vw);
        const SLOT_H = Math.round(12.5 * vw);
        const SLOT_GAP = Math.max(6, Math.round(0.4 * vw));
        
        // Reset actual placed columns
        REGISTRY.forEach(def => { def.actualCol = null; });

        const slotMap = makeSlotMap();

        const activeLayersLegend = document.getElementById('active-layers-legend');
        const riskZonationLegend = document.getElementById('risk-zonation-legend');
        
        const isActiveLayersVisible = activeLayersLegend && !activeLayersLegend.classList.contains('is-hidden') && window.getComputedStyle(activeLayersLegend).display !== 'none';
        const isRiskZonationVisible = riskZonationLegend && window.getComputedStyle(riskZonationLegend).display !== 'none';
        
        let legendHeight = 0;
        let activeLegendId = null;
        if (isActiveLayersVisible) {
            legendHeight = activeLayersLegend.offsetHeight;
            activeLegendId = 'active-layers-legend';
        } else if (isRiskZonationVisible) {
            legendHeight = riskZonationLegend.offsetHeight;
            activeLegendId = 'risk-zonation-legend';
        }

        // Adjust lake widgets preferred column based on whether standard persistent containers are visible
        const persistentIds = ['top_video', 'top_video_warning_chart', 'bot_video', 'controlChart', 'glaciersDataContainer'];
        const hasPersistentVisible = persistentIds.some(id => isVisible(id));
        const lakeWidgetIds = ['lake-area-widget', 'lake-temp-widget', 'lake-video-widget', 'lake-map-preview'];
        REGISTRY.forEach(def => {
            if (lakeWidgetIds.includes(def.id)) {
                def.col = hasPersistentVisible ? 0 : 1;
            }
        });

        // Set gap between legend and first container to 24px, fall back to BOTTOM_EDGE (12px) if no legend
        const col1Offset = legendHeight > 0 ? (legendHeight + 24) : BOTTOM_EDGE;

        function colRight(colIdx) {
            const order = colIdx === 1 ? 0 : colIdx === 0 ? 1 : 2;
            return RIGHT_EDGE + order * (COL_W + COL_GAP);
        }

        function slotBottom(slotIdx, colIdx) {
            if (colIdx === 1 && activeLegendId) {
                if (slotIdx === 0) {
                    return BOTTOM_EDGE;
                } else {
                    return col1Offset + (slotIdx - 1) * (SLOT_H + SLOT_GAP);
                }
            }
            return BOTTOM_EDGE + slotIdx * (SLOT_H + SLOT_GAP);
        }

        function applyPos(el, bottom, right, span, isLegend) {
            el.style.position   = 'absolute';
            el.style.bottom     = bottom + 'px';
            el.style.right      = right  + 'px';
            el.style.top        = 'auto';
            el.style.left       = 'auto';
            if (!isLegend) {
                el.style.width      = COL_W  + 'px';
                el.style.maxHeight  = (span * SLOT_H + (span - 1) * SLOT_GAP) + 'px';
                el.style.overflowY  = 'auto';
            } else {
                el.style.width      = '';
                el.style.maxHeight  = '';
                el.style.overflowY  = 'hidden';
            }
            el.style.transition = `bottom ${EASE}, right ${EASE}`;
        }

        // Step 1 — pin active legend to slot 0 of col 1 (bottom-right)
        if (activeLegendId) {
            const el = document.getElementById(activeLegendId);
            applyPos(el, slotBottom(0, 1), colRight(1), 1, true);
            el.style.zIndex = 15;
            occupySlots(slotMap, 1, 0, 1);   // reserve slot 0 in col 1
        }

        // Step 1.5 — Place lake-area-widget at slots 2 & 3 of Column 1 if visible (top of 1st column)
        const isLakeAreaActive = isVisible('lake-area-widget');
        if (isLakeAreaActive) {
            const el = document.getElementById('lake-area-widget');
            applyPos(el, slotBottom(2, 1), colRight(1), 2, false);
            el.style.zIndex = 11;
            occupySlots(slotMap, 1, 2, 2); // occupy slots 2 and 3 in Column 1
            const regEntry = REGISTRY.find(r => r.id === 'lake-area-widget');
            if (regEntry) regEntry.actualCol = 1;
        }

        // Step 2 — place all other visible containers (excluding lake-area-widget if already placed)
        const others = REGISTRY.filter(r => !r.pinned && isVisible(r.id) && r.id !== 'lake-area-widget');

        // Sort: right-column items first so col 1 fills before overflow
        const colOrder = [1, 0, 2];
        others.sort((a, b) => {
            const colDiff = colOrder.indexOf(a.col) - colOrder.indexOf(b.col);
            if (colDiff !== 0) return colDiff;
            
            const idxA = REGISTRY.findIndex(r => r.id === a.id);
            const idxB = REGISTRY.findIndex(r => r.id === b.id);
            
            const lakeWidgetIds = ['lake-area-widget', 'lake-temp-widget', 'lake-video-widget', 'lake-map-preview'];
            const isLakeA = lakeWidgetIds.includes(a.id);
            const isLakeB = lakeWidgetIds.includes(b.id);
            
            if (isLakeA && isLakeB) {
                // Ascending registry order for lake widgets (lake-temp/video stay in Column 1, lake-map-preview wraps)
                return idxA - idxB;
            } else {
                // Descending registry order for standard containers (bottom-to-top stacking)
                return idxB - idxA;
            }
        });

        others.forEach(def => {
            const el = document.getElementById(def.id);
            if (!el) return;

            // Try preferred col, then overflow order
            const tryOrder = [def.col, ...colOrder.filter(c => c !== def.col)];
            let placed = false;

            for (const colIdx of tryOrder) {
                // Slot 0 of col 1 is reserved for legend if legend is active
                const minSlot = (colIdx === 1 && activeLegendId) ? 1 : 0;
                // Allow up to 5 slots vertically, using top boundary check to fit
                const slot = findFreeSlot(slotMap, colIdx, def.span, minSlot, 5, SLOT_H, SLOT_GAP, col1Offset, viewportHeight, activeLegendId);

                if (slot !== -1) {
                    applyPos(el, slotBottom(slot, colIdx), colRight(colIdx), def.span, false);
                    el.style.zIndex = def.z;
                    occupySlots(slotMap, colIdx, slot, def.span);
                    def.actualCol = colIdx;
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                // Overflow beyond grid — stack above slot 4 in col 2
                const overflowBottom = slotBottom(4, 2);
                applyPos(el, overflowBottom, colRight(2), def.span, false);
                el.style.zIndex = def.z;
                def.actualCol = 2;
                console.warn('[ContainerManager] Grid full, overflowing:', def.id);
            }
        });

        // Set the active legend height for stacking other widgets if needed.
        if (mapEl) {
            const maxCol = getRightContainersMaxColumn();
            let rightWidgetOffset = '52px';
            if (maxCol === 1) {
                rightWidgetOffset = 'calc(22% + 68px)';
            } else if (maxCol >= 2) {
                rightWidgetOffset = 'calc(44% + 84px)';
            }
            mapEl.style.setProperty('--right-widget-offset', rightWidgetOffset);

            const isWidgetInCol1 = rightWidgetOffset === '52px';
            const activeLegendHeightVal = (activeLegendId && isWidgetInCol1) ? (legendHeight + 10) : 0;
            mapEl.style.setProperty('--active-legend-height', `${activeLegendHeightVal}px`);
            mapEl.style.setProperty('--lake-video-height', `${isVisible('lake-video-widget') ? (document.getElementById('lake-video-widget').offsetHeight + 10) : 0}px`);
            mapEl.style.setProperty('--lake-temp-height', `${isVisible('lake-temp-widget') ? (document.getElementById('lake-temp-widget').offsetHeight + 10) : 0}px`);
            mapEl.style.setProperty('--lake-area-height', `${isVisible('lake-area-widget') ? (document.getElementById('lake-area-widget').offsetHeight + 10) : 0}px`);
            
            // Adjust map preview margin
            const tempWidget = document.getElementById('lake-temp-widget');
            const videoWidget = document.getElementById('lake-video-widget');
            const areaWidget = document.getElementById('lake-area-widget');
            const previewWidget = document.getElementById('lake-map-preview');
            const chartsRow = document.getElementById('charts-row');
            const menu = document.getElementById('menu');

            const isTempVisible = isVisible('lake-temp-widget');
            const isVideoVisible = isVisible('lake-video-widget');
            const isAreaVisible = isVisible('lake-area-widget');
            const isPreviewVisible = isVisible('lake-map-preview');
            const isChartsRowVisible = chartsRow && !chartsRow.classList.contains('hidden-charts') && window.getComputedStyle(chartsRow).display !== 'none';
            const isMenuVisible = menu && window.getComputedStyle(menu).display !== 'none';

            let leftOverlayRightEdge = 0;
            if (isChartsRowVisible && chartsRow) {
                leftOverlayRightEdge = chartsRow.offsetLeft + chartsRow.offsetWidth;
            } else if (isMenuVisible && menu) {
                leftOverlayRightEdge = menu.offsetLeft + menu.offsetWidth;
            }

            let rightOffsetWidth = 0;
            if (!isWidgetInCol1) {
                if (isTempVisible) rightOffsetWidth = tempWidget.offsetWidth;
                else if (isVideoVisible) rightOffsetWidth = videoWidget.offsetWidth;
                else if (isAreaVisible) rightOffsetWidth = areaWidget.offsetWidth;
            } else {
                if (activeLegendId) rightOffsetWidth = document.getElementById(activeLegendId).offsetWidth;
                else if (isTempVisible) rightOffsetWidth = tempWidget.offsetWidth;
                else if (isVideoVisible) rightOffsetWidth = videoWidget.offsetWidth;
                else if (isAreaVisible) rightOffsetWidth = areaWidget.offsetWidth;
            }

            const mapWidth = mapEl.clientWidth;
            const rightMargin = (rightWidgetOffset === 'calc(44% + 84px)') ? Math.round(mapWidth * 0.44 + 84) : 
                                (rightWidgetOffset === 'calc(22% + 68px)') ? Math.round(mapWidth * 0.22 + 68) : 52;
            const activeLegendWidthOffset = rightOffsetWidth > 0 ? (rightOffsetWidth + 12) : 0;
            const previewWidth = previewWidget ? previewWidget.offsetWidth : 0;
            const projectedPreviewLeftEdge = mapWidth - rightMargin - activeLegendWidthOffset - previewWidth - 20;

            const shouldStackPreviewVertically = isPreviewVisible && (projectedPreviewLeftEdge < leftOverlayRightEdge);

            if (shouldStackPreviewVertically) {
                mapEl.classList.add('stack-preview-vertical');
                mapEl.style.setProperty('--lake-preview-height', `${previewWidget.offsetHeight > 0 ? (previewWidget.offsetHeight + 10) : 0}px`);
            } else {
                mapEl.classList.remove('stack-preview-vertical');
                mapEl.style.setProperty('--lake-preview-height', '0px');
            }
            mapEl.style.setProperty('--active-legend-width', `${activeLegendWidthOffset}px`);
        }

        if (typeof updateWidgetStacking === 'function') {
            updateWidgetStacking();
        }

        setupObserver();
    }

    // ── Debounce via rAF ──────────────────────────────────────

    let _raf = null;
    function scheduleLayout() {
        if (_raf) return;
        _raf = requestAnimationFrame(() => { _raf = null; layout(); });
    }

    // ── MutationObserver ──────────────────────────────────────

    let _obs = null;
    function setupObserver() {
        if (_obs) _obs.disconnect();
        _obs = new MutationObserver(scheduleLayout);
        const ids = REGISTRY.map(r => r.id).concat([
            'risk-zonation-legend',
            'station-forecast-widget',
            'station-animation-panel',
        ]);
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) _obs.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
        });
    }

    // ── Public API ────────────────────────────────────────────

    window.ContainerManager = {
        layout,
        scheduleLayout,
        register(def) {
            const idx = REGISTRY.findIndex(r => r.id === def.id);
            const entry = { col: 1, span: 1, pinned: false, z: 10, ...def };
            if (idx !== -1) REGISTRY[idx] = entry; else REGISTRY.push(entry);
            setupObserver();
            scheduleLayout();
        },
        setSpan(id, span) {
            const def = REGISTRY.find(r => r.id === id);
            if (def) { def.span = Math.max(1, span); scheduleLayout(); }
        },
    };

    window.repositionContainers   = layout;
    window.scheduleContainerLayout = scheduleLayout;

    // ── Bootstrap collapse events ─────────────────────────────

    document.addEventListener('shown.bs.collapse',  scheduleLayout);
    document.addEventListener('hidden.bs.collapse', scheduleLayout);

    // ── Base CSS ──────────────────────────────────────────────

    function injectCSS() {
        if (document.getElementById('_csm_base')) return;
        const s = document.createElement('style');
        s.id = '_csm_base';
        s.textContent = [
            '#top_video',
            '#top_video_warning_chart',
            '#bot_video',
            '#controlChart',
            '#glaciersDataContainer',
            '#active-layers-legend',
            '#risk-zonation-legend',
            '#lake-area-widget',
            '#lake-temp-widget',
            '#lake-video-widget',
            '#lake-map-preview',
        ].join(',\n') + ' { position: absolute; box-sizing: border-box; }';
        document.head.appendChild(s);
    }

    // ── Init ──────────────────────────────────────────────────

    function init() {
        injectCSS();
        setupObserver();

        if (typeof ResizeObserver !== 'undefined') {
            const mapEl = document.getElementById('map');
            if (mapEl) new ResizeObserver(scheduleLayout).observe(mapEl);
        }
        window.addEventListener('resize', scheduleLayout);
        scheduleLayout();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ── Sidebar Menu Toggles: Sync and Active Class Styling ───────────────────────
(function () {
    'use strict';

    // Helper to update the .active class on a .toggle-row based on input checked status
    function updateRowActiveState(input) {
        const row = input.closest('.toggle-row');
        if (row) {
            if (input.checked) {
                row.classList.add('active');
            } else {
                row.classList.remove('active');
            }
        }
    }

    // Intercept programmatic checkbox .checked modifications to fire change events
    const originalCheckedDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
    if (originalCheckedDescriptor && originalCheckedDescriptor.set) {
        Object.defineProperty(HTMLInputElement.prototype, 'checked', {
            get: function() {
                return originalCheckedDescriptor.get.call(this);
            },
            set: function(val) {
                const oldVal = originalCheckedDescriptor.get.call(this);
                originalCheckedDescriptor.set.call(this, val);
                if (oldVal !== val && this.type === 'checkbox' && this.closest && this.closest('#menu')) {
                    this.dispatchEvent(new Event('change', { bubbles: true }));
                }
            },
            configurable: true,
            enumerable: true
        });
    }

    function initMenuToggles() {
        const menu = document.getElementById('menu');
        if (!menu) return;

        const checkboxes = menu.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            // Initial state sync on load
            updateRowActiveState(cb);

            // Update row active state on checkbox state change
            cb.addEventListener('change', function() {
                updateRowActiveState(cb);
            });
        });


    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMenuToggles);
    } else {
        initMenuToggles();
    }
})();

