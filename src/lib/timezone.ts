/**
 * Timezone utilities for Brazil (America/Sao_Paulo)
 * All database timestamps are stored in UTC.
 * These utilities help convert and display dates in the correct local timezone.
 */

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

/**
 * Get today's date string in Brazil timezone (YYYY-MM-DD)
 */
export function getTodayInBrazil(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: BRAZIL_TIMEZONE });
}

/**
 * Get the start of today in Brazil timezone as UTC Date
 */
export function getTodayStartUTC(): Date {
  const todayStr = getTodayInBrazil();
  // Parse as Brazil timezone and convert to UTC
  const brazilDate = new Date(`${todayStr}T00:00:00`);
  
  // Get the offset for Brazil timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIMEZONE,
    timeZoneName: "shortOffset",
  });
  
  // Brazil is typically UTC-3 (can be UTC-2 during DST historically, but DST was abolished)
  // Use a more reliable method: create date in Brazil and get its UTC equivalent
  const parts = formatter.formatToParts(brazilDate);
  const offsetPart = parts.find(p => p.type === "timeZoneName");
  const offsetStr = offsetPart?.value || "GMT-3";
  
  // Parse offset like "GMT-3" or "GMT-03:00"
  const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  let offsetMinutes = -180; // Default to -3 hours (Brazil standard)
  
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] || "0", 10);
    offsetMinutes = sign * (hours * 60 + minutes);
  }
  
  // Start of day in Brazil, converted to UTC
  const startOfDayBrazil = new Date(`${todayStr}T00:00:00.000Z`);
  return new Date(startOfDayBrazil.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Get the end of today in Brazil timezone as UTC Date
 */
export function getTodayEndUTC(): Date {
  const todayStr = getTodayInBrazil();
  const startUTC = getTodayStartUTC();
  // End of day is start of day + 24 hours - 1 millisecond
  return new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Get the start of a month in Brazil timezone as UTC Date
 */
export function getMonthStartUTC(date: Date): Date {
  const brazilDate = formatDateInBrazil(date);
  const [year, month] = brazilDate.split("-").map(Number);
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  
  // Get Brazil offset
  const offsetMinutes = getBrazilOffsetMinutes();
  const startOfMonth = new Date(`${firstDay}T00:00:00.000Z`);
  return new Date(startOfMonth.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Get the end of a month in Brazil timezone as UTC Date
 */
export function getMonthEndUTC(date: Date): Date {
  const brazilDate = formatDateInBrazil(date);
  const [year, month] = brazilDate.split("-").map(Number);
  
  // Get last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  
  // Get Brazil offset
  const offsetMinutes = getBrazilOffsetMinutes();
  const endOfMonth = new Date(`${lastDayStr}T23:59:59.999Z`);
  return new Date(endOfMonth.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Get Brazil timezone offset in minutes
 */
function getBrazilOffsetMinutes(): number {
  // Brazil Standard Time is UTC-3
  // DST was abolished in 2019, so it's always -3
  return -180; // -3 hours in minutes
}

/**
 * Format a UTC date to YYYY-MM-DD in Brazil timezone
 */
export function formatDateInBrazil(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: BRAZIL_TIMEZONE });
}

/**
 * Format a UTC date to HH:MM in Brazil timezone
 */
export function formatTimeInBrazil(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a UTC date to a full datetime string in Brazil timezone
 */
export function formatDateTimeInBrazil(date: Date): { date: string; time: string } {
  return {
    date: formatDateInBrazil(date),
    time: formatTimeInBrazil(date),
  };
}

/**
 * Check if a UTC timestamp is "today" in Brazil timezone
 */
export function isToday(utcTimestamp: string): boolean {
  const date = new Date(utcTimestamp);
  const dateInBrazil = formatDateInBrazil(date);
  const todayInBrazil = getTodayInBrazil();
  return dateInBrazil === todayInBrazil;
}

/**
 * Get date range for a specific day in Brazil timezone (returns UTC dates for querying)
 */
export function getDayRangeUTC(dateStr: string): { start: Date; end: Date } {
  const offsetMinutes = getBrazilOffsetMinutes();
  
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
  
  return {
    start: new Date(startOfDay.getTime() - offsetMinutes * 60 * 1000),
    end: new Date(endOfDay.getTime() - offsetMinutes * 60 * 1000),
  };
}
