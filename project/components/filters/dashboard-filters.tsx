"use client";

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./date-range-picker";
import { RoomSelector } from "./room-selector";

interface DashboardFiltersProps {
  onDateChange: (range: DateRange | undefined) => void; // Assure-toi que cette ligne est présente
  onRoomChange: (roomId: string) => void;
}

export function DashboardFilters({ onDateChange, onRoomChange }: DashboardFiltersProps) {
  // Définir une période par défaut (aujourd'hui)
  const defaultDateRange: DateRange = {
    from: new Date(), // Aujourd'hui
    to: new Date(), // Aujourd'hui
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);

  // Informer le parent de la période par défaut dès le chargement
  useEffect(() => {
    if (onDateChange) { // Vérifie que onDateChange est bien une fonction
      onDateChange(defaultDateRange);
    }
  }, [onDateChange]); // Exécuté une seule fois au montage

  return (
    <div className="flex gap-4 items-center">
      <DateRangePicker
        date={dateRange}
        setDateRange={(newRange) => {
          setDateRange(newRange);
          if (onDateChange) { // Vérifie que onDateChange est bien une fonction
            onDateChange(newRange); // Propager la nouvelle plage de dates au parent
          }
        }}
      />
      <RoomSelector onRoomChange={onRoomChange} />
    </div>
  );
}