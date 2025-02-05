import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { LatLng, LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from "react-leaflet";

const API_URL = "http://localhost:8080/api/locations";

const MapView: React.FC = () => {
  const [locations, setLocations] = useState<{ id: number; name: string; radius: number; center: LatLngExpression }[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<LatLng | null>(null);
  const [isInsidePerimeter, setIsInsidePerimeter] = useState<boolean>(false);
  const [closestPerimeter, setClosestPerimeter] = useState<string>("");

  // Cargar datos desde la API
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const newLocations = data.features.map((feature: any, index: number) => ({
          id: feature.properties.id || index + 1,
          name: feature.properties.name,
          center: feature.geometry.coordinates.reverse() as LatLngExpression, // Leaflet usa [lat, lng]
          radius: feature.properties.radius_perimeter || 50,
        }));
        setLocations(newLocations);
      })
      .catch((error) => console.error("Error cargando las ubicaciones:", error));
  }, []);

  useEffect(() => {
    if (selectedPosition) {
      checkIfInsidePerimeter(selectedPosition);
    }
  }, [selectedPosition]);

  // Función para calcular la distancia entre dos puntos (Haversine)
  // https://medium.com/@nakul5harma/distance-between-two-coordinates-using-haversine-formula-272325ec8e9a
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
    let closestName = "";
    let minDistance = Infinity;

    locations.forEach((perimeter) => {
      const centerPoint = Array.isArray(perimeter.center)
        ? new LatLng(perimeter.center[0], perimeter.center[1])
        : perimeter.center as LatLng;
      const dist = distance(clickedPoint, centerPoint);

      if (dist <= perimeter.radius) {
        found = true;
        closestName = perimeter.name;
      }

      if (dist < minDistance) {
        minDistance = dist;
        closestName = perimeter.name; // Actualizamos con el nombre más cercano
      }
    });

    setIsInsidePerimeter(found);
    setClosestPerimeter(found ? closestName : "");
  };


  return (
    <MapContainer center={[-2.168931, -79.897686]} zoom={16} style={{ width: "100%", height: "800px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 📌 Captura de clics en el mapa */}
      <MapClickHandler onLocationSelect={setSelectedPosition} />

      {/* Dibujar los 6 perímetros visibles, esto es opcional, solo para el ejercicio */}
      {locations.map((perimeter) => (
        <Circle
          key={perimeter.id}
          center={perimeter.center}
          radius={perimeter.radius}
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
                ? `✅ Dentro del perímetro de ${closestPerimeter}`
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
