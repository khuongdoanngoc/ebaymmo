import dayjs from 'dayjs';

/**
 * A utility function to format dates using dayjs.
 * @param date - The date to format.
 * @param format - The format string (optional, default: 'YYYY-MM-DD').
 * @returns The formatted date as a string.
 */
export function formatDate(
    date: string | Date,
    format: string = 'YYYY-MM-DD'
): string {
    return dayjs(date).format(format);
}

export function formatDateTime(
    date: string | Date,
    format: string = 'YYYY-MM-DD • HH:mm'
): string {
    return dayjs(date).format(format);
}
