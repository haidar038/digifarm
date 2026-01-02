import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapSelectorProps {
    latitude?: number;
    longitude?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export function MapSelector({ latitude, longitude, onLocationSelect }: MapSelectorProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    // Store the callback in a ref so the click handler always uses the latest version
    const onLocationSelectRef = useRef(onLocationSelect);

    // Keep the ref updated with the latest callback
    useEffect(() => {
        onLocationSelectRef.current = onLocationSelect;
    }, [onLocationSelect]);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Capture initial values for map initialization only
        const initialLat = latitude ?? 0.8031611848336926;
        const initialLng = longitude ?? 127.33806610107423;

        const map = L.map(mapRef.current).setView([initialLat, initialLng], 10);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Add initial marker if coordinates exist
        if (latitude && longitude) {
            markerRef.current = L.marker([latitude, longitude]).addTo(map);
        }

        // Handle map click - use ref to always get the latest callback
        map.on("click", (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;

            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }

            onLocationSelectRef.current(lat, lng);
        });

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update marker when coordinates change from form input
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        if (latitude && longitude) {
            if (markerRef.current) {
                markerRef.current.setLatLng([latitude, longitude]);
            } else {
                markerRef.current = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
            }
            mapInstanceRef.current.setView([latitude, longitude], 13);
        }
    }, [latitude, longitude]);

    return <div ref={mapRef} className="h-[250px] w-full rounded-lg border border-border overflow-hidden" style={{ zIndex: 0 }} />;
}
