
import React, { useEffect, useRef, useCallback } from 'react';
import L, { LatLngExpression } from 'leaflet';
import { Place, SupportPoint, SupportPointType } from '../types.ts';
import { Colors } from '../constants.ts';

interface MapViewProps {
  places?: Place[];
  supportPoints?: SupportPoint[];
  onSelectPlaceDetail: (place: Place) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const createPlaceIcon = (): L.Icon => {
    return new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const createSupportPointIcon = (type: SupportPointType): L.DivIcon => {
    const iconDiv = document.createElement('div');
    iconDiv.style.width = '32px';
    iconDiv.style.height = '32px';
    iconDiv.style.borderRadius = '50%';
    iconDiv.style.display = 'flex';
    iconDiv.style.alignItems = 'center';
    iconDiv.style.justifyContent = 'center';
    iconDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    iconDiv.style.border = '2px solid white';
    
    let SvgIcon = '';
    let bgColor = 'var(--color-text-secondary)';

    switch (type) {
        case 'hospital':
            bgColor = 'var(--color-accent-orange)';
            SvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>`;
            break;
        case 'police':
            bgColor = 'var(--color-primary)';
            SvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="white"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>`;
            break;
        case 'embassy':
            bgColor = 'var(--color-primary-dark)';
            SvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>`;
            break;
    }
    iconDiv.style.backgroundColor = bgColor;
    iconDiv.innerHTML = SvgIcon;
    
    return L.divIcon({
        html: iconDiv,
        className: '', 
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const createUserLocationIcon = (): L.DivIcon => {
    const iconDiv = document.createElement('div');
    iconDiv.innerHTML = `
        <div style="position: relative; width: 36px; height: 36px;">
            <div class="leaflet-pulsing-icon" style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: var(--color-primary-light); top: 0; left: 0;"></div>
            <div style="position: absolute; top: 9px; left: 9px; width: 18px; height: 18px; border-radius: 50%; background-color: var(--color-primary); border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>
        </div>
    `;
    return L.divIcon({
        html: iconDiv,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};

export const MapView: React.FC<MapViewProps> = ({ places = [], supportPoints = [], onSelectPlaceDetail, userLocation }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup>(L.layerGroup());

    const handleSelectPlace = useCallback((place: Place) => {
        onSelectPlaceDetail(place);
    }, [onSelectPlaceDetail]);

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current, {
                center: [37.7749, -122.4194], // Default SF
                zoom: 13,
                zoomControl: true,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapInstanceRef.current = map;
            markersRef.current.addTo(map);
            
             // Add event listeners to popups after they are added to the map
            map.on('popupopen', (e) => {
                const popupContent = e.popup.getContent();
                if (typeof popupContent === 'string' || popupContent instanceof HTMLElement) {
                    const tempDiv = document.createElement('div');
                    if (typeof popupContent === 'string') {
                        tempDiv.innerHTML = popupContent;
                    } else {
                        tempDiv.appendChild(popupContent.cloneNode(true));
                    }
                    const button = tempDiv.querySelector('.map-popup-button');
                    if (button && button.getAttribute('data-place-id')) {
                        const placeId = button.getAttribute('data-place-id');
                        const place = places.find(p => p.id === placeId);
                        if(place) {
                            button.addEventListener('click', () => handleSelectPlace(place));
                        }
                    }
                }
            });
        }
    }, [places, handleSelectPlace]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        markersRef.current.clearLayers();
        const bounds = L.latLngBounds([]);

        if (userLocation) {
            const userLatLng: LatLngExpression = [userLocation.latitude, userLocation.longitude];
            L.marker(userLatLng, { icon: createUserLocationIcon() }).addTo(markersRef.current);
            bounds.extend(userLatLng);
        }

        places.forEach(place => {
            if (place.geometry?.location) {
                const { lat, lng } = place.geometry.location;
                const placeLatLng: LatLngExpression = [lat, lng];
                
                const popupContent = `
                    <div class="info-window-content">
                        <h3>${place.name}</h3>
                        <p>${place.type}</p>
                        <button class="map-popup-button" data-place-id="${place.id}">View Details</button>
                    </div>`;

                L.marker(placeLatLng, { icon: createPlaceIcon() })
                    .bindPopup(popupContent)
                    .addTo(markersRef.current);
                bounds.extend(placeLatLng);
            }
        });
        
        supportPoints.forEach(point => {
            if (point.geometry?.location) {
                const { lat, lng } = point.geometry.location;
                const pointLatLng: LatLngExpression = [lat, lng];
                
                const popupContent = `
                    <div class="info-window-content">
                        <h3>${point.name}</h3>
                        <p style="text-transform: capitalize;">${point.type}</p>
                    </div>`;

                L.marker(pointLatLng, { icon: createSupportPointIcon(point.type) })
                    .bindPopup(popupContent)
                    .addTo(markersRef.current);
                bounds.extend(pointLatLng);
            }
        });


        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (userLocation) {
            map.setView([userLocation.latitude, userLocation.longitude], 13);
        }

    }, [places, supportPoints, userLocation]);

    return (
        <div 
            ref={mapRef} 
            className="w-full h-full rounded-xl shadow-md" 
            style={{
                border: `1px solid var(--color-card-border)`,
                backgroundColor: 'var(--color-input-background)',
            }}
            aria-label="Map view of places"
        ></div>
    );
};

export default MapView;