'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            showWeekNumber={false}
            ISOWeek={false}
            className={cn(
                'p-3 [&_.rdp-head_row]:hidden [&_.rdp-head_cell]:hidden max-w-[300px] rounded-lg calendar-theme',
                className
            )}
            classNames={{
                months: 'flex flex-col space-y-4',
                month: 'space-y-2',
                caption: 'relative flex items-center justify-center py-2',
                caption_label: 'text-base font-semibold text-primary mx-2',
                nav: 'flex items-center gap-1',
                nav_button: cn(
                    'h-8 w-8 bg-background hover:bg-muted flex items-center justify-center rounded-full transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                ),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse',
                head_row: 'hidden !important',
                head_cell: 'hidden !important',
                row: 'flex w-full mt-2 justify-center gap-[2px]',
                cell: cn(
                    'relative p-0 text-center',
                    'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                ),
                day: cn(
                    'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full',
                    'hover:bg-muted hover:text-foreground transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                ),
                day_selected:
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm',
                day_today:
                    'border-2 border-primary/50 text-accent-foreground font-medium',
                day_outside: 'text-muted-foreground/60 opacity-50',
                day_disabled:
                    'text-muted-foreground/50 opacity-50 hover:bg-transparent',
                day_range_middle:
                    'aria-selected:bg-accent aria-selected:text-accent-foreground',
                day_hidden: 'invisible',
                ...classNames
            }}
            formatters={{
                formatCaption: (date) => {
                    const month = date.toLocaleString('en-US', {
                        month: 'long'
                    });
                    const year = date.getFullYear();
                    return `${month} ${year}`;
                }
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

const style = document.createElement('style');
style.textContent = `
  .rdp-head_row, .rdp-head_cell {
    display: none !important;
  }
  
  .calendar-theme {
    border: 1px solid var(--border, hsl(var(--input)));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  
  .calendar-theme:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  
  .rdp-day {
    transition: transform 0.1s ease, background-color 0.2s ease;
  }
  
  .rdp-day:hover:not(.rdp-day_selected) {
    transform: scale(1.05);
  }
  
  .rdp-day_selected {
    transform: scale(1.1);
  }
  
  .rdp-day_today:not(.rdp-day_selected) {
    position: relative;
    z-index: 1;
  }
  
  .rdp-nav_button:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
  
  @media (max-width: 640px) {
    .calendar-theme {
      max-width: 100%;
      padding: 0.5rem;
    }
  }
`;

if (typeof document !== 'undefined') {
    document.head.appendChild(style);
}

export { Calendar };
