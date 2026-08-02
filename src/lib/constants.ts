export const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

export const SECTORS = [
  "Technology",
  "R&D",
  "Manufacturing",
  "CleanTech",
  "Health",
  "Agriculture",
  "Retail",
  "Hospitality",
  "Energy",
  "Engineering",
  "Science",
  "Innovation",
  "Commercialization",
  "Startup",
  "Entrepreneurship",
] as const;

export const STAGES = [
  "Idea",
  "Pre-revenue",
  "Early revenue",
  "Growth",
  "Established",
] as const;

export const PIPELINE_STATUSES = [
  "saved",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const STATUS_LABELS: Record<PipelineStatus, string> = {
  saved: "Saved",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export const FUNDING_TYPE_LABELS: Record<string, string> = {
  grant: "Grant",
  loan: "Loan",
  tax_credit: "Tax Credit",
};
