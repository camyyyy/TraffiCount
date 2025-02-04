import { Users } from "lucide-react";
import { DashboardFilters } from "../filters/dashboard-filters";
import { DateRange } from "react-day-picker";

export function Header({ onDateChange, onRoomChange }) {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 mr-2" />
          <h1 className="text-lg font-medium">Dashboard Comptage Piétons</h1>
        </div>
        <DashboardFilters onDateChange={onDateChange} onRoomChange={onRoomChange} />
      </div>
    </header>
  );
}