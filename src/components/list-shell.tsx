import { type ReactNode } from "react";

interface ListShellProps {
  toolbar?: ReactNode;
  children: ReactNode;
}

/** Card wrapper with optional toolbar above a scrollable table region. */
export function ListShell({ toolbar, children }: ListShellProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
