import dayjs from 'dayjs';
import 'dayjs/locale/en';

dayjs.locale('en');

export function formatDate(
    date?: Date | null,
    format: string = 'DD/MM/YYYY'
): string {
    if (!date) return 'N/A'; // Trả về "N/A" nếu không có ngày
    return dayjs(date).format(format);
}
