import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Ground } from '../types/index.ts';
import { determineEffectiveStatus } from '../utils/statusUtils.ts';

interface MapViewProps {
  grounds: Ground[];
  selectedGroundId?: string | null;
  onSelectGround: (groundId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocateMe?: () => void;
  locationError?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  grounds,
  selectedGroundId,
  onSelectGround,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default Stanford campus area or configured coordinates
    const defaultLat = parseFloat(import.meta.env.VITE_CAMPUS_DEFAULT_LAT || '37.4275');
    const defaultLng = parseFloat(import.meta.env.VITE_CAMPUS_DEFAULT_LNG || '-122.1697');
    const defaultZoom = parseInt(import.meta.env.VITE_CAMPUS_DEFAULT_ZOOM || '15', 10);

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when grounds or selectedGroundId change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const now = new Date();
    const bounds: L.LatLngExpression[] = [];

    grounds.forEach((ground) => {
      // Do not fabricate markers if coordinates are missing!
      if (ground.latitude === null || ground.longitude === null) {
        return;
      }

      const eff = determineEffectiveStatus(ground.latest_report, now);
      const isSelected = ground.id === selectedGroundId;

      // Status-specific marker styling
      let bgClass = 'bg-[#12432C] border-[#10B981]'; // Forest green / Available
      let statusDot = '#10B981';
      let statusTextColor = '#065F46';

      if (eff.effectiveStatus === 'Occupied') {
        bgClass = 'bg-[#7F1D1D] border-[#EF4444]'; // Deep crimson / Occupied
        statusDot = '#EF4444';
        statusTextColor = '#991B1B';
      } else if (eff.effectiveStatus === 'Unknown') {
        bgClass = 'bg-[#374151] border-[#9CA3AF]'; // Slate / Unknown
        statusDot = '#9CA3AF';
        statusTextColor = '#4B5563';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center transform transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }">
          <div class="w-8 h-8 rounded-full ${bgClass} border-2 shadow-lg flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m-4-4h8" />
            </svg>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${bgClass} border-r border-b"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-ground-marker',
        html: iconHtml,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([ground.latitude, ground.longitude], {
        icon: customIcon,
        title: ground.name,
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-sm';
      popupContent.innerHTML = `
        <div class="font-bold text-stone-900 leading-snug mb-1">${ground.name}</div>
        <div class="flex items-center gap-1.5 text-xs mb-2">
          <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${statusDot}"></span>
          <span class="font-semibold" style="color: ${statusTextColor}">${eff.displayStatus}</span>
        </div>
        ${
          ground.supported_sports.length > 0
            ? `<div class="text-[11px] text-stone-500 mb-2 truncate">${ground.supported_sports.join(', ')}</div>`
            : ''
        }
        <button id="view-ground-btn-${ground.id}" class="w-full py-1.5 px-3 bg-[#133E2B] text-white text-xs font-semibold rounded hover:bg-[#0D2B1E] transition-colors cursor-pointer">
          View Ground Details
        </button>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-ground-btn-${ground.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectGround(ground.id);
            marker.closePopup();
          };
        }
      });

      marker.addTo(map);
      markersRef.current.set(ground.id, marker);
      bounds.push([ground.latitude, ground.longitude]);
    });

    // If a ground is specifically selected, center on it
    if (selectedGroundId && markersRef.current.has(selectedGroundId)) {
      const selectedMarker = markersRef.current.get(selectedGroundId)!;
      map.panTo(selectedMarker.getLatLng(), { animate: true });
      selectedMarker.openPopup();
    }
  }, [grounds, selectedGroundId, onSelectGround]);

  // Update user location marker if granted
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          title: 'Your Location',
        });
        marker.bindPopup('<div class="text-xs font-semibold p-1">Your Current Location</div>');
        marker.addTo(map);
        userMarkerRef.current = marker;
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-0" />
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-stone-200 text-xs flex flex-wrap items-center gap-3">
        <span className="font-semibold text-stone-700">Map Legend:</span>
        <span className="flex items-center gap-1.5 text-stone-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Available
        </span>
        <span className="flex items-center gap-1.5 text-stone-600">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Occupied
        </span>
        <span className="flex items-center gap-1.5 text-stone-600">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-500"></span> Unknown / Stale
        </span>
      </div>
    </div>
  );
};
