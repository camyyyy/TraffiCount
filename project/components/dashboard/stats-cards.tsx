"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye } from "lucide-react";

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StatsCardsProps = {
  selectedRoom: string;
  fromDate: Date;
  toDate: Date;
};

export function StatsCards({ selectedRoom, fromDate, toDate }: StatsCardsProps) {
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [totalPeople, setTotalPeople] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("detections_suivi")
        .select("temps, nombre_personnes_ligne_in, nombre_personnes_ligne_out, nombre_personnes_image")
        .eq("id_lieu", selectedRoom)
        .gte("temps", fromDate.toISOString())
        .lte("temps", toDate.toISOString());

      if (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } else {
        // Calcul des totaux entrants et sortants (inchangé)
        const totalInSum = data.reduce((sum, row) => sum + (row.nombre_personnes_ligne_in || 0), 0);
        const totalOutSum = data.reduce((sum, row) => sum + (row.nombre_personnes_ligne_out || 0), 0);

        // Calcul du total des personnes détectées avec la médiane par minute
        const minuteInterval = 60 * 1000; // 1 minute en millisecondes
        const minuteMedians: Record<string, number[]> = {};

        // Regrouper les données par minute
        data.forEach((entry) => {
          const timestamp = new Date(entry.temps).getTime();
          const minuteKey = Math.floor(timestamp / minuteInterval) * minuteInterval;

          if (!minuteMedians[minuteKey]) {
            minuteMedians[minuteKey] = [];
          }

          minuteMedians[minuteKey].push(entry.nombre_personnes_image || 0);
        });

        // Calculer la médiane pour chaque minute et les sommer
        let totalPeopleSum = 0;
        for (const minuteKey in minuteMedians) {
          const values = minuteMedians[minuteKey];
          const median = calculateMedian(values);
          totalPeopleSum += median;
        }

        setTotalIn(totalInSum);
        setTotalOut(totalOutSum);
        setTotalPeople(Math.round(totalPeopleSum)); // Arrondir le total
      }
    };

    fetchData();
  }, [selectedRoom, fromDate, toDate]);

  // Fonction pour calculer la médiane
  const calculateMedian = (values: number[]): number => {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    if (values.length % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    } else {
      return values[mid];
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Piétons Entrants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalIn}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Piétons Sortants</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOut}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Piétons Détectées</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPeople}</div>
        </CardContent>
      </Card>
    </div>
  );
}