"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Info, Download } from "lucide-react"; // Importe l'icône Info et Download
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Importe le composant Tooltip de shadcn/ui
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importe le composant DropdownMenu
import jsPDF from "jspdf"; // Importe jsPDF pour générer des PDF
import "jspdf-autotable"; // Importe le plugin autotable pour jsPDF

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MonthlyData = {
  month: number; // Mois (1 à 12)
  visitors: number; // Nombre de visiteurs
  season: string; // Saison (Hiver, Printemps, Été, Automne)
};

const seasonColors = {
  winter: "hsl(var(--chart-1))", // Hiver
  spring: "hsl(var(--chart-2))", // Printemps
  summer: "hsl(var(--chart-3))", // Été
  autumn: "hsl(var(--chart-4))", // Automne
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded-lg shadow-sm">
        <p className="text-sm font-medium">Mois {data.month}</p>
        <p className="text-sm text-muted-foreground">
          {data.visitors.toLocaleString()} piétons
        </p>
        <p className="text-sm text-muted-foreground">
          Saison: {data.season}
        </p>
      </div>
    );
  }
  return null;
};

type SeasonalTrendProps = {
  selectedRoom?: string;
  fromDate?: Date;
  toDate?: Date;
};

export function SeasonalTrend({ selectedRoom = "18", fromDate = new Date(), toDate = new Date() }: SeasonalTrendProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("detections_suivi")
          .select("temps, nombre_personnes_image")
          .eq("id_lieu", selectedRoom)
          .gte("temps", fromDate.toISOString()) // Filtrer par date de début
          .lte("temps", toDate.toISOString()); // Filtrer par date de fin

        if (error) {
          throw error;
        }

        // Regrouper les données par minute et calculer la médiane
        const minuteInterval = 60 * 1000; // 1 minute en millisecondes
        const minuteMedians: Record<string, number[]> = {};

        data.forEach((entry) => {
          const timestamp = new Date(entry.temps).getTime();
          const minuteKey = Math.floor(timestamp / minuteInterval) * minuteInterval;

          if (!minuteMedians[minuteKey]) {
            minuteMedians[minuteKey] = [];
          }

          minuteMedians[minuteKey].push(entry.nombre_personnes_image || 0);
        });

        // Calculer la médiane pour chaque minute
        const minuteTotals: Record<string, number> = {};
        for (const minuteKey in minuteMedians) {
          const values = minuteMedians[minuteKey];
          const median = calculateMedian(values);
          minuteTotals[minuteKey] = median;
        }

        // Regrouper les données par mois
        const monthlyAggregation: Record<number, number> = {};
        for (const minuteKey in minuteTotals) {
          const month = new Date(Number(minuteKey)).getMonth() + 1; // Mois (1-12)
          const visitors = minuteTotals[minuteKey];

          if (!monthlyAggregation[month]) {
            monthlyAggregation[month] = 0;
          }
          monthlyAggregation[month] += visitors;
        }

        // Transformer les données en format MonthlyData
        const transformedData = Object.entries(monthlyAggregation).map(([month, visitors]) => ({
          month: parseInt(month, 10),
          visitors,
          season: getSeasonForMonth(parseInt(month, 10)), // Saison correspondante
        }));

        setMonthlyData(transformedData);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
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

  // Fonction pour obtenir la saison en fonction du mois
  const getSeasonForMonth = (month: number): string => {
    if (month >= 12 || month <= 2) return "Hiver";
    if (month >= 3 && month <= 5) return "Printemps";
    if (month >= 6 && month <= 8) return "Été";
    return "Automne";
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    const headers = ["Mois", "Piétons", "Saison"];
    const rows = monthlyData.map((data) => [
      data.month,
      data.visitors,
      data.season,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tendance_saisonniere.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour exporter les données en PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Tendance Saisonnière", 10, 10);

    const headers = [["Mois", "Piétons", "Saison"]];
    const rows = monthlyData.map((data) => [
      data.month,
      data.visitors,
      data.season,
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 20,
    });

    doc.save("tendance_saisonniere.pdf");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Variation de fréquentation saisonnière</CardTitle>
        <div className="flex items-center gap-2">
          {/* Menu déroulant pour le téléchargement */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>
                Télécharger en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                Télécharger en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Icône d'information avec une infobulle */}
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-[300px]">
                  Ce graphique montre la variation de fréquentation entre les saisons. Chaque point représente un mois, avec la couleur indiquant la saison.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {loading ? (
            <p>Chargement...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : monthlyData.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune donnée disponible dans cet intervalle et/ou ce lieu</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="month" 
                  name="Mois" 
                  domain={[1, 12]}
                  tickFormatter={(value) => {
                    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
                    return monthNames[value - 1];
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey="visitors" 
                  name="Visiteurs"
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {(Object.keys(seasonColors) as Array<keyof typeof seasonColors>).map((season) => (
                  <Scatter
                    key={season}
                    name={season === "winter" ? "Hiver" : 
                          season === "spring" ? "Printemps" : 
                          season === "summer" ? "Été" : "Automne"}
                    data={monthlyData.filter(data => data.season === (season === "winter" ? "Hiver" : 
                                                                     season === "spring" ? "Printemps" : 
                                                                     season === "summer" ? "Été" : "Automne"))}
                    fill={seasonColors[season]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}