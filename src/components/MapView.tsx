import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { LatLng, LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from "react-leaflet";

const MapView: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<LatLng | null>(null);
  const [isInsidePerimeter, setIsInsidePerimeter] = useState<boolean>(false);
  const [closestPerimeter, setClosestPerimeter] = useState<number | null>(null);

  // Definimos los 6 perímetros con sus coordenadas para el ejercicio
  const perimeters: { id: number; center: LatLngExpression }[] = [
    { id: 1, center: [-2.168931, -79.897686] },
    { id: 2, center: [-2.167931, -79.896686] },
    { id: 3, center: [-2.170000, -79.895500] },
    { id: 4, center: [-2.169500, -79.898000] },
    { id: 5, center: [-2.168000, -79.899000] },
    { id: 6, center: [-2.167500, -79.897000] },
  ];

  const radius = 50; // Radio en metros del perímetro

  useEffect(() => {
    if (selectedPosition) {
      checkIfInsidePerimeter(selectedPosition);
    }
  }, [selectedPosition]);

  // Función para calcular la distancia entre dos puntos (Haversine)
  const distance = (point1: LatLng, point2: LatLng): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const lat1 = point1.lat * (Math.PI / 180);
    const lat2 = point2.lat * (Math.PI / 180);
    const deltaLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const deltaLng = (point2.lng - point1.lng) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkIfInsidePerimeter = (clickedPoint: LatLng) => {
    let found = false;
    let closest = null;
    let minDistance = Infinity;

    perimeters.forEach((perimeter) => {
      const centerPoint = Array.isArray(perimeter.center)
        ? new LatLng(perimeter.center[0], perimeter.center[1])
        : perimeter.center as LatLng;
      const dist = distance(clickedPoint, centerPoint);

      if (dist <= radius) {
        found = true;
        closest = perimeter.id;
      }

      if (dist < minDistance) {
        minDistance = dist;
        closest = perimeter.id;
      }
    });

    setIsInsidePerimeter(found);
    setClosestPerimeter(found ? closest : null);
  };

  return (
    <MapContainer center={[-2.168931, -79.897686]} zoom={16} style={{ width: "100%", height: "800px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 📌 Captura de clics en el mapa */}
      <MapClickHandler onLocationSelect={setSelectedPosition} />

      {/* Dibujar los 6 perímetros visibles, esto es opcional, solo para ele ejercicio */}
      {perimeters.map((perimeter) => (
        <Circle
          key={perimeter.id}
          center={perimeter.center}
          radius={radius}
          pathOptions={{ color: "blue", fillOpacity: 0.2 }}
        />
      ))}

      {/* Mostrar marcador y mensaje de proximidad */}
      {selectedPosition && (
        <Marker position={selectedPosition as LatLngExpression}>
          <Popup>
            📍 Coordenadas seleccionadas: <br />
            <b>Lat:</b> {selectedPosition.lat.toFixed(6)} <br />
            <b>Lng:</b> {selectedPosition.lng.toFixed(6)} <br />
            <b>
              {isInsidePerimeter
                ? `✅ Dentro del perímetro ${closestPerimeter}`
                : "❌ Fuera de todos los perímetros"}
            </b>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;

// Componente para capturar clics en el mapa
interface MapClickHandlerProps {
  onLocationSelect: (latlng: LatLng) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });

  return null;
};
