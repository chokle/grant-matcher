import { z } from "zod";

export const profileSchema = z.object({
  business_name: z.string().max(200),
  website: z.string().max(300).nullable(),
  province: z.string().max(100).nullable(),
  sector: z.string().max(100).nullable(),
  stage: z.string().max(100).nullable(),
  employees: z.number().int().min(0).max(1_000_000).nullable(),
  annual_revenue: z.number().min(0).nullable(),
  incorporation_date: z.string().max(20).nullable(),
  description: z.string().max(4000).nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
