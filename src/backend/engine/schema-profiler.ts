/**
 * FlowLens AI - Universal Schema Profiler & Domain Detection Engine
 * Discovers column roles, validates event schemas, and detects process domains
 */

import {
  ColumnMappingConfig,
  ProcessDomain,
  ProcessDomainInfo,
  SchemaProfileResult,
  DomainTerminology,
} from "@/shared/types";
import { CANONICAL_ALIASES } from "./constants";
import { tokenizeCsvLine, normalizeColumnKey } from "./csv-parser";

/**
 * Domain-specific terminology definitions
 */
export const DOMAIN_TERMINOLOGY: Record<ProcessDomain, DomainTerminology> = {
  Manufacturing: {
    caseLabel: "Work Order",
    caseLabelPlural: "Work Orders",
    activityLabel: "Operation / Step",
    resourceLabel: "Machine / Workcenter",
    resourceLabelPlural: "Machines & Workcenters",
  },
  Logistics: {
    caseLabel: "Shipment / Waybill",
    caseLabelPlural: "Shipments",
    activityLabel: "Transport Leg / Hub Step",
    resourceLabel: "Carrier / Vehicle Unit",
    resourceLabelPlural: "Vehicles & Hub Teams",
  },
  Banking: {
    caseLabel: "Application / Case",
    caseLabelPlural: "Applications",
    activityLabel: "Underwriting Stage",
    resourceLabel: "Credit Officer / System",
    resourceLabelPlural: "Underwriters & Analysts",
  },
  "Customer Operations": {
    caseLabel: "Support Ticket",
    caseLabelPlural: "Support Tickets",
    activityLabel: "Lifecycle Action",
    resourceLabel: "Support Agent / Tier",
    resourceLabelPlural: "Agents & Engineers",
  },
  Healthcare: {
    caseLabel: "Patient Encounter",
    caseLabelPlural: "Patient Encounters",
    activityLabel: "Clinical Pathway Step",
    resourceLabel: "Clinician / Care Resource",
    resourceLabelPlural: "Clinicians & Staff",
  },
  "E-commerce": {
    caseLabel: "Customer Order",
    caseLabelPlural: "Orders",
    activityLabel: "Fulfillment Step",
    resourceLabel: "Fulfillment Station",
    resourceLabelPlural: "Fulfillment Stations",
  },
  Insurance: {
    caseLabel: "Insurance Claim",
    caseLabelPlural: "Claims",
    activityLabel: "Adjudication Stage",
    resourceLabel: "Adjuster / Examiner",
    resourceLabelPlural: "Adjusters & Assessors",
  },
  "Enterprise Operations": {
    caseLabel: "Process Case",
    caseLabelPlural: "Process Cases",
    activityLabel: "Workflow Stage",
    resourceLabel: "Operator / Department",
    resourceLabelPlural: "Operators & Systems",
  },
  "Supply Chain": {
    caseLabel: "PO / Line Item",
    caseLabelPlural: "Purchase Orders",
    activityLabel: "Procurement Milestone",
    resourceLabel: "Supplier / Dock",
    resourceLabelPlural: "Suppliers & Facilities",
  },
  "General Operations": {
    caseLabel: "Process Case",
    caseLabelPlural: "Cases",
    activityLabel: "Process Stage",
    resourceLabel: "Resource",
    resourceLabelPlural: "Resources",
  },
};

/**
 * Keywords for domain detection
 */
const DOMAIN_KEYWORDS: Record<Exclude<ProcessDomain, "General Operations">, string[]> = {
  Manufacturing: [
    "laser", "cutting", "machining", "cnc", "assembly", "fabrication", "inspection",
    "milling", "finishing", "packaging", "weld", "tooling", "workcenter", "spindle",
    "raw_material", "plant", "stamping", "machine", "production", "manufactur"
  ],
  Logistics: [
    "shipment", "freight", "transit", "carrier", "sorting", "customs", "delivery",
    "hub", "courier", "vehicle", "warehouse", "tracking", "route", "cargo", "depot",
    "port", "clearance", "waybill", "logistics"
  ],
  Banking: [
    "kyc", "underwriting", "loan", "credit", "mortgage", "disbursement", "compliance",
    "audit", "fico", "officer", "borrower", "interest", "portfolio", "application",
    "branch", "banking", "finance", "disburse"
  ],
  "Customer Operations": [
    "ticket", "escalation", "inquiry", "support", "agent", "resolution", "jira",
    "helpdesk", "zendesk", "customer", "first_response", "incident", "channel",
    "webhook", "chat", "reopen", "triage"
  ],
  Healthcare: [
    "triage", "doctor", "consultation", "patient", "nurse", "clinic", "clinical",
    "hospital", "prescription", "diagnostic", "pharmacy", "discharge", "admissions",
    "physician", "vital", "ward", "medical"
  ],
  "E-commerce": [
    "cart", "checkout", "fulfillment", "order", "return", "refund", "sku",
    "catalog", "buyer", "seller", "payment", "merchant"
  ],
  Insurance: [
    "claim", "adjuster", "policy", "liability", "coverage", "premium", "payout",
    "settlement", "underwriter", "appraisal", "insurance"
  ],
  "Enterprise Operations": [
    "onboarding", "verification", "intake", "review", "approval", "dispatch",
    "contract", "procurement", "invoice", "vendor", "requisition", "enterprise"
  ],
  "Supply Chain": [
    "supplier", "purchase_order", "replenishment", "inbound", "outbound", "inventory",
    "stock", "dock", "lead_time", "supply_chain"
  ],
};

/**
 * Detects domain from headers and sample records
 */
