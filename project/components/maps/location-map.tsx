"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import L from "leaflet";
import { Info } from "lucide-react"; // Importe l'icône Info
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Importe le composant Tooltip de shadcn/ui

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Définir un icône personnalisé pour les marqueurs
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41], // Taille de l'icône
  iconAnchor: [12, 41], // Point d'ancrage de l'icône
});

type Lieu = {
  id_lieu: string;
  nom_lieu: string;
  longitude: number;
  latitude: number;
};

// Composant pour ajuster la vue de la carte en fonction des lieux
function SetMapBounds({ lieux }: { lieux: Lieu[] }) {
  const map = useMap();

  useEffect(() => {
    if (lieux.length > 0) {
      // Calculer les bornes de la carte en fonction des lieux
      const bounds = L.latLngBounds(
        lieux.map((lieu) => [lieu.latitude, lieu.longitude])
      );
      map.fitBounds(bounds); // Ajuster la vue de la carte pour inclure tous les lieux
    }
  }, [lieux, map]);

  return null;
}

export function LocationMap() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les données des lieux depuis Supabase
  useEffect(() => {
    const fetchLieux = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("lieux")
          .select("id_lieu, nom_lieu, longitude, latitude");

        if (error) {
          throw error;
        }

        setLieux(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLieux();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Localisation des Lieux</CardTitle>
        {/* Ajoute l'icône d'information avec une infobulle */}
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm max-w-[300px]">
                Cette carte affiche les lieux où ont été faits les essais
              </p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : lieux.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucun lieu disponible</p>
        ) : (
          <div className="h-[400px]">
            <MapContainer
              center={[48.8566, 2.3522]} // Centre par défaut (Paris)
              zoom={13} // Niveau de zoom par défaut
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {lieux.map((lieu) => (
                <Marker
                  key={lieu.id_lieu}
                  position={[lieu.latitude, lieu.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <strong>{lieu.nom_lieu}</strong>
                  </Popup>
                </Marker>
              ))}
              {/* Ajuster la vue de la carte en fonction des lieux */}
              <SetMapBounds lieux={lieux} />
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}