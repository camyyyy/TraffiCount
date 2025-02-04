"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PedestrianBarChart } from "@/components/charts/pedestrian-bar-chart";
import { TopDaysTable } from "@/components/dashboard/top-days-table";
import { SeasonalTrend } from "@/components/charts/seasonal-trend";
import { Header } from "@/components/layout/header";
import { DateRange } from "react-day-picker";
import { LocationMap } from "@/components/maps/location-map";
import { Info, Download } from "lucide-react"; // Importe l'icône Download
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importe le composant DropdownMenu
import jsPDF from "jspdf"; // Importe jsPDF pour générer des PDF
import "jspdf-autotable"; // Importe le plugin autotable pour jsPDF

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [selectedRoom, setSelectedRoom] = useState("18");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fromDate = dateRange?.from ? new Date(dateRange.from) : new Date();
  const toDate = dateRange?.to ? new Date(dateRange.to) : new Date();

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    const headers = ["Heure", "Total visiteurs"];
    const rows = data.map((item) => [item.time, item.count.toString()]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "flux_pietons_par_heure.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour exporter les données en PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Flux Piétons par Heure", 10, 10);

    const headers = [["Heure", "Total visiteurs"]];
    const rows = data.map((item) => [item.time, item.count.toString()]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 20,
    });

    doc.save("flux_pietons_par_heure.pdf");
  };

  // Récupérer les données pour le graphe Flux Piétons par Heure
  // Récupérer les données pour le graphe Flux Piétons par Heure
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: fetchedData, error } = await supabase
        .from("detections_suivi")
        .select("temps, nombre_personnes_ligne_in, nombre_personnes_ligne_out")
        // Filtrer par salle (id_lieu) et par date (temps)
        .eq("id_lieu", selectedRoom)
        .gte("temps", fromDate.toISOString())
        .lte("temps", toDate.toISOString());

      if (error) {
        throw error;
      }

      const hourlyData: Record<string, number> = {};
      fetchedData.forEach((entry) => {
        const hour = new Date(entry.temps).getHours();
        const hourLabel = `${hour.toString().padStart(2, "0")}:00`;

        if (!hourlyData[hourLabel]) {
          hourlyData[hourLabel] = 0;
        }

        hourlyData[hourLabel] += entry.nombre_personnes_ligne_in + entry.nombre_personnes_ligne_out;
      });

      const formattedData = Object.entries(hourlyData)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => a.time.localeCompare(b.time));

      setData(formattedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [selectedRoom, dateRange]);


  useEffect(() => {
    console.log("Selected Room in Home:", selectedRoom);
    console.log("Date Range in Home:", dateRange);
  }, [selectedRoom, dateRange]);

  return (
    <div>
      <Header onDateChange={setDateRange} onRoomChange={setSelectedRoom} />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <StatsCards selectedRoom={selectedRoom} fromDate={fromDate} toDate={toDate} />
        <Tabs defaultValue="overview" className="space-y-4">
          

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Graphe Flux Piétons par Heure */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Flux Piétons par Heure</CardTitle>
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
                            Ce graphique montre le flux global de piétons par heure dans la salle sélectionnée, en fonction de la période choisie. Les données sont agrégées par heure et représentent la somme des entrées et des sorties de piétons.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {loading ? (
                        <p>Chargement...</p>
                      ) : error ? (
                        <p className="text-red-500">{error}</p>
                      ) : data.length === 0 ? (
                        <p className="text-center text-muted-foreground">Aucune donnée disponible dans cet intervalle et/ou ce lieu</p>
                      ) : (
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Passer les props à TopDaysTable */}
              <TopDaysTable idLieu={selectedRoom} fromDate={fromDate} toDate={toDate} />

              {/* Passer les props à PedestrianBarChart */}
              <PedestrianBarChart className="md:col-span-2" selectedRoom={selectedRoom} dateRange={dateRange} />

              {/* Passer les props à SeasonalTrend */}
              <SeasonalTrend className="md:col-span-2" selectedRoom={selectedRoom} fromDate={fromDate} toDate={toDate} />
              <LocationMap className="md:col-span-2" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}