import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  fromDate?: Date;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  setDate,
  className,
  fromDate
}: DatePickerProps) {
  const handleSelect = (selectedDate: Date | undefined) => {
    if (onSelect) onSelect(selectedDate);
    if (setDate) setDate(selectedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          fromDate={fromDate} // Pass the fromDate to the Calendar
          disabled={fromDate ? { before: fromDate } : undefined} // Disable dates before fromDate
        />
      </PopoverContent>
    </Popover>
  );
}
