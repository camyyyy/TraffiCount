"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Room {
  id_lieu: string; // ID de la salle
  nom_lieu: string; // Nom de la salle
}

interface RoomSelectorProps {
  onRoomChange: (roomId: string) => void;
}

export function RoomSelector({ onRoomChange }: RoomSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([]); // État pour stocker les salles
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [error, setError] = useState<string | null>(null); // État pour gérer les erreurs
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null); // État pour la salle sélectionnée

  // Récupérer les salles depuis Supabase
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les données de la table "lieux"
        const { data, error } = await supabase
          .from("lieux")
          .select("id_lieu, nom_lieu");

        if (error) {
          throw error;
        }

        // Mettre à jour l'état avec les salles récupérées
        setRooms(data || []);

        // Sélectionner la première salle par défaut
        if (data && data.length > 0) {
          const firstRoomId = data[0].id_lieu;
          setSelectedRoom(firstRoomId); // Mettre à jour l'état de la salle sélectionnée
          onRoomChange(firstRoomId); // Appeler la fonction onRoomChange avec la première salle
        }
      } catch (err: any) {
        console.error("Erreur lors de la récupération des salles :", err);
        setError("Erreur lors du chargement des salles");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [onRoomChange]);

  // Gérer le changement de salle par l'utilisateur
  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId); // Mettre à jour l'état de la salle sélectionnée
    onRoomChange(roomId); // Appeler la fonction onRoomChange avec la nouvelle salle
  };

  return (
    <Select value={selectedRoom || undefined} onValueChange={handleRoomChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Sélectionner une salle" />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <SelectItem value="loading" disabled>
            Chargement...
          </SelectItem>
        ) : error ? (
          <SelectItem value="error" disabled>
            Erreur de chargement
          </SelectItem>
        ) : rooms.length === 0 ? (
          <SelectItem value="no-data" disabled>
            Aucune salle disponible
          </SelectItem>
        ) : (
          rooms.map((room) => (
            <SelectItem key={room.id_lieu} value={room.id_lieu}>
              {room.nom_lieu}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}