export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const MONTH_SHORT_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Formats an ISO date string or Date into a user-friendly date label:
 * - "Today" for dates on the current local calendar day
 * - "Yesterday" for dates on the previous local calendar day
 * - "D MMM YYYY" (e.g. "24 Sep 2026") for all other dates
 */
export function formatDateLabel(dateInput: string | Date): string {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "";

    const now = new Date();

    const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

    if (isToday) return "Today";

    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Yesterday";

    return `${d.getDate()} ${MONTH_SHORT_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats an ISO date string or Date into a localized time string (e.g. "02:30 PM").
 */
export function formatTime(dateInput: string | Date): string {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats an ISO date string or Date into a combined friendly date + time (e.g. "Today • 02:30 PM").
 */
export function formatDateTime(dateInput: string | Date): string {
    if (!dateInput) return "";
    const label = formatDateLabel(dateInput);
    const time = formatTime(dateInput);
    return time ? `${label} • ${time}` : label;
}
