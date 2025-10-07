import { useState, useRef, useEffect } from "preact/hooks";
import { cn } from "../../lib/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-preact";

interface DatePickerProps {
  id?: string;
  value?: string;
  onInput?: (e: Event) => void;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  id,
  value,
  onInput,
  onChange,
  className,
  placeholder = "Selecciona una fecha",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value + "T00:00:00");
      setDisplayValue(
        date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
      setCurrentMonth(date);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const handleDateSelect = (day: number) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const selected = new Date(year, month, day);
    const dateString = selected.toISOString().split("T")[0];

    // Crear evento sintético para onInput
    if (onInput) {
      const syntheticEvent = {
        target: { value: dateString },
      } as unknown as Event;
      onInput(syntheticEvent);
    }

    // Llamar onChange si existe
    if (onChange) {
      onChange(dateString);
    }

    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const renderCalendar = () => {
    const { daysInMonth, startDayOfWeek, year, month } =
      getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    const selectedDate = value ? new Date(value + "T00:00:00") : null;

    // Días vacíos antes del primer día del mes (domingo = 0)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected =
        selectedDate &&
        currentDate.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={cn(
            "h-9 w-9 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            isToday && "border border-primary",
            isSelected && "bg-primary text-primary-foreground"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-w-0",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          id={id}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          className="flex-1 min-w-0 bg-transparent outline-none cursor-pointer placeholder:text-muted-foreground truncate text-base sm:text-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-[min(320px,100%)] min-w-[220px] max-w-[90vw] rounded-md border border-border bg-card p-4 shadow-lg">
          {/* Header con navegación de mes */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-semibold text-sm capitalize">
              {currentMonth.toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["D", "L", "M", "X", "J", "V", "S"].map((day) => (
              <div
                key={day}
                className="h-9 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

          {/* Botón de hoy */}
          <div className="mt-4 pt-3 border-t">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const dateString = today.toISOString().split("T")[0];
                if (onInput) {
                  const syntheticEvent = {
                    target: { value: dateString },
                  } as unknown as Event;
                  onInput(syntheticEvent);
                }
                if (onChange) {
                  onChange(dateString);
                }
                setIsOpen(false);
              }}
              className="w-full h-8 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
