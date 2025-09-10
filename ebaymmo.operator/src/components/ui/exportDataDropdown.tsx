import { useState } from 'react';
import { Calendar as CalendarIcon, FileDown, Loader2 } from 'lucide-react';
import { format as dateFormat } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useDataExport, DateRange, ExportFormat } from '@/hooks/useDataExport';
import StatusModal from '@/components/StatusModal/StatusModal';

interface ExportOption {
    label: string;
    value: string;
    getData: () => any[];
}

interface ExportConfig {
    options: ExportOption[];
}

interface ExportDataDropdownProps<T extends Record<string, any>> {
    data: T[];
    filename?: string;
    headers?: string[];
    label?: string;
    triggerClassName?: string;
    exportConfig?: ExportConfig;
    disabled?: boolean;
}

export function ExportDataDropdown<T extends Record<string, any>>({
    data,
    filename = 'export',
    headers,
    label = 'Export Data',
    triggerClassName,
    exportConfig,
    disabled = false
}: ExportDataDropdownProps<T>) {
    const { isExporting, exportFormat, setExportFormat, exportData } =
        useDataExport<T>({ filename, headers });

    const [dateRange, setDateRange] = useState<DateRange>({
        from: null,
        to: null
    });
    const [openFromDatePopover, setOpenFromDatePopover] = useState(false);
    const [openToDatePopover, setOpenToDatePopover] = useState(false);
    const [selectedExportOption, setSelectedExportOption] = useState(
        exportConfig?.options[0].value || 'current'
    );
    const [showWarningModal, setShowWarningModal] = useState(false);

    const handleExport = async () => {
        let dataToExport = data;

        if (exportConfig) {
            const selectedOption = exportConfig.options.find(
                (option) => option.value === selectedExportOption
            );
            if (selectedOption) {
                dataToExport = selectedOption.getData();
            }
        }
        if (dateRange.from || dateRange.to) {
            dataToExport = dataToExport.filter((item) => {
                const dateKey = Object.keys(item).find((key) =>
                    key.trim().toLowerCase().includes('date')
                );

                const itemDate = dateKey
                    ? new Date(item[dateKey])
                    : new Date(item.createdAt);

                const normalizedItemDate = new Date(itemDate.getTime());
                normalizedItemDate.setHours(0, 0, 0, 0);

                const fromDate = dateRange.from
                    ? new Date(dateRange.from.getTime())
                    : null;
                if (fromDate) fromDate.setHours(0, 0, 0, 0);

                const toDate = dateRange.to
                    ? new Date(dateRange.to.getTime())
                    : null;
                if (toDate) toDate.setHours(23, 59, 59, 999);

                if (fromDate && toDate) {
                    return (
                        normalizedItemDate >= fromDate &&
                        normalizedItemDate <= toDate
                    );
                } else if (fromDate) {
                    return normalizedItemDate >= fromDate;
                } else if (toDate) {
                    return normalizedItemDate <= toDate;
                }
                return true;
            });
        }

        if (dataToExport.length === 0) {
            setShowWarningModal(true);
            return;
        }

        await exportData(dataToExport, {
            filename,
            exportFormat,
            dateRange,
            headers
        });
    };

    const handleClearDateRange = () => {
        setDateRange({ from: null, to: null });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={triggerClassName}
                    disabled={disabled || data.length === 0}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
                <div className="p-2 grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            Export Options
                        </h4>
                        <div className="space-y-4">
                            {exportConfig && (
                                <div>
                                    <p className="text-sm mb-2">Export Range</p>
                                    <Select
                                        value={selectedExportOption}
                                        onValueChange={setSelectedExportOption}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exportConfig.options.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <p className="text-sm mb-2">Format</p>
                                <Select
                                    value={exportFormat}
                                    onValueChange={(value) =>
                                        setExportFormat(value as ExportFormat)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="csv">
                                            CSV (.csv)
                                        </SelectItem>
                                        <SelectItem value="excel">
                                            Excel (.xlsx)
                                        </SelectItem>
                                        <SelectItem value="pdf">
                                            PDF (.pdf)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm">Date Range</p>
                                    {(dateRange.from || dateRange.to) && (
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 text-xs text-muted-foreground"
                                            onClick={handleClearDateRange}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Popover
                                            open={openFromDatePopover}
                                            onOpenChange={
                                                setOpenFromDatePopover
                                            }
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left h-9"
                                                    size="sm"
                                                >
                                                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                                    {dateRange.from ? (
                                                        <span className="text-xs">
                                                            {dateFormat(
                                                                dateRange.from,
                                                                'MMM dd, yyyy'
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            From date
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        dateRange.from ||
                                                        undefined
                                                    }
                                                    onSelect={(
                                                        date: Date | undefined
                                                    ) => {
                                                        if (
                                                            date &&
                                                            dateRange.to &&
                                                            date > dateRange.to
                                                        ) {
                                                            setShowWarningModal(
                                                                true
                                                            );
                                                            return;
                                                        }
                                                        setDateRange(
                                                            (
                                                                prev: DateRange
                                                            ) => ({
                                                                ...prev,
                                                                from:
                                                                    date || null
                                                            })
                                                        );
                                                        setOpenFromDatePopover(
                                                            false
                                                        );
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <Popover
                                            open={openToDatePopover}
                                            onOpenChange={setOpenToDatePopover}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left h-9"
                                                    size="sm"
                                                >
                                                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                                    {dateRange.to ? (
                                                        <span className="text-xs">
                                                            {dateFormat(
                                                                dateRange.to,
                                                                'MMM dd, yyyy'
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            To date
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="end"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        dateRange.to ||
                                                        undefined
                                                    }
                                                    onSelect={(
                                                        date: Date | undefined
                                                    ) => {
                                                        setDateRange(
                                                            (
                                                                prev: DateRange
                                                            ) => ({
                                                                ...prev,
                                                                to: date || null
                                                            })
                                                        );
                                                        setOpenToDatePopover(
                                                            false
                                                        );
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            {/* Quick date presets */}
                            <div className="grid grid-cols-3 gap-1 mt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        const today = new Date();
                                        setDateRange({
                                            from: today,
                                            to: today
                                        });
                                        setOpenFromDatePopover(false);
                                        setOpenToDatePopover(false);
                                    }}
                                >
                                    Today
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        const today = new Date();
                                        const weekAgo = new Date();
                                        weekAgo.setDate(today.getDate() - 7);
                                        setDateRange({
                                            from: weekAgo,
                                            to: today
                                        });
                                        setOpenFromDatePopover(false);
                                        setOpenToDatePopover(false);
                                    }}
                                >
                                    Last 7 days
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        const today = new Date();
                                        const monthAgo = new Date();
                                        monthAgo.setDate(today.getDate() - 30);
                                        setDateRange({
                                            from: monthAgo,
                                            to: today
                                        });
                                        setOpenFromDatePopover(false);
                                        setOpenToDatePopover(false);
                                    }}
                                >
                                    Last 30 days
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleExport}
                        disabled={isExporting || disabled || data.length === 0}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export as{' '}
                                {exportFormat === 'csv'
                                    ? 'CSV'
                                    : exportFormat === 'excel'
                                      ? 'Excel'
                                      : 'PDF'}
                            </>
                        )}
                    </Button>
                </div>
            </DropdownMenuContent>
            <StatusModal
                type="warning"
                isOpen={showWarningModal}
                onClose={() => setShowWarningModal(false)}
                message={
                    dateRange.from &&
                    dateRange.to &&
                    dateRange.from > dateRange.to
                        ? 'From date cannot be greater than to date'
                        : 'No data available for export with selected filters'
                }
            />
        </DropdownMenu>
    );
}
