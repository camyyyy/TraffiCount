// lib/api.ts

import { supabase } from "@/utils/supabase/client";
import { DailyData, MonthlyData } from "@/types/types"; // Importez les types définis

export async function fetchPedestrianData(idLieu: string, fromDate: Date, toDate: Date) {
  const { data, error } = await supabase
    .from("detections_suivi")
    .select("temps, nombre_personnes_image")
    .eq("id_lieu", idLieu)
    .gte("temps", fromDate.toISOString())
    .lte("temps", toDate.toISOString());

  if (error) {
    throw error;
  }

  // Traitez les données pour obtenir les statistiques quotidiennes et mensuelles
  const dailyData = processDailyData(data);
  const monthlyData = processMonthlyData(data);

  return { daily: dailyData, monthly: monthlyData };
}

function processDailyData(data: any[]): Record<string, number> {
  const minuteInterval = 60 * 1000; // 1 minute en millisecondes
  const minuteMedians: Record<string, number[]> = {};

  // Regrouper les données par minute et calculer la médiane pour chaque minute
  data.forEach((entry) => {
    const timestamp = new Date(entry.temps).getTime();
    const minuteKey = Math.floor(timestamp / minuteInterval) * minuteInterval;

    if (!minuteMedians[minuteKey]) {
      minuteMedians[minuteKey] = [];
    }

    minuteMedians[minuteKey].push(entry.nombre_personnes_image);
  });

  const dailyTotals: Record<string, number> = {};

  // Calculer la médiane pour chaque minute et agréger par jour
  for (const minuteKey in minuteMedians) {
    const values = minuteMedians[minuteKey];
    const median = calculateMedian(values);
    const dateKey = new Date(Number(minuteKey)).toISOString().split('T')[0];

    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = 0;
    }

    dailyTotals[dateKey] += median;
  }

  return dailyTotals;
}

function processMonthlyData(data: any[]): Record<string, number> {
  const minuteInterval = 60 * 1000; // 1 minute en millisecondes
  const minuteMedians: Record<string, number[]> = {};

  // Regrouper les données par minute et calculer la médiane pour chaque minute
  data.forEach((entry) => {
    const timestamp = new Date(entry.temps).getTime();
    const minuteKey = Math.floor(timestamp / minuteInterval) * minuteInterval;

    if (!minuteMedians[minuteKey]) {
      minuteMedians[minuteKey] = [];
    }

    minuteMedians[minuteKey].push(entry.nombre_personnes_image);
  });

  const monthlyTotals: Record<string, number> = {};

  // Calculer la médiane pour chaque minute et agréger par mois
  for (const minuteKey in minuteMedians) {
    const values = minuteMedians[minuteKey];
    const median = calculateMedian(values);
    const monthKey = new Date(Number(minuteKey)).toISOString().slice(0, 7);

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = 0;
    }

    monthlyTotals[monthKey] += median;
  }

  return monthlyTotals;
}

function calculateMedian(values: number[]): number {
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);

  if (values.length % 2 === 0) {
    return (values[mid - 1] + values[mid]) / 2;
  } else {
    return values[mid];
  }
}