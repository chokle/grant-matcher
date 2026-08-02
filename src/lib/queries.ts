import { queryOptions } from "@tanstack/react-query";
import { listFundingPrograms } from "@/lib/programs.functions";
import { getMyProfile, listMyPipeline, listMyTimeEntries } from "@/lib/app.functions";

export const programsQuery = () =>
  queryOptions({
    queryKey: ["funding-programs"],
    queryFn: () => listFundingPrograms(),
    staleTime: 5 * 60 * 1000,
  });

export const profileQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
    enabled,
  });

export const pipelineQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["pipeline"],
    queryFn: () => listMyPipeline(),
    enabled,
  });

export const timeEntriesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["time-entries"],
    queryFn: () => listMyTimeEntries(),
    enabled,
  });

export type PipelineRow = Awaited<ReturnType<typeof listMyPipeline>>[number];
export type TimeEntryRow = Awaited<ReturnType<typeof listMyTimeEntries>>[number];
