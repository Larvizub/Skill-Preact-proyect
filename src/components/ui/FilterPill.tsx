import type { ComponentChildren } from "preact";

type FilterPillProps = {
  checked: boolean;
  onChange: (e: Event & { currentTarget: HTMLInputElement }) => void;
  label: string;
  children?: ComponentChildren;
  className?: string;
};

export function FilterPill({
  checked,
  onChange,
  label,
  children,
  className,
}: FilterPillProps) {
  return (
    <label className="cursor-pointer select-none">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all duration-150 shadow-sm hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:shadow-md peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
          className ?? ""
        }`}
      >
        {children}
        <span className="font-medium leading-none">{label}</span>
      </span>
    </label>
  );
}

export default FilterPill;
