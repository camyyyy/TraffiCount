"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DateRange } from "react-day-picker";
import { fetchPedestrianData } from "@/lib/api";
import { DailyData, MonthlyData } from "@/types/types";
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

export function PedestrianBarChart({ selectedRoom, dateRange }) {
  const from = dateRange?.from;
  const to = dateRange?.to;
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRoom && from && to) {
      setLoading(true);
      setError(null);

      fetchPedestrianData(selectedRoom, from, to)
        .then(({ daily, monthly }) => {
          setDailyData(Object.entries(daily).map(([day, count]) => ({ day, count })));
          setMonthlyData(Object.entries(monthly).map(([month, count]) => ({ month, count })));
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedRoom, from, to]);

  // Fonction pour exporter les données en CSV
  const exportToCSV = (data: { day?: string; month?: string; count: number }[], type: "daily" | "monthly") => {
    const headers = type === "daily" ? ["Jour", "Total visiteurs"] : ["Mois", "Total visiteurs"];
    const rows = data.map((item) => [
      item.day || item.month,
      item.count.toString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `frequentation_${type}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour exporter les données en PDF
  const exportToPDF = (data: { day?: string; month?: string; count: number }[], type: "daily" | "monthly") => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Fréquentation par ${type === "daily" ? "jour" : "mois"}`, 10, 10);

    const headers = [type === "daily" ? "Jour" : "Mois", "Total visiteurs"];
    const rows = data.map((item) => [item.day || item.month, item.count.toString()]);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 20,
    });

    doc.save(`frequentation_${type}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fréquentation par période</CardTitle>
        <div className="flex items-center gap-2">
          {/* Menu déroulant pour le téléchargement */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportToCSV(dailyData, "daily")}>
                Télécharger les données quotidiennes en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(dailyData, "daily")}>
                Télécharger les données quotidiennes en PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV(monthlyData, "monthly")}>
                Télécharger les données mensuelles en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(monthlyData, "monthly")}>
                Télécharger les données mensuelles en PDF
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
                  Ce graphique montre la fréquentation par période (jour ou mois). Les données sont calculées en fonction de la salle et de la plage de dates sélectionnées.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (!from || !to) ? (
          <p className="text-center text-muted-foreground">Sélectionnez une période</p>
        ) : dailyData.length === 0 && monthlyData.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucune donnée disponible dans cet intervalle et/ou ce lieu</p>
        ) : (
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daily">Par jour</TabsTrigger>
              <TabsTrigger value="monthly">Par mois</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {dailyData.length === 0 ? (
                    <p className="text-center text-muted-foreground">Aucune donnée disponible pour cette période</p>
                  ) : (
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(value) => `${value}`} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {monthlyData.length === 0 ? (
                    <p className="text-center text-muted-foreground">Aucune donnée disponible pour cette période</p>
                  ) : (
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value}`} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}