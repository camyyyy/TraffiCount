"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ date, setDateRange }: DateRangePickerProps) {
  const [localDate, setLocalDate] = useState<DateRange | undefined>(date);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {localDate?.from && localDate?.to
            ? `${localDate.from.toLocaleDateString()} - ${localDate.to.toLocaleDateString()}`
            : "Sélectionnez une période"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={localDate}
          onSelect={(newDate) => {
            setLocalDate(newDate);
            setDateRange(newDate); // Met à jour l'état global
          }}
          numberOfMonths={2}
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}
