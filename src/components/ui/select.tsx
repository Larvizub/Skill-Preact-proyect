import { cn } from "../../lib/utils";

interface SelectProps {
  value?: string;
  onChange?: (e: Event) => void;
  children?: preact.ComponentChildren;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  children,
  className,
  id,
  disabled,
}: SelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </select>
  );
}
