import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1FA67A] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-slate-500">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          className="mt-5 bg-[#1FA67A] font-bold hover:bg-[#1FA67A]/90"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
