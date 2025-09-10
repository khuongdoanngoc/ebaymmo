/**
 * Chuyển đổi chuỗi thành định dạng slug
 * @param text Chuỗi đầu vào cần chuyển đổi
 * @returns Chuỗi đã được chuyển đổi thành định dạng slug
 */
export function convertToSlug(text: string): string {
    return text
        .toLowerCase() // Chuyển thành chữ thường
        .trim() // Xóa khoảng trắng đầu cuối
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/[^\w\-]+/g, '') // Xóa các ký tự đặc biệt (không phải chữ cái, số, gạch ngang)
        .replace(/\-\-+/g, '-') // Xóa nhiều dấu gạch ngang liên tiếp
        .replace(/^-+/, '') // Xóa dấu gạch ngang ở đầu
        .replace(/-+$/, ''); // Xóa dấu gạch ngang ở cuối
}
