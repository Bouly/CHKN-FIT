"use client";

import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-panel p-5 ${className}`}>
      {children}
    </div>
  );
}

/** Titre de section : heavy uppercase avec tiret orange, façon Basic-Fit. */
export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-4 flex items-center gap-2.5 font-display text-lg leading-none text-foreground ${className}`}
    >
      <span className="inline-block h-4 w-1.5 rounded-sm bg-volt" aria-hidden />
      {children}
    </h2>
  );
}

/** Titre de page : très gros, heavy, uppercase. */
export function PageTitle({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-5xl leading-none text-foreground">
        {children}
      </h1>
      {sub && <p className="mt-2 text-sm text-mute">{sub}</p>}
    </div>
  );
}

const buttonVariants = {
  primary:
    "bg-cta text-white hover:bg-[#3b1480] active:bg-[#2b0961] disabled:opacity-40",
  secondary:
    "border-2 border-cta bg-white text-cta hover:bg-[#f8f3ff] active:bg-[#e5d7fc] disabled:opacity-40",
  danger:
    "border-2 border-alarm bg-white text-alarm hover:bg-red-50 disabled:opacity-40",
  success:
    "bg-volt text-white hover:bg-[#bd5400] disabled:opacity-40",
  ghost: "text-cta hover:bg-[#f8f3ff] disabled:opacity-40",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: keyof typeof buttonVariants;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded font-extrabold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${sizes[size]} ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded border-2 border-[#d5d5d5] bg-white px-3 py-2.5 text-sm text-foreground placeholder-neutral-400 outline-none transition-colors focus:border-cta ${className}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full rounded border-2 border-[#d5d5d5] bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-cta ${className}`}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-mute">
      {children}
    </label>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-mute">
        {label}
      </div>
      <div className="mt-2 font-display text-5xl leading-none text-foreground">
        {value}
      </div>
      {sub && <div className="mt-2 text-xs text-mute">{sub}</div>}
    </div>
  );
}

export const STATUS_META: Record<string, { label: string; className: string }> =
  {
    PLANNED: {
      label: "Planifiée",
      className: "border-[#d5d5d5] bg-white text-mute",
    },
    IN_PROGRESS: {
      label: "En cours",
      className: "border-volt bg-white text-volt",
    },
    COMPLETED: {
      label: "Validée",
      className: "border-volt bg-volt text-white",
    },
    SKIPPED: {
      label: "Skippée",
      className: "border-line bg-[#f9f9f9] text-neutral-400",
    },
    MISSED: {
      label: "Manquée",
      className: "border-alarm bg-white text-alarm",
    },
    REST: {
      label: "Repos",
      className: "border-line bg-[#f9f9f9] text-neutral-400",
    },
    NONE: {
      label: "—",
      className: "border-line bg-white text-neutral-400",
    },
  };

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.NONE;
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Étiquette de focus (PUSH, PULL...). */
export function FocusTag({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-foreground ${className}`}
    >
      <span className="inline-block h-2 w-2 rounded-sm bg-volt" aria-hidden />
      {label}
    </span>
  );
}

/** Badge jaune façon promo Basic-Fit — utilisé pour les PR. */
export function PrBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded bg-badge px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-foreground ${className}`}
    >
      PR
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-xs font-extrabold uppercase tracking-widest text-mute">
      Chargement<span className="blink ml-1.5 inline-block h-3.5 w-2 bg-volt" />
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border-2 border-dashed border-sand bg-white p-8">
      <div className="font-display text-lg text-foreground">{title}</div>
      {children && <div className="text-sm text-mute">{children}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded border-2 border-alarm bg-red-50 px-4 py-3 text-sm font-semibold text-alarm">
      {message}
    </div>
  );
}
