import { useState, useCallback } from 'react';
import { format as dateFormat } from 'date-fns';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Thêm định nghĩa type cho jspdfautotable
declare global {
    interface Window {
        jspdfautotable?: {
            default: {
                globalDefaults: {
                    tableText: any;
                };
            };
        };
    }
}

// Định nghĩa các types
export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface DateRange {
    from: Date | null;
    to: Date | null;
}

export interface ExportOptions {
    filename: string;
    headers: string[];
    dateRange: DateRange;
    exportFormat: ExportFormat;
}

export interface UseDataExportOptions {
    filename?: string;
    headers?: string[];
    dateRange?: DateRange;
    exportFormat?: ExportFormat;
}

export function useDataExport<T extends Record<string, any>>(
    options: UseDataExportOptions = {}
) {
    const {
        filename = 'export',
        headers = [],
        dateRange = { from: null, to: null },
        exportFormat: defaultFormat = 'csv'
    } = options;

    const [exportFormat, setExportFormat] =
        useState<ExportFormat>(defaultFormat);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // Hàm kiểm tra dữ liệu trước khi export
    const validateData = useCallback((data: T[]): boolean => {
        if (!data || data.length === 0) {
            console.error('Không có dữ liệu để export');
            return false;
        }

        // Kiểm tra item đầu tiên
        const firstItem = data[0];
        console.log('Kiểm tra cấu trúc dữ liệu, item đầu tiên:', firstItem);

        if (typeof firstItem !== 'object' || firstItem === null) {
            console.error('Dữ liệu không phải là object:', firstItem);
            return false;
        }

        // Kiểm tra nếu object có properties
        const keys = Object.keys(firstItem);
        if (keys.length === 0) {
            console.error('Object không có properties:', firstItem);
            return false;
        }

        return true;
    }, []);

    // Hàm lọc dữ liệu theo ngày
    const filterDataByDate = useCallback(
        (data: T[], startDate?: Date | null, endDate?: Date | null): T[] => {
            if (!data || data.length === 0) return [];

            // Nếu không có filter date, trả về tất cả dữ liệu
            if (!startDate && !endDate) return [...data];

            console.log('Lọc dữ liệu theo ngày:', { startDate, endDate });
            console.log('Dữ liệu trước khi lọc:', data.length);

            let filteredData = [...data];

            // Lọc theo startDate nếu có
            if (startDate) {
                filteredData = filteredData.filter((item) => {
                    // Kiểm tra nhiều trường ngày có thể có
                    const dateField =
                        item.requestDate ||
                        item.date ||
                        item.createdAt ||
                        item.updatedAt ||
                        item.processedDate;
                    if (!dateField) {
                        console.log('Item không có trường date:', item);
                        return true; // Giữ lại nếu không có trường date
                    }
                    const itemDate = new Date(dateField);
                    return !isNaN(itemDate.getTime()) && itemDate >= startDate;
                });
            }

            // Lọc theo endDate nếu có
            if (endDate) {
                filteredData = filteredData.filter((item) => {
                    // Kiểm tra nhiều trường ngày có thể có
                    const dateField =
                        item.requestDate ||
                        item.date ||
                        item.createdAt ||
                        item.updatedAt ||
                        item.processedDate;
                    if (!dateField) {
                        return true; // Giữ lại nếu không có trường date
                    }
                    const itemDate = new Date(dateField);
                    return !isNaN(itemDate.getTime()) && itemDate <= endDate;
                });
            }

            console.log('Dữ liệu sau khi lọc:', filteredData.length);
            return filteredData;
        },
        []
    );

    // Function to export data to CSV
    const exportToCSV = useCallback(
        async (data: T[], options?: Partial<ExportOptions>) => {
            try {
                console.log('exportToCSV được gọi với', data.length, 'items');
                setIsExporting(true);
                const exportFilename = options?.filename || filename;
                let columnHeaders = options?.headers || headers;

                // Lọc bỏ cột ID nếu có
                columnHeaders = columnHeaders.filter(
                    (header) => header !== 'ID'
                );

                // Filter data by date if start and end dates are provided
                const filteredData = filterDataByDate(
                    data,
                    options?.dateRange?.from || dateRange.from,
                    options?.dateRange?.to || dateRange.to
                );
                console.log('Filtered data for CSV:', filteredData);

                if (!filteredData.length) {
                    const errorMsg = 'Không có dữ liệu để xuất CSV sau khi lọc';
                    console.error(errorMsg);
                    setExportError(errorMsg);
                    alert('Không có dữ liệu phù hợp để xuất ra CSV');
                    setIsExporting(false);
                    return false;
                }

                console.log('Sample item:', filteredData[0]);
                console.log('CSV Headers:', columnHeaders);

                // Tạo nội dung CSV
                let csvContent = columnHeaders.join(',') + '\n';
                let rowCount = 0;

                for (const item of filteredData) {
                    try {
                        // Debug thông tin item
                        console.log(`Processing CSV row ${rowCount}:`, item);

                        const row = columnHeaders
                            .map((header: string) => {
                                try {
                                    // Cẩn thận kiểm tra path
                                    if (
                                        !header ||
                                        !Object.prototype.hasOwnProperty.call(
                                            item,
                                            header
                                        )
                                    ) {
                                        console.warn(
                                            `Header "${header}" không tồn tại trong item`,
                                            item
                                        );
                                        return '""';
                                    }

                                    const value = item[header];

                                    // Xử lý các kiểu dữ liệu khác nhau
                                    if (value instanceof Date) {
                                        return `"${dateFormat(value, 'yyyy-MM-dd HH:mm:ss')}"`;
                                    } else if (typeof value === 'string') {
                                        // Escape quotes trong chuỗi
                                        return `"${value.replace(/"/g, '""')}"`;
                                    } else if (
                                        value === null ||
                                        value === undefined
                                    ) {
                                        return '""';
                                    } else if (typeof value === 'object') {
                                        try {
                                            const jsonStr =
                                                JSON.stringify(value);
                                            return `"${jsonStr.replace(/"/g, '""')}"`;
                                        } catch (e) {
                                            console.error(
                                                'Lỗi khi chuyển đổi object sang JSON:',
                                                e
                                            );
                                            return '""';
                                        }
                                    } else {
                                        return `"${value}"`;
                                    }
                                } catch (headerErr) {
                                    console.error(
                                        `Lỗi xử lý header ${header}:`,
                                        headerErr
                                    );
                                    return '""';
                                }
                            })
                            .join(',');

                        csvContent += row + '\n';
                        rowCount++;
                    } catch (err) {
                        console.error(
                            `Lỗi khi xử lý dòng CSV ${rowCount}:`,
                            err,
                            item
                        );
                    }
                }

                console.log(`Đã thêm ${rowCount} dòng vào CSV`);

                // Tạo file và download
                const blob = new Blob([csvContent], {
                    type: 'text/csv;charset=utf-8;'
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');

                // Thêm date range vào tên file nếu có
                let filenameWithDate = exportFilename;
                if (dateRange.from && dateRange.to) {
                    const fromStr = dateFormat(dateRange.from, 'yyyyMMdd');
                    const toStr = dateFormat(dateRange.to, 'yyyyMMdd');
                    filenameWithDate += `_${fromStr}_to_${toStr}`;
                }

                link.setAttribute('href', url);
                link.setAttribute('download', `${filenameWithDate}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                return true;
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : 'Lỗi không xác định khi xuất CSV';
                console.error('Export error:', error);
                setExportError(errorMsg);
                return false;
            } finally {
                setIsExporting(false);
            }
        },
        [filename, headers, dateRange, filterDataByDate]
    );

    // Excel export implementation
    const exportToExcel = useCallback(
        async (data: T[], options?: Partial<ExportOptions>) => {
            try {
                console.log('exportToExcel được gọi với', data.length, 'items');
                setIsExporting(true);
                const exportFilename = options?.filename || filename;
                let columnHeaders = options?.headers || headers;

                // Lọc bỏ cột ID nếu có
                columnHeaders = columnHeaders.filter(
                    (header) => header !== 'ID'
                );

                // Filter data by date if start and end dates are provided
                const filteredData = filterDataByDate(
                    data,
                    options?.dateRange?.from || dateRange.from,
                    options?.dateRange?.to || dateRange.to
                );
                console.log('Filtered data for Excel:', filteredData);

                if (!filteredData.length) {
                    const errorMsg =
                        'Không có dữ liệu để xuất Excel sau khi lọc';
                    console.error(errorMsg);
                    setExportError(errorMsg);
                    alert('Không có dữ liệu phù hợp để xuất ra Excel');
                    setIsExporting(false);
                    return false;
                }

                console.log('Sample item:', filteredData[0]);
                console.log('Excel Headers:', columnHeaders);

                // Tạo workbook mới và sheet
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Data');

                // Thêm header row
                worksheet.addRow(columnHeaders);

                // Format header row
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true };
                headerRow.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFf2f2f2' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Thêm data rows
                let rowCount = 0;
                for (const item of filteredData) {
                    try {
                        // Debug thông tin item
                        console.log(`Processing Excel row ${rowCount}:`, item);

                        const rowValues = columnHeaders.map(
                            (header: string) => {
                                try {
                                    // Kiểm tra tồn tại của header trong item
                                    if (
                                        !header ||
                                        !Object.prototype.hasOwnProperty.call(
                                            item,
                                            header
                                        )
                                    ) {
                                        console.warn(
                                            `Header "${header}" không tồn tại trong item`,
                                            item
                                        );
                                        return '';
                                    }

                                    const value = item[header];

                                    if (value instanceof Date) {
                                        return dateFormat(
                                            value,
                                            'yyyy-MM-dd HH:mm:ss'
                                        );
                                    }

                                    if (value === null || value === undefined) {
                                        return '';
                                    }

                                    if (typeof value === 'object') {
                                        try {
                                            return JSON.stringify(
                                                value
                                            ).substring(0, 500); // Giới hạn độ dài
                                        } catch (jsonErr) {
                                            console.error(
                                                'Lỗi khi chuyển đổi object sang JSON:',
                                                jsonErr
                                            );
                                            return '[Complex Object]';
                                        }
                                    }

                                    // Trả về chuỗi, số hoặc giá trị khác
                                    return value;
                                } catch (cellErr) {
                                    console.error(
                                        `Lỗi xử lý cell cho header "${header}":`,
                                        cellErr
                                    );
                                    return '';
                                }
                            }
                        );

                        worksheet.addRow(rowValues);
                        rowCount++;
                    } catch (err) {
                        console.error('Lỗi khi xử lý dòng Excel:', err, item);
                    }
                }

                console.log(`Đã thêm ${rowCount} dòng vào Excel`);

                // Auto size columns - cải thiện xử lý undefined
                try {
                    if (worksheet.columns) {
                        for (const column of worksheet.columns) {
                            if (
                                column &&
                                typeof column.eachCell === 'function'
                            ) {
                                let maxLength = 0;
                                column.eachCell(
                                    { includeEmpty: true },
                                    (cell) => {
                                        if (cell && cell.value) {
                                            const columnLength =
                                                cell.value.toString().length;
                                            if (columnLength > maxLength) {
                                                maxLength = columnLength;
                                            }
                                        }
                                    }
                                );
                                column.width = Math.min(maxLength + 2, 30);
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Could not auto-size columns', err);
                }

                // Thêm date range vào tên file nếu có
                let filenameWithDate = exportFilename;
                if (dateRange.from && dateRange.to) {
                    const fromStr = dateFormat(dateRange.from, 'yyyyMMdd');
                    const toStr = dateFormat(dateRange.to, 'yyyyMMdd');
                    filenameWithDate += `_${fromStr}_to_${toStr}`;
                }

                // Tạo buffer và download file
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                saveAs(blob, `${filenameWithDate}.xlsx`);

                return true;
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : 'Lỗi không xác định khi xuất Excel';
                console.error('Excel export error:', error);
                setExportError(errorMsg);
                return false;
            } finally {
                setIsExporting(false);
            }
        },
        [filename, headers, dateRange, filterDataByDate]
    );

    // Function to export data to PDF
    const exportToPDF = useCallback(
        async (data: T[], options?: Partial<ExportOptions>) => {
            try {
                console.log('exportToPDF được gọi với', data.length, 'items');
                setIsExporting(true);
                const exportFilename = options?.filename || filename;
                let columnHeaders = options?.headers || headers;

                // Lọc bỏ cột ID nếu có
                columnHeaders = columnHeaders.filter(
                    (header) => header !== 'ID'
                );

                // Filter data by date if start and end dates are provided
                const filteredData = filterDataByDate(
                    data,
                    options?.dateRange?.from || dateRange.from,
                    options?.dateRange?.to || dateRange.to
                );
                console.log('Filtered data for PDF:', filteredData);

                if (!filteredData.length) {
                    const errorMsg = 'Không có dữ liệu để xuất PDF sau khi lọc';
                    console.error(errorMsg);
                    setExportError(errorMsg);
                    alert('Không có dữ liệu phù hợp để xuất ra PDF');
                    setIsExporting(false);
                    return false;
                }

                console.log('Sample item:', filteredData[0]);
                console.log('PDF Headers:', columnHeaders);

                // Xử lý dữ liệu trước khi xuất - rút gọn các ID dài
                const processedData = filteredData.map((item) => {
                    const result = { ...item } as Record<string, any>;

                    // Xử lý các trường có thể là ID
                    Object.keys(result).forEach((key) => {
                        // Nếu key chứa 'ID' và giá trị là string dài
                        if (
                            (key === 'ID' ||
                                key.includes('Id') ||
                                key.endsWith('_id')) &&
                            typeof result[key] === 'string' &&
                            result[key].length > 12
                        ) {
                            // Rút gọn ID dài - chỉ lấy 8 ký tự đầu
                            if (result[key].includes('-')) {
                                // Nếu là UUID dạng có dấu gạch ngang
                                const firstPart = result[key].split('-')[0];
                                result[key] = firstPart.substring(0, 8) + '...';
                            } else {
                                // Các dạng ID khác
                                result[key] =
                                    result[key].substring(0, 8) + '...';
                            }
                        }
                    });

                    return result;
                });

                // Đếm số columns để quyết định orientation
                const columnCount = columnHeaders.length;

                // Tạo instance PDF với khổ phù hợp
                const doc = new jsPDF({
                    orientation: columnCount > 4 ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Ngăn chặn tiêu đề Unicode tự động từ jspdf-autotable
                // @ts-ignore
                if (window && typeof window.jspdfautotable === 'object') {
                    // @ts-ignore
                    const originalTableText =
                        window.jspdfautotable.default.globalDefaults.tableText;
                    // @ts-ignore
                    window.jspdfautotable.default.globalDefaults.tableText =
                        function () {};
                }

                // Thêm font Unicode để hỗ trợ tiếng Việt (nếu có)
                // Lưu ý: Trong thực tế, bạn có thể cần thêm font Việt hóa

                // Thêm tiêu đề
                const title =
                    exportFilename.charAt(0).toUpperCase() +
                    exportFilename.slice(1).replace(/_/g, ' ');

                // Thiết kế header trang đẹp
                // Thêm nền gradient và thanh tiêu đề
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                // Vẽ thanh tiêu đề
                doc.setFillColor(41, 128, 185); // Màu xanh dương đẹp
                doc.rect(0, 0, pageWidth, 30, 'F');

                // Thêm tiêu đề trang với font lớn và màu trắng
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text(title, 14, 20);

                // Thêm ngày xuất báo cáo
                doc.setFontSize(10);
                doc.text(
                    `Exported: ${dateFormat(new Date(), 'dd/MM/yyyy HH:mm')}`,
                    pageWidth - 60,
                    20
                );

                // Định nghĩa vị trí bắt đầu của bảng
                let startY = 40;

                // Thêm thông tin date range nếu có
                if (dateRange.from && dateRange.to) {
                    doc.setTextColor(80, 80, 80);
                    doc.setFontSize(11);
                    const fromStr = dateFormat(dateRange.from, 'dd/MM/yyyy');
                    const toStr = dateFormat(dateRange.to, 'dd/MM/yyyy');
                    doc.text(`Date range: ${fromStr} - ${toStr}`, 14, 36);
                    startY = 45;
                }

                // Tạo bảng dữ liệu đẹp
                // Chuẩn bị dữ liệu
                const tableData: (string | number | null)[][] = [];

                // Xác định kiểu dữ liệu cho mỗi cột để định dạng phù hợp
                const columnTypes = columnHeaders.map((header) => {
                    // Dựa vào tên cột để đoán kiểu dữ liệu
                    if (header.toLowerCase().includes('date')) return 'date';
                    if (header.toLowerCase().includes('amount'))
                        return 'number';
                    if (header.toLowerCase().includes('status'))
                        return 'status';
                    if (header === 'ID' || header.includes('Id')) return 'id';
                    if (header.toLowerCase().includes('email')) return 'email';
                    return 'text';
                });

                // Định dạng dữ liệu cho bảng
                for (const item of processedData) {
                    const row: (string | number | null)[] = [];

                    columnHeaders.forEach((header, index) => {
                        try {
                            const value = item[header];
                            const type = columnTypes[index];

                            if (value === null || value === undefined) {
                                row.push('');
                                return;
                            }

                            switch (type) {
                                case 'date':
                                    // Định dạng ngày tháng đẹp
                                    if (value instanceof Date) {
                                        row.push(
                                            dateFormat(
                                                value,
                                                'dd/MM/yyyy HH:mm'
                                            )
                                        );
                                    } else if (typeof value === 'string') {
                                        try {
                                            const date = new Date(value);
                                            if (!isNaN(date.getTime())) {
                                                row.push(
                                                    dateFormat(
                                                        date,
                                                        'dd/MM/yyyy HH:mm'
                                                    )
                                                );
                                            } else {
                                                row.push(value);
                                            }
                                        } catch (e) {
                                            row.push(value);
                                        }
                                    } else {
                                        row.push(String(value));
                                    }
                                    break;

                                case 'number':
                                    // Định dạng số với phân cách hàng nghìn
                                    if (typeof value === 'number') {
                                        row.push(value.toLocaleString('en-US'));
                                    } else if (
                                        typeof value === 'string' &&
                                        !isNaN(Number(value))
                                    ) {
                                        row.push(
                                            Number(value).toLocaleString(
                                                'en-US'
                                            )
                                        );
                                    } else {
                                        row.push(String(value));
                                    }
                                    break;

                                case 'status':
                                    // Trả về nguyên trạng để xử lý màu sắc sau
                                    row.push(String(value));
                                    break;

                                case 'id':
                                    row.push(String(value));
                                    break;

                                case 'email':
                                    // Định dạng email với chiều dài hợp lý
                                    if (
                                        typeof value === 'string' &&
                                        value.length > 30
                                    ) {
                                        const username = value.split('@')[0];
                                        const domain = value.split('@')[1];
                                        if (
                                            username &&
                                            domain &&
                                            username.length > 20
                                        ) {
                                            row.push(
                                                `${username.substring(0, 17)}...@${domain}`
                                            );
                                        } else {
                                            row.push(value);
                                        }
                                    } else {
                                        row.push(String(value));
                                    }
                                    break;

                                default: {
                                    // Tính chiều rộng dựa trên độ dài tiêu đề và nội dung
                                    let maxLength = header.length;
                                    tableData.forEach((row) => {
                                        const cellValue = String(
                                            row[index] || ''
                                        );
                                        if (cellValue.length > maxLength) {
                                            maxLength = cellValue.length;
                                        }
                                    });

                                    const estimatedWidth = Math.min(
                                        Math.max(20, maxLength * 2.5),
                                        60
                                    );
                                    const actualWidth = Math.min(
                                        estimatedWidth,
                                        availableWidth / columnHeaders.length
                                    );

                                    columnStyles[index] = {
                                        cellWidth: actualWidth,
                                        halign: 'left'
                                    };
                                }
                            }
                        } catch (err) {
                            console.error(
                                `Lỗi khi xử lý giá trị cho header ${header}:`,
                                err
                            );
                            row.push('');
                        }
                    });

                    tableData.push(row);
                }

                // Định nghĩa styles cho các cột
                const columnStyles: Record<number, Record<string, any>> = {};

                // Tính toán chiều rộng tự động cho các cột
                const availableWidth = doc.internal.pageSize.getWidth() - 28; // margin 14mm mỗi bên

                columnHeaders.forEach((header, index) => {
                    const type = columnTypes[index];

                    switch (type) {
                        case 'id':
                            columnStyles[index] = {
                                cellWidth: Math.min(
                                    40,
                                    availableWidth / columnHeaders.length
                                ),
                                fontStyle: 'normal',
                                fontSize: 8
                            };
                            break;
                        case 'date':
                            columnStyles[index] = {
                                cellWidth: Math.min(
                                    35,
                                    availableWidth / columnHeaders.length
                                ),
                                halign: 'center'
                            };
                            break;
                        case 'number':
                            columnStyles[index] = {
                                cellWidth: Math.min(
                                    25,
                                    availableWidth / columnHeaders.length
                                ),
                                halign: 'right'
                            };
                            break;
                        case 'status':
                            columnStyles[index] = {
                                cellWidth: Math.min(
                                    25,
                                    availableWidth / columnHeaders.length
                                ),
                                halign: 'center'
                            };
                            break;
                        case 'email':
                            columnStyles[index] = {
                                cellWidth: Math.min(
                                    50,
                                    availableWidth / columnHeaders.length
                                ),
                                halign: 'left'
                            };
                            break;
                        default: {
                            // Tính chiều rộng dựa trên độ dài tiêu đề và nội dung
                            let maxLength = header.length;
                            tableData.forEach((row) => {
                                const cellValue = String(row[index] || '');
                                if (cellValue.length > maxLength) {
                                    maxLength = cellValue.length;
                                }
                            });

                            const estimatedWidth = Math.min(
                                Math.max(20, maxLength * 2.5),
                                60
                            );
                            const actualWidth = Math.min(
                                estimatedWidth,
                                availableWidth / columnHeaders.length
                            );

                            columnStyles[index] = {
                                cellWidth: actualWidth,
                                halign: 'left'
                            };
                        }
                    }
                });

                // Tạo bảng với autoTable
                try {
                    // Kiểm tra nếu jsPDF-autoTable được tích hợp đúng cách
                    if (typeof (doc as any).autoTable !== 'function') {
                        throw new Error(
                            'autoTable function is not available on jsPDF instance'
                        );
                    }

                    // Cấu hình bảng đẹp
                    (doc as any).autoTable({
                        head: [columnHeaders],
                        body: tableData,
                        startY: startY,
                        theme: 'grid',
                        // Ngăn chặn tiêu đề tự động
                        title: '',
                        // Thiết kế đẹp cho header
                        headStyles: {
                            fillColor: [52, 152, 219], // Màu xanh dương đẹp
                            textColor: [255, 255, 255],
                            fontSize: 11,
                            fontStyle: 'bold',
                            halign: 'center',
                            valign: 'middle',
                            cellPadding: 4
                        },
                        // Thiết kế đẹp cho body
                        bodyStyles: {
                            fontSize: 10,
                            cellPadding: 4,
                            lineWidth: 0.1,
                            lineColor: [220, 220, 220]
                        },
                        // Màu nền xen kẽ cho các hàng
                        alternateRowStyles: {
                            fillColor: [240, 248, 255] // Alice Blue - màu xanh nhạt
                        },
                        // Áp dụng styles cho các cột
                        columnStyles: columnStyles,
                        // Margin hợp lý
                        margin: { top: 10, right: 14, bottom: 15, left: 14 },
                        // Vô hiệu hóa tiêu đề tự động
                        showHead: 'firstPage',
                        // Không tự động thêm tiêu đề bảng
                        willDrawCell: function (data: any) {
                            // Xóa tiêu đề "Bảng dữ liệu" nếu có
                            if (
                                data.row.raw &&
                                data.row.raw[0] === 'Bảng dữ liệu'
                            ) {
                                return false; // Không vẽ cell này
                            }
                            return true;
                        },
                        // Xử lý các sự kiện
                        didDrawPage: (data: any) => {
                            // Thêm footer với số trang
                            const pageSize = doc.internal.pageSize;
                            const pageHeight = pageSize.height
                                ? pageSize.height
                                : pageSize.getHeight();

                            // Vẽ đường kẻ phía dưới
                            doc.setDrawColor(200, 200, 200);
                            doc.line(
                                14,
                                pageHeight - 15,
                                pageWidth - 14,
                                pageHeight - 15
                            );

                            // Thêm số trang
                            doc.setFontSize(9);
                            doc.setTextColor(100, 100, 100);
                            doc.text(
                                `Page ${data.pageNumber} of ${data.pageCount}`,
                                pageWidth - 45,
                                pageHeight - 10
                            );

                            // Thêm tên file
                            doc.text(exportFilename, 14, pageHeight - 10);

                            // Thêm header ở các trang tiếp theo
                            if (data.pageNumber > 1) {
                                // Vẽ thanh tiêu đề nhỏ hơn ở các trang tiếp theo
                                doc.setFillColor(41, 128, 185);
                                doc.rect(0, 0, pageWidth, 20, 'F');

                                // Thêm tiêu đề với font nhỏ hơn
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(16);
                                doc.text(title, 14, 14);
                            }
                        },
                        // Log sự kiện didDrawCell để tìm vấn đề
                        didDrawCell: function (data: any) {
                            if (
                                data.row.index === 0 &&
                                data.column.index === 0
                            ) {
                                console.log('Bảng đang được vẽ:', data);
                            }
                        },
                        // Xử lý màu sắc và định dạng đặc biệt
                        didParseCell: function (data: any) {
                            // Định dạng cột trạng thái với màu sắc
                            const col = data.column.index;
                            const type = columnTypes[col];

                            // Xử lý định dạng dựa trên loại cột
                            if (type === 'status' && data.section === 'body') {
                                const status = String(
                                    data.cell.text || ''
                                ).toLowerCase();

                                if (status.includes('completed')) {
                                    data.cell.styles.textColor = [46, 204, 113]; // Green
                                    data.cell.styles.fontStyle = 'bold';
                                } else if (status.includes('pending')) {
                                    data.cell.styles.textColor = [243, 156, 18]; // Orange
                                    data.cell.styles.fontStyle = 'normal';
                                } else if (
                                    status.includes('canceled') ||
                                    status.includes('rejected')
                                ) {
                                    data.cell.styles.textColor = [231, 76, 60]; // Red
                                    data.cell.styles.fontStyle = 'normal';
                                }
                            }
                            // Định dạng cho cột số tiền
                            else if (
                                type === 'number' &&
                                data.section === 'body'
                            ) {
                                data.cell.styles.fontStyle = 'bold';
                            }
                            // Định dạng riêng cho ID
                            else if (type === 'id' && data.section === 'body') {
                                data.cell.styles.textColor = [100, 100, 100]; // Gray for IDs
                                data.cell.styles.fontSize = 10; // Đổi từ 8 thành 10 - cỡ chữ bình thường
                            }
                        },
                        // Tùy chọn thêm
                        styles: {
                            font: 'helvetica',
                            overflow: 'linebreak',
                            cellWidth: 'auto'
                        },
                        // Đảm bảo không cắt ô giữa các trang
                        rowPageBreak: 'auto'
                    });

                    console.log('Bảng PDF được tạo thành công.');
                } catch (tableErr) {
                    console.error('Lỗi khi tạo bảng PDF:', tableErr);

                    // Phương án dự phòng với định dạng đẹp
                    // Tạo header trang giống như trên

                    // Bỏ dòng text Data Table ở đây
                    let yPos = startY + 10;

                    // Vẽ header bảng đẹp
                    const tableWidth = pageWidth - 28;
                    const colWidths: number[] = [];

                    // Tính toán chiều rộng cho mỗi cột
                    columnHeaders.forEach((index: any) => {
                        const type = columnTypes[index];
                        let width = tableWidth / columnHeaders.length;

                        switch (type) {
                            case 'id':
                                width = Math.min(width, 35);
                                break;
                            case 'date':
                                width = Math.min(width, 30);
                                break;
                            case 'number':
                                width = Math.min(width, 20);
                                break;
                            case 'status':
                                width = Math.min(width, 25);
                                break;
                            case 'email':
                                width = Math.min(width, 45);
                                break;
                            default:
                                width = Math.min(width, 40);
                        }

                        colWidths.push(width);
                    });

                    // Vẽ khung và header
                    doc.setFillColor(52, 152, 219);
                    doc.rect(14, yPos - 6, tableWidth, 10, 'F');

                    // Hiển thị tiêu đề cột
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(255, 255, 255);

                    let xPos = 14;
                    columnHeaders.forEach((header, idx) => {
                        const width = colWidths[idx];
                        const textX = xPos + width / 2;

                        // Căn giữa tiêu đề
                        const textWidth =
                            (doc.getStringUnitWidth(header) * 10) /
                            doc.internal.scaleFactor;
                        doc.text(header, textX - textWidth / 2, yPos);

                        xPos += width;
                    });

                    yPos += 10;

                    // Vẽ và hiển thị dữ liệu với màu sắc đẹp
                    doc.setFont('helvetica', 'normal');

                    tableData.forEach((row, rowIdx) => {
                        // Vẽ nền cho hàng xen kẽ
                        if (rowIdx % 2 === 0) {
                            doc.setFillColor(240, 248, 255);
                            doc.rect(14, yPos - 5, tableWidth, 10, 'F');
                        }

                        // Hiển thị dữ liệu của hàng
                        xPos = 14;
                        row.forEach((cell, colIdx) => {
                            const width = colWidths[colIdx];
                            const type = columnTypes[colIdx];
                            const cellText = String(cell || '');

                            // Định dạng màu cho các loại giá trị
                            if (type === 'status') {
                                if (
                                    cellText.toLowerCase().includes('completed')
                                ) {
                                    doc.setTextColor(46, 204, 113);
                                    doc.setFont('helvetica', 'bold');
                                } else if (
                                    cellText.toLowerCase().includes('pending')
                                ) {
                                    doc.setTextColor(243, 156, 18);
                                    doc.setFont('helvetica', 'normal');
                                } else if (
                                    cellText
                                        .toLowerCase()
                                        .includes('canceled') ||
                                    cellText.toLowerCase().includes('rejected')
                                ) {
                                    doc.setTextColor(231, 76, 60);
                                    doc.setFont('helvetica', 'normal');
                                } else {
                                    doc.setTextColor(0);
                                    doc.setFont('helvetica', 'normal');
                                }
                            } else if (type === 'number') {
                                doc.setTextColor(0);
                                doc.setFont('helvetica', 'bold');
                            } else if (type === 'id') {
                                doc.setTextColor(100, 100, 100);
                                doc.setFont('helvetica', 'normal');
                                doc.setFontSize(10); // Đổi từ 8 thành 10 - cỡ chữ bình thường
                            } else {
                                doc.setTextColor(0);
                                doc.setFont('helvetica', 'normal');
                                doc.setFontSize(9);
                            }

                            // Vị trí và căn chỉnh
                            let textX = xPos + 2;

                            // Căn phải cho số
                            if (type === 'number') {
                                const textWidth =
                                    (doc.getStringUnitWidth(cellText) * 9) /
                                    doc.internal.scaleFactor;
                                textX = xPos + width - textWidth - 2;
                            }
                            // Căn giữa cho status và date
                            else if (type === 'status' || type === 'date') {
                                const textWidth =
                                    (doc.getStringUnitWidth(cellText) * 9) /
                                    doc.internal.scaleFactor;
                                textX = xPos + width / 2 - textWidth / 2;
                            }

                            doc.text(cellText, textX, yPos);
                            xPos += width;

                            // Reset font size
                            doc.setFontSize(9);
                        });

                        // Vẽ đường kẻ sau mỗi hàng
                        doc.setDrawColor(200, 200, 200);
                        doc.line(14, yPos + 2, 14 + tableWidth, yPos + 2);

                        yPos += 10;

                        // Kiểm tra nếu cần sang trang mới
                        if (yPos > pageHeight - 20) {
                            doc.addPage();

                            // Vẽ lại header trang
                            doc.setFillColor(41, 128, 185);
                            doc.rect(0, 0, pageWidth, 20, 'F');

                            // Thêm tiêu đề với font nhỏ hơn
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(16);
                            doc.text(title, 14, 14);

                            // Reset vị trí Y
                            yPos = 30;

                            // Vẽ lại header bảng
                            doc.setFillColor(52, 152, 219);
                            doc.rect(14, yPos - 6, tableWidth, 10, 'F');

                            // Hiển thị tiêu đề cột
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(10);
                            doc.setTextColor(255, 255, 255);

                            xPos = 14;
                            columnHeaders.forEach((header, idx) => {
                                const width = colWidths[idx];
                                const textX = xPos + width / 2;

                                // Căn giữa tiêu đề
                                const textWidth =
                                    (doc.getStringUnitWidth(header) * 10) /
                                    doc.internal.scaleFactor;
                                doc.text(header, textX - textWidth / 2, yPos);

                                xPos += width;
                            });

                            yPos += 10;
                        }
                    });

                    // Thêm footer
                    doc.setDrawColor(200, 200, 200);
                    doc.line(
                        14,
                        pageHeight - 15,
                        pageWidth - 14,
                        pageHeight - 15
                    );

                    doc.setFontSize(9);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Page 1 of 1`, pageWidth - 45, pageHeight - 10);
                    doc.text(exportFilename, 14, pageHeight - 10);
                }

                // Thêm date range vào tên file nếu có
                let filenameWithDate = exportFilename;
                if (dateRange.from && dateRange.to) {
                    const fromStr = dateFormat(dateRange.from, 'yyyyMMdd');
                    const toStr = dateFormat(dateRange.to, 'yyyyMMdd');
                    filenameWithDate += `_${fromStr}_to_${toStr}`;
                }

                // Lưu file PDF
                doc.save(`${filenameWithDate}.pdf`);

                return true;
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : 'Lỗi không xác định khi xuất PDF';
                console.error('PDF export error:', error);
                setExportError(errorMsg);
                return false;
            } finally {
                setIsExporting(false);
            }
        },
        [filename, headers, dateRange, filterDataByDate]
    );

    // General export function that calls the appropriate function based on format
    const exportData = useCallback(
        async (data: T[], options?: Partial<ExportOptions>) => {
            console.log('exportData được gọi với', data.length, 'items');

            // Xóa lỗi cũ nếu có
            setExportError(null);

            // Kiểm tra dữ liệu trước khi export
            if (!validateData(data)) {
                const errorMsg = 'Dữ liệu không hợp lệ để export';
                console.error(errorMsg);
                setExportError(errorMsg);
                alert(
                    'Không thể export dữ liệu. Vui lòng kiểm tra console để biết thêm chi tiết.'
                );
                return false;
            }

            // Lọc bỏ trường ID nếu có trong data
            const processedData = [...data];
            const processedHeaders = options?.headers
                ? options.headers.filter((header) => header !== 'ID')
                : headers.filter((header) => header !== 'ID');

            // Cập nhật options với headers đã lọc
            const updatedOptions = {
                ...options,
                headers: processedHeaders
            };

            const format = options?.exportFormat || exportFormat;

            switch (format) {
                case 'excel':
                    return exportToExcel(processedData, updatedOptions);
                case 'pdf':
                    return exportToPDF(processedData, updatedOptions);
                case 'csv':
                default:
                    return exportToCSV(processedData, updatedOptions);
            }
        },
        [
            exportFormat,
            exportToCSV,
            exportToExcel,
            exportToPDF,
            validateData,
            headers
        ]
    );

    // Các giá trị trả về từ hook
    return {
        exportData,
        exportToCSV,
        exportToExcel,
        exportToPDF,
        exportFormat,
        setExportFormat,
        isExporting,
        exportError
    };
}
