/**
 * FlowLens AI - Process Engine Constants & Configurable Parameters
 * Phase 1: Event Data Engine
 */

export const CANONICAL_ALIASES: Record<string, string[]> = {
  case_id: [
    "case_id",
    "caseid",
    "case",
    "case id",
    "case_number",
    "casenumber",
    "instance_id",
    "order_id",
    "orderid",
    "ticket_id",
    "ticketid",
    "patient_id",
    "patientid",
    "shipment_id",
    "shipmentid",
    "shipment_number",
    "transaction_id",
    "transactionid",
    "request_id",
    "requestid",
    "request_number",
    "application_id",
    "application_ref",
    "job_id",
    "jobid",
    "customer_id",
    "claim_id",
    "claimid",
    "incident_id",
    "item_id",
    "package_id",
  ],
  activity: [
    "activity",
    "stage",
    "process_stage",
    "step",
    "process_step",
    "task",
    "event_name",
    "event",
    "event_type",
    "operation",
    "activity_name",
    "stage_name",
    "action",
    "lifecycle_step",
    "event_description",
    "status_change",
  ],
  start_time: [
    "start_time",
    "start",
    "started_at",
    "start_timestamp",
    "start_date",
    "begin_time",
    "start_datetime",
    "timestamp_start",
    "time_start",
    "event_start",
    "datetime_start",
  ],
  end_time: [
    "end_time",
    "end",
    "completed_at",
    "ended_at",
    "end_timestamp",
    "end_date",
    "completion_time",
    "finish_time",
    "finished_at",
    "end_datetime",
    "timestamp_end",
    "time_end",
    "event_end",
    "datetime_end",
  ],
  resource_id: [
    "resource_id",
    "resource",
    "operator_id",
    "operator",
    "user",
    "agent_id",
    "agent",
    "performer",
    "employee_id",
    "employee",
    "worker_id",
    "worker",
    "machine_id",
    "machine",
    "vehicle_id",
    "vehicle_unit",
    "server_id",
    "server",
    "team_id",
    "officer_id",
    "assignee",
  ],
  status: ["status", "state", "event_status", "stage_status", "result", "outcome"],
  location: [
    "location",
    "site",
    "branch",
    "facility",
    "region",
    "department",
    "hub",
    "hub_location",
    "station",
    "warehouse",
    "plant",
  ],
  priority: ["priority", "urgency", "severity", "tier", "importance", "risk_tier"],
  category: ["category", "type", "channel", "queue", "team", "division", "segment"],
};

/**
 * Phase 1 Bottleneck Contribution Model Weights
 * Default: 40% processing duration impact, 60% waiting/queue delay impact
 */
export const DEFAULT_BOTTLENECK_WEIGHTS = {
  PROCESSING_WEIGHT: 0.4,
  WAITING_WEIGHT: 0.6,
} as const;

/**
 * Bottleneck DNA Thresholds
 */
export const BOTTLENECK_DNA_THRESHOLDS = {
  // If waiting contribution percentage exceeds 25% of all waiting time in the process
  WAITING_HEAVY_PCT: 25.0,
  // If processing contribution percentage exceeds 25% of all processing time in the process
  PROCESSING_HEAVY_PCT: 25.0,
  // If coefficient of variation (StdDev / Mean) exceeds 0.60
  HIGH_VARIANCE_COV: 0.60,
  // If stage event frequency is at least 30% higher than average stage event count
  HIGH_VOLUME_FACTOR: 1.30,
  // If resource workload associated with stage exceeds 1.35x of average resource workload
  RESOURCE_HEAVY_RATIO: 1.35,
  // If at least 30% of stage activity or queue delay occurs within peak arrival windows
  PEAK_CONCENTRATION_PCT: 30.0,
} as const;

/**
 * Phase 2 Peak-Time Analysis Thresholds
 */
export const PEAK_ANALYSIS_CONFIG = {
  // Peak hour threshold: bucket volume >= 120% (1.2x) of average hourly volume
  PEAK_THRESHOLD_RATIO: 1.20,
} as const;

/**
 * Phase 2 Resource Overload Detection Thresholds
 */
export const RESOURCE_ANALYSIS_CONFIG = {
  // Flagged as overloaded if total processing duration exceeds 140% of average resource duration
  OVERLOAD_WORKLOAD_RATIO: 1.40,
  // Resource handles >= 50% of all events in a single stage (high stage concentration)
  STAGE_CONCENTRATION_PCT: 50.0,
  // Resource handles >= 35% of all cases in the dataset
  HIGH_CASE_SHARE_PCT: 35.0,
} as const;