export function detectProcessDomain(
  headers: string[],
  sampleRows: Record<string, string>[] = []
): ProcessDomainInfo {
  // Aggregate text corpus from headers and row values
  const corpus = [
    ...headers,
    ...sampleRows.flatMap((r) => Object.values(r)),
  ].join(" ").toLowerCase();

  const domainScores: Array<{ domain: ProcessDomain; score: number; matches: string[] }> = [];

  for (const [domainName, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const domain = domainName as Exclude<ProcessDomain, "General Operations">;
    let score = 0;
    const matches: string[] = [];

    for (const kw of keywords) {
      if (corpus.includes(kw.toLowerCase())) {
        score += 1;
        matches.push(kw);
      }
    }

    if (score > 0) {
      domainScores.push({ domain, score, matches });
    }
  }

  // Sort by score descending
  domainScores.sort((a, b) => b.score - a.score);

  if (domainScores.length > 0 && domainScores[0].score >= 2) {
    const top = domainScores[0];
    const confidence = Math.min(95, Math.max(50, 40 + top.score * 12));
    return {
      domain: top.domain,
      confidence,
      matchedKeywords: top.matches.slice(0, 5),
      description: `Domain identified as ${top.domain} based on observed activities and column attributes.`,
      terminology: DOMAIN_TERMINOLOGY[top.domain],
    };
  }

  return {
    domain: "General Operations",
    confidence: 60,
    matchedKeywords: [],
    description: "Universal event log analyzed with domain-agnostic enterprise process intelligence.",
    terminology: DOMAIN_TERMINOLOGY["General Operations"],
  };
}

/**
 * Auto-detects canonical column mappings for a set of CSV headers.
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMappingConfig {
  const mapping: ColumnMappingConfig = {};
  const usedHeaders = new Set<string>();

  // Canonical fields in strict priority order
  const canonicalFields: Array<keyof ColumnMappingConfig> = [
    "case_id",
    "activity",
    "start_time",
    "end_time",
    "resource_id",
    "status",
    "priority",
    "location",
  ];

  for (const field of canonicalFields) {
    const aliases = CANONICAL_ALIASES[field] || [];
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const normalizedHeader = normalizeColumnKey(header);

      for (const alias of aliases) {
        const normalizedAlias = normalizeColumnKey(alias);
        if (normalizedHeader === normalizedAlias) {
          bestMatch = header;
          bestScore = 2; // Exact match
          break;
        } else if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
          if (bestScore < 1) {
            bestMatch = header;
            bestScore = 1; // Substring match
          }
        }
      }

      if (bestScore === 2) break;
    }

    if (bestMatch) {
      mapping[field] = bestMatch;
      usedHeaders.add(bestMatch);
    }
  }

  return mapping;
}

/**
 * Full CSV profiling: extracts headers, samples rows, detects columns, domain, and validation status
 */
export function profileCsvSchema(
  csvText: string,
  userMapping?: ColumnMappingConfig
): SchemaProfileResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      headers: [],
      sampleRows: [],
      totalRowsSampled: 0,
      estimatedTotalRows: 0,
      detectedMappings: {},
      detectedDomain: {
        domain: "General Operations",
        confidence: 0,
        matchedKeywords: [],
        description: "Empty dataset provided.",
        terminology: DOMAIN_TERMINOLOGY["General Operations"],
      },
      missingRequiredColumns: ["case_id", "activity", "start_time", "end_time"],
      columnSuggestions: {},
      isValid: false,
      validationWarnings: ["The provided CSV file contains no content or rows."],
    };
  }

  const rawHeaders = tokenizeCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => h.trim());

  // Sample up to 10 rows
  const sampleLimit = Math.min(10, lines.length - 1);
  const sampleRows: Record<string, string>[] = [];

  for (let i = 1; i <= sampleLimit; i++) {
    const tokens = tokenizeCsvLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = tokens[idx] !== undefined ? tokens[idx].trim() : "";
    });
    sampleRows.push(rowObj);
  }

  // Merge auto-detected mapping with user-supplied mapping
  const autoMapping = autoDetectColumnMapping(headers);
  const detectedMappings: ColumnMappingConfig = {
    ...autoMapping,
    ...(userMapping || {}),
  };

  // Detect domain
  const detectedDomain = detectProcessDomain(headers, sampleRows);

  // Validate required canonical roles
  const requiredFields: Array<keyof ColumnMappingConfig> = [
    "case_id",
    "activity",
    "start_time",
    "end_time",
  ];

  const missingRequiredColumns: string[] = [];
  const validationWarnings: string[] = [];
  const columnSuggestions: Record<string, string[]> = {};

  for (const req of requiredFields) {
    if (!detectedMappings[req]) {
      missingRequiredColumns.push(req);

      // Look for fuzzy potential column candidates in headers to assist user
      const aliases = CANONICAL_ALIASES[req] || [];
      const potentials = headers.filter((h) => {
        const norm = normalizeColumnKey(h);
        return aliases.some((a) => norm.includes(normalizeColumnKey(a)) || normalizeColumnKey(a).includes(norm));
      });

      columnSuggestions[req] = potentials.length > 0 ? potentials : headers.slice(0, 3);
      validationWarnings.push(
        `Unable to identify '${req}' automatically. Please select the matching column from your CSV.`
      );
    }
  }

  const isValid = missingRequiredColumns.length === 0;

  return {
    headers,
    sampleRows,
    totalRowsSampled: sampleRows.length,
    estimatedTotalRows: Math.max(0, lines.length - 1),
    detectedMappings,
    detectedDomain,
    missingRequiredColumns,
    columnSuggestions,
    isValid,
    validationWarnings,
  };
}
