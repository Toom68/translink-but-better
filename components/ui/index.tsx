import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// ── Button ──
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover active:scale-[0.97] shadow-sm",
  secondary: "bg-bg-elevated border border-border text-text hover:bg-bg-subtle active:scale-[0.97]",
  ghost: "text-text-secondary hover:bg-bg-subtle hover:text-text",
  danger: "bg-danger text-white hover:opacity-90 active:scale-[0.97] shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-full",
  md: "h-11 px-5 text-sm rounded-full",
  lg: "h-14 px-7 text-base rounded-full",
  icon: "h-11 w-11 rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

// ── Card ──
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-bg-elevated border border-border rounded-[var(--radius)] shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Badge ──
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "default" | "accent" | "success" | "warning" | "danger";
}

const badgeColors = {
  default: "bg-bg-subtle text-text-secondary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ className, color = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full",
        badgeColors[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ── Input ──
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full h-12 px-4 bg-bg-elevated border border-border rounded-full text-text placeholder:text-text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

// ── Sheet (bottom sheet modal) ──
export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-bg-elevated rounded-t-[var(--radius-lg)] shadow-[var(--shadow-lg)] max-h-[85vh] overflow-y-auto no-scrollbar safe-bottom animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-bg-elevated px-5 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1.5 bg-border-strong rounded-full mx-auto mb-3" />
          {title && (
            <h2 className="text-lg font-semibold text-text">{title}</h2>
          )}
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Skeleton ──
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-bg-subtle rounded-[var(--radius-sm)]",
        className
      )}
    />
  );
}

// ── Spinner ──
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin",
        className
      )}
    />
  );
}

// ── EmptyState ──
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center text-text-muted mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs mb-6 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
