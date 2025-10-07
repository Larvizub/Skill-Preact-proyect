import { cn } from "../../lib/utils";
import type { ComponentChildren } from "preact";

interface TableProps {
  children: ComponentChildren;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return <thead className={cn("[&_tr]:border-b", className)}>{children}</thead>;
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ComponentChildren;
  className?: string;
}

export function TableHead({ children, className }: TableCellProps) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className
      )}
    >
      {children}
    </td>
  );
}
