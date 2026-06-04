/**
 * Types for the read-only Pipeline Settings page (snapshot of the agents' default.yaml).
 */

export interface PipelineSettingsMeta {
  source: string;
  snapshot_of_commit: string;
  snapshot_date: string;
  read_only: boolean;
  note: string;
}

export interface PipelineSettingsResponse {
  meta: PipelineSettingsMeta;
  settings: Record<string, unknown>;
}
