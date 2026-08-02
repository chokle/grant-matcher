export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString("en-CA")}`;
}

export function formatRange(min: number, max: number): string {
  if (!min && !max) return "Varies";
  if (!min || min === max) return formatCurrency(max);
  return `${formatCurrency(min)}–${formatCurrency(max)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Rolling";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`).getTime();
  return Math.ceil((date - Date.now()) / 86_400_000);
}
