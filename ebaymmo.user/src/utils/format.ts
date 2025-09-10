/**
 * Format a date for PostgreSQL/Hasura timestamptz format.
 * @param date The date to format.
 * @returns Formatted date string in PostgreSQL format (YYYY-MM-DD HH:MM:SS+TZ).
 */
export function formatDateForPostgres(date: Date): string {
    // Format: YYYY-MM-DD HH:MM:SS+TZ (ví dụ: 2023-05-19 10:30:00+00)
    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1); // getMonth returns 0-11
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+00`;
}

/**
 * Format a date for display.
 * @param date The date to format.
 * @param format The format string (default: DD/MM/YYYY).
 * @returns Formatted date string.
 */
export function formatDate(
    date?: Date | null,
    format: string = 'DD/MM/YYYY'
): string {
    if (!date) return 'N/A';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    // Basic implementation for the default format
    if (format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
    }

    // For other formats, you could implement a more sophisticated solution
    // or use a library like dayjs
    return `${day}/${month}/${year}`;
}
