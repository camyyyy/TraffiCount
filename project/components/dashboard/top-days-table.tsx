import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { fetchPedestrianData } from "@/lib/api";
import { Info, Download } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importe le composant DropdownMenu

type TopDay = {
  date: Date;
  total: number;
};

export function TopDaysTable({ idLieu = "18", fromDate = new Date(), toDate = new Date() }: { idLieu?: string; fromDate?: Date; toDate?: Date }) {
  const [topDays, setTopDays] = useState<TopDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const { daily } = await fetchPedestrianData(idLieu, fromDate, toDate);

        const days: TopDay[] = Object.entries(daily).map(([dateKey, total]) => ({
          date: new Date(dateKey),
          total: Math.round(total),
        }));

        days.sort((a, b) => b.total - a.total);
        const top5Days = days.slice(0, 5);
        setTopDays(top5Days);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [idLieu, fromDate, toDate]);

  const exportToCSV = () => {
    const headers = ["Date", "Total piétons"];
    const rows = topDays.map((day) => [
      format(day.date, "dd/MM/yyyy"),
      day.total.toString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "top_5_jours.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Top 5 Jours plus fréquentés", 10, 10);

    const headers = [["Date", "Total piétons"]];
    const data = topDays.map((day) => [
      format(day.date, "dd/MM/yyyy"),
      day.total.toString(),
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 20,
    });

    doc.save("top_5_jours.pdf");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top 5 Jours plus fréquentés</CardTitle>
        <div className="flex items-center gap-2">
          {/* Menu déroulant pour le téléchargement */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>Télécharger en CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>Télécharger en PDF</DropdownMenuItem>
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
                  Ce tableau affiche les 5 jours les plus fréquentés dans la salle sélectionnée, en fonction de la période choisie. Les données sont calculées en utilisant la médiane du nombre de piétons détectées par minute, puis en sommant ces médianes par jour.
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
        ) : topDays.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucune donnée disponible dans cet intervalle et/ou ce lieu</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total piétons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDays.map((day) => (
                <TableRow key={day.date.toISOString()}>
                  <TableCell className="font-medium">
                    {format(day.date, "dd MMMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    {day.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}