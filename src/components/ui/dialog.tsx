import { cn } from "../../lib/utils";
import type { ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { X } from "lucide-preact";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ComponentChildren;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  const dialog = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return dialog;
  }

  return createPortal(dialog, document.body);
}

interface DialogContentProps {
  children: ComponentChildren;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={cn("overflow-y-auto", className)}>{children}</div>;
}

interface DialogHeaderProps {
  children: ComponentChildren;
  onClose?: () => void;
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface DialogTitleProps {
  children: ComponentChildren;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h2 className={cn("text-xl font-semibold", className)}>{children}</h2>;
}

interface DialogDescriptionProps {
  children: ComponentChildren;
  className?: string;
}

export function DialogDescription({
  children,
  className,
}: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
}

interface DialogBodyProps {
  children: ComponentChildren;
  className?: string;
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

interface DialogFooterProps {
  children: ComponentChildren;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 p-6 border-t border-border",
        className
      )}
    >
      {children}
    </div>
  );
}
