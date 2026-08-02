import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

/**
 * A select that renders a native shadcn Select on desktop and a bottom drawer
 * on small screens (easier to hit with a thumb).
 */
export function ResponsiveSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label: string;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-11 rounded-xl bg-card", className)} aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-input bg-card px-3 text-sm",
          className,
        )}
        aria-label={label}
      >
        <span className="min-w-0 truncate">{current?.label ?? label}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </DrawerTrigger>
      <DrawerContent className="safe-bottom">
        <DrawerTitle className="px-4 pb-2 pt-4 text-base font-semibold">{label}</DrawerTitle>
        <div className="max-h-[60vh] overflow-y-auto px-2 pb-4">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 truncate">{o.label}</span>
              {o.value === value ? <Check className="size-4 shrink-0 text-primary" /> : null}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
