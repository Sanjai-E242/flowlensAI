/**
 * FlowLens AI - Universal Schema & Domain Profiling Types
 * Shared Layer (Browser & Server safe)
 */

export type ProcessDomain =
  | "Manufacturing"
  | "Logistics"
  | "Banking"
  | "Customer Operations"
  | "Healthcare"
  | "E-commerce"
  | "Insurance"
  | "Enterprise Operations"
  | "Supply Chain"
  | "General Operations";

export interface ColumnMappingConfig {
  case_id?: string;
  activity?: string;
  start_time?: string;
  end_time?: string;
  resource_id?: string;
  status?: string;
  priority?: string;
  location?: string;
}

export interface DomainTerminology {
  caseLabel: string; // e.g. "Order", "Claim", "Ticket", "Patient", "Shipment"
  caseLabelPlural: string; // e.g. "Orders", "Claims", "Tickets"
  activityLabel: string; // e.g. "Operation", "Stage", "Step"
  resourceLabel: string; // e.g. "Machine / Workcenter", "Agent", "Underwriter"
  resourceLabelPlural: string; // e.g. "Machines", "Agents", "Officers"
}

export interface ProcessDomainInfo {
  domain: ProcessDomain;
  confidence: number; // 0 to 100
  matchedKeywords: string[];
  description: string;
  terminology: DomainTerminology;
}

export interface SchemaProfileResult {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRowsSampled: number;
  estimatedTotalRows: number;
  detectedMappings: ColumnMappingConfig;
  detectedDomain: ProcessDomainInfo;
  missingRequiredColumns: string[];
  columnSuggestions: Record<string, string[]>;
  isValid: boolean;
  validationWarnings: string[];
}
