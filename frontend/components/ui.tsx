"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-panel p-5 shadow-[0_1px_2px_rgba(45,45,45,0.04)] ${className}`}
    >
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
    <div className="fade-up">
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
      className={`cursor-pointer rounded font-extrabold uppercase tracking-wide transition-[background-color,border-color,color,transform,opacity] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${sizes[size]} ${buttonVariants[variant]} ${className}`}
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
      className={`w-full rounded border-2 border-[#d5d5d5] bg-white px-3 py-2.5 text-sm text-foreground placeholder-neutral-400 outline-none transition-colors duration-150 focus:border-cta ${className}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full rounded border-2 border-[#d5d5d5] bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-150 focus:border-cta ${className}`}
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
    <div className="rounded-xl border border-line bg-panel p-5 shadow-[0_1px_2px_rgba(45,45,45,0.04)]">
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

/** Squelette de chargement : la page a sa forme avant ses données. */
export function Spinner() {
  return (
    <div className="flex flex-col gap-5 py-2" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-raise/70" />
      <div className="h-36 animate-pulse rounded-2xl bg-raise/70" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-raise/70" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-xl bg-raise/70" />
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
    <div className="fade-up rounded border-2 border-alarm bg-red-50 px-4 py-3 text-sm font-semibold text-alarm">
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compteur animé : les chiffres montent à l'affichage (dashboard)     */
/* ------------------------------------------------------------------ */

export function CountUp({
  value,
  duration = 700,
  locale = false,
}: {
  value: number;
  duration?: number;
  locale?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{locale ? display.toLocaleString("fr-FR") : display}</>;
}

/* ------------------------------------------------------------------ */
/* Modale : fond flouté + zoom subtil                                  */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="overlay-in fixed inset-0 z-40 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts : pilule sombre en bas, auto-dismiss, sans décaler la page   */
/* ------------------------------------------------------------------ */

type ToastKind = "success" | "error";
interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}

let pushToast: ((text: string, kind: ToastKind) => void) | null = null;

/** À appeler depuis n'importe quelle page : toast("Profil enregistré"). */
export function toast(text: string, kind: ToastKind = "success") {
  pushToast?.(text, kind);
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    pushToast = (text, kind) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-2), { id, text, kind }]);
      setTimeout(
        () => setItems((prev) => prev.filter((t) => t.id !== id)),
        3500
      );
    };
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((t) => (
        <div
          key={t.id}
          className="toast-in flex items-center gap-2.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-white shadow-lg"
          role="status"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              t.kind === "success" ? "bg-volt" : "bg-alarm"
            }`}
          />
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation stylée (remplace le confirm() natif)                   */
/* ------------------------------------------------------------------ */

interface ConfirmState {
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

let openConfirm: ((s: ConfirmState) => void) | null = null;

/** await confirmDialog("Supprimer cette photo ?", { danger: true }) */
export function confirmDialog(
  message: string,
  opts: { confirmLabel?: string; danger?: boolean } = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!openConfirm) {
      resolve(window.confirm(message)); // filet de sécurité hors AppShell
      return;
    }
    openConfirm({
      message,
      confirmLabel: opts.confirmLabel ?? "Confirmer",
      danger: opts.danger ?? false,
      resolve,
    });
  });
}

export function Confirmer() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    openConfirm = (s) => setState(s);
    return () => {
      openConfirm = null;
    };
  }, []);

  useEffect(() => {
    if (state) confirmRef.current?.focus();
  }, [state]);

  function close(ok: boolean) {
    state?.resolve(ok);
    setState(null);
  }

  return (
    <Modal open={!!state} onClose={() => close(false)}>
      {state && (
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold leading-relaxed text-foreground">
            {state.message}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => close(false)}>
              Annuler
            </Button>
            <button
              ref={confirmRef}
              onClick={() => close(true)}
              className={`cursor-pointer rounded px-6 py-3 text-sm font-extrabold uppercase tracking-wide transition-[background-color,transform] duration-150 active:scale-[0.97] ${
                state.danger
                  ? "bg-alarm text-white hover:bg-[#b3241a]"
                  : "bg-cta text-white hover:bg-[#3b1480]"
              }`}
            >
              {state.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
