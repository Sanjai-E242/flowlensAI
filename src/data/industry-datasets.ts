/**
 * FlowLens AI - Multi-Industry Demonstration Datasets
 * Demonstrates universal process intelligence across diverse economic sectors:
 * 1. Manufacturing (Precision Machining & Assembly)
 * 2. Logistics (Global Supply Chain & Freight Delivery)
 * 3. Banking / Finance (Commercial Loan Underwriting)
 * 4. Customer Operations (SaaS Incident Escalation & Resolution)
 * 5. Unusual Column Schema (Custom Column Names Validation)
 * 6. Healthcare (Emergency Department Care Pathway)
 */

import { HOSPITAL_EMERGENCY_CSV } from "./hospital-dataset";
import { SYNTHETIC_HIDDEN_BOTTLENECK_CSV } from "./synthetic-dataset";

export { HOSPITAL_EMERGENCY_CSV as HEALTHCARE_DEMO_CSV };
export { SYNTHETIC_HIDDEN_BOTTLENECK_CSV as BENCHMARK_DEMO_CSV };

/**
 * 1. MANUFACTURING DEMO
 * Order -> Raw Material -> Laser Cutting -> CNC Machining -> Quality Inspection -> Surface Finishing -> Final Packaging
 * Dominant Bottleneck: CNC_Machining (Capacity constrained queue stall)
 */
export const MANUFACTURING_DEMO_CSV = `order_id,operation,start_time,end_time,machine_id,status,department,priority
ORD_101,Raw_Material_Intake,2026-09-01 06:00:00,2026-09-01 06:20:00,MAT_BAY_1,completed,Materials,High
ORD_101,Laser_Cutting,2026-09-01 06:25:00,2026-09-01 07:10:00,LASER_01,completed,Fabrication,High
ORD_101,CNC_Machining,2026-09-01 09:30:00,2026-09-01 10:45:00,CNC_MILL_A,completed,Machining,High
ORD_101,Quality_Inspection,2026-09-01 10:50:00,2026-09-01 11:15:00,QA_STATION_1,completed,Inspection,High
ORD_101,Surface_Finishing,2026-09-01 11:20:00,2026-09-01 12:00:00,FINISH_BAY,completed,Finishing,High
ORD_101,Final_Packaging,2026-09-01 12:05:00,2026-09-01 12:30:00,PACK_01,completed,Logistics,High

ORD_102,Raw_Material_Intake,2026-09-01 06:15:00,2026-09-01 06:35:00,MAT_BAY_2,completed,Materials,Urgent
ORD_102,Laser_Cutting,2026-09-01 06:40:00,2026-09-01 07:25:00,LASER_02,completed,Fabrication,Urgent
ORD_102,CNC_Machining,2026-09-01 10:00:00,2026-09-01 11:20:00,CNC_MILL_B,completed,Machining,Urgent
ORD_102,Quality_Inspection,2026-09-01 11:25:00,2026-09-01 11:50:00,QA_STATION_2,completed,Inspection,Urgent
ORD_102,Surface_Finishing,2026-09-01 11:55:00,2026-09-01 12:35:00,FINISH_BAY,completed,Finishing,Urgent
ORD_102,Final_Packaging,2026-09-01 12:40:00,2026-09-01 13:05:00,PACK_02,completed,Logistics,Urgent

ORD_103,Raw_Material_Intake,2026-09-01 06:30:00,2026-09-01 06:50:00,MAT_BAY_1,completed,Materials,Routine
ORD_103,Laser_Cutting,2026-09-01 06:55:00,2026-09-01 07:40:00,LASER_01,completed,Fabrication,Routine
ORD_103,CNC_Machining,2026-09-01 10:45:00,2026-09-01 12:00:00,CNC_MILL_A,completed,Machining,Routine
ORD_103,Quality_Inspection,2026-09-01 12:05:00,2026-09-01 12:30:00,QA_STATION_1,completed,Inspection,Routine
ORD_103,Surface_Finishing,2026-09-01 12:35:00,2026-09-01 13:15:00,FINISH_BAY,completed,Finishing,Routine
ORD_103,Final_Packaging,2026-09-01 13:20:00,2026-09-01 13:45:00,PACK_01,completed,Logistics,Routine

ORD_104,Raw_Material_Intake,2026-09-01 06:45:00,2026-09-01 07:05:00,MAT_BAY_2,completed,Materials,High
ORD_104,Laser_Cutting,2026-09-01 07:15:00,2026-09-01 08:00:00,LASER_02,completed,Fabrication,High
ORD_104,CNC_Machining,2026-09-01 11:30:00,2026-09-01 12:45:00,CNC_MILL_B,completed,Machining,High
ORD_104,Quality_Inspection,2026-09-01 12:50:00,2026-09-01 13:15:00,QA_STATION_2,completed,Inspection,High
ORD_104,Surface_Finishing,2026-09-01 13:20:00,2026-09-01 14:00:00,FINISH_BAY,completed,Finishing,High
ORD_104,Final_Packaging,2026-09-01 14:05:00,2026-09-01 14:30:00,PACK_02,completed,Logistics,High

ORD_105,Raw_Material_Intake,2026-09-01 07:00:00,2026-09-01 07:20:00,MAT_BAY_1,completed,Materials,Urgent
ORD_105,Laser_Cutting,2026-09-01 07:30:00,2026-09-01 08:15:00,LASER_01,completed,Fabrication,Urgent
ORD_105,CNC_Machining,2026-09-01 12:15:00,2026-09-01 13:30:00,CNC_MILL_A,completed,Machining,Urgent
ORD_105,Quality_Inspection,2026-09-01 13:35:00,2026-09-01 14:00:00,QA_STATION_1,completed,Inspection,Urgent
ORD_105,Surface_Finishing,2026-09-01 14:05:00,2026-09-01 14:45:00,FINISH_BAY,completed,Finishing,Urgent
ORD_105,Final_Packaging,2026-09-01 14:50:00,2026-09-01 15:15:00,PACK_01,completed,Logistics,Urgent

ORD_106,Raw_Material_Intake,2026-09-01 07:15:00,2026-09-01 07:35:00,MAT_BAY_2,completed,Materials,Routine
ORD_106,Laser_Cutting,2026-09-01 07:45:00,2026-09-01 08:30:00,LASER_02,completed,Fabrication,Routine
ORD_106,CNC_Machining,2026-09-01 13:00:00,2026-09-01 14:15:00,CNC_MILL_B,completed,Machining,Routine
ORD_106,Quality_Inspection,2026-09-01 14:20:00,2026-09-01 14:45:00,QA_STATION_2,completed,Inspection,Routine
ORD_106,Surface_Finishing,2026-09-01 14:50:00,2026-09-01 15:30:00,FINISH_BAY,completed,Finishing,Routine
ORD_106,Final_Packaging,2026-09-01 15:35:00,2026-09-01 16:00:00,PACK_02,completed,Logistics,Routine`;

/**
 * 2. LOGISTICS DEMO
 * Order_Received -> Hub_Sorting -> Long_Haul_Transit -> Customs_Clearance -> Regional_Distribution -> Last_Mile_Delivery
 * Dominant Bottleneck: Customs_Clearance (Major queue waiting stall)
 */
export const LOGISTICS_DEMO_CSV = `shipment_number,step,start_time,end_time,vehicle_unit,status,hub_location,priority
SHP_401,Order_Received,2026-09-01 08:00:00,2026-09-01 08:15:00,INTAKE_DESK,completed,Central_Hub,Express
SHP_401,Hub_Sorting,2026-09-01 08:20:00,2026-09-01 09:00:00,AUTO_SORTER_1,completed,Central_Hub,Express
SHP_401,Long_Haul_Transit,2026-09-01 09:15:00,2026-09-01 13:15:00,TRUCK_LH_10,completed,Highway_Corridor,Express
SHP_401,Customs_Clearance,2026-09-01 16:30:00,2026-09-01 17:15:00,CUSTOMS_OFFICER_A,completed,Border_Terminal,Express
SHP_401,Regional_Distribution,2026-09-01 17:25:00,2026-09-01 18:30:00,VAN_DIST_01,completed,Regional_Depot,Express
SHP_401,Last_Mile_Delivery,2026-09-01 18:35:00,2026-09-01 19:15:00,COURIER_JAKE,completed,Customer_Zone,Express

SHP_402,Order_Received,2026-09-01 08:30:00,2026-09-01 08:45:00,INTAKE_DESK,completed,Central_Hub,Standard
SHP_402,Hub_Sorting,2026-09-01 08:50:00,2026-09-01 09:30:00,AUTO_SORTER_2,completed,Central_Hub,Standard
SHP_402,Long_Haul_Transit,2026-09-01 09:45:00,2026-09-01 13:45:00,TRUCK_LH_12,completed,Highway_Corridor,Standard
SHP_402,Customs_Clearance,2026-09-01 17:15:00,2026-09-01 18:00:00,CUSTOMS_OFFICER_B,completed,Border_Terminal,Standard
SHP_402,Regional_Distribution,2026-09-01 18:10:00,2026-09-01 19:15:00,VAN_DIST_02,completed,Regional_Depot,Standard
SHP_402,Last_Mile_Delivery,2026-09-01 19:20:00,2026-09-01 20:00:00,COURIER_LISA,completed,Customer_Zone,Standard

SHP_403,Order_Received,2026-09-01 09:00:00,2026-09-01 09:15:00,INTAKE_DESK,completed,Central_Hub,Express
SHP_403,Hub_Sorting,2026-09-01 09:20:00,2026-09-01 10:00:00,AUTO_SORTER_1,completed,Central_Hub,Express
SHP_403,Long_Haul_Transit,2026-09-01 10:15:00,2026-09-01 14:15:00,TRUCK_LH_10,completed,Highway_Corridor,Express
SHP_403,Customs_Clearance,2026-09-01 18:00:00,2026-09-01 18:45:00,CUSTOMS_OFFICER_A,completed,Border_Terminal,Express
SHP_403,Regional_Distribution,2026-09-01 18:55:00,2026-09-01 20:00:00,VAN_DIST_01,completed,Regional_Depot,Express
SHP_403,Last_Mile_Delivery,2026-09-01 20:05:00,2026-09-01 20:45:00,COURIER_JAKE,completed,Customer_Zone,Express

SHP_404,Order_Received,2026-09-01 09:30:00,2026-09-01 09:45:00,INTAKE_DESK,completed,Central_Hub,Standard
SHP_404,Hub_Sorting,2026-09-01 09:50:00,2026-09-01 10:30:00,AUTO_SORTER_2,completed,Central_Hub,Standard
SHP_404,Long_Haul_Transit,2026-09-01 10:45:00,2026-09-01 14:45:00,TRUCK_LH_12,completed,Highway_Corridor,Standard
SHP_404,Customs_Clearance,2026-09-01 18:45:00,2026-09-01 19:30:00,CUSTOMS_OFFICER_B,completed,Border_Terminal,Standard
SHP_404,Regional_Distribution,2026-09-01 19:40:00,2026-09-01 20:45:00,VAN_DIST_02,completed,Regional_Depot,Standard
SHP_404,Last_Mile_Delivery,2026-09-01 20:50:00,2026-09-01 21:30:00,COURIER_LISA,completed,Customer_Zone,Standard`;

/**
 * 3. BANKING DEMO
 * Application_Intake -> KYC_Verification -> Credit_Risk_Scoring -> Manual_Underwriting -> Compliance_Audit -> Fund_Disbursement
 * Dominant Bottleneck: Manual_Underwriting (Underwriting queue bottleneck)
 */
export const BANKING_DEMO_CSV = `application_ref,stage_name,started_at,completed_at,officer_id,status,risk_tier,branch
LN_7001,Application_Intake,2026-09-01 09:00:00,2026-09-01 09:20:00,PORTAL_AUTO,completed,Tier_1,Digital
LN_7001,KYC_Verification,2026-09-01 09:25:00,2026-09-01 10:00:00,KYC_ANALYST_1,completed,Tier_1,Digital
LN_7001,Credit_Risk_Scoring,2026-09-01 10:05:00,2026-09-01 10:25:00,FICO_ENGINE,completed,Tier_1,Digital
LN_7001,Manual_Underwriting,2026-09-01 13:45:00,2026-09-01 14:50:00,SR_UW_MICHAEL,completed,Tier_1,Headquarters
LN_7001,Compliance_Audit,2026-09-01 14:55:00,2026-09-01 15:20:00,AUDIT_OFFICER,completed,Tier_1,Headquarters
LN_7001,Fund_Disbursement,2026-09-01 15:25:00,2026-09-01 15:45:00,ACH_GATEWAY,completed,Tier_1,Digital

LN_7002,Application_Intake,2026-09-01 09:30:00,2026-09-01 09:50:00,PORTAL_AUTO,completed,Tier_2,Metro_Branch
LN_7002,KYC_Verification,2026-09-01 09:55:00,2026-09-01 10:30:00,KYC_ANALYST_2,completed,Tier_2,Metro_Branch
LN_7002,Credit_Risk_Scoring,2026-09-01 10:35:00,2026-09-01 10:55:00,FICO_ENGINE,completed,Tier_2,Metro_Branch
LN_7002,Manual_Underwriting,2026-09-01 14:30:00,2026-09-01 15:35:00,SR_UW_SARAH,completed,Tier_2,Headquarters
LN_7002,Compliance_Audit,2026-09-01 15:40:00,2026-09-01 16:05:00,AUDIT_OFFICER,completed,Tier_2,Headquarters
LN_7002,Fund_Disbursement,2026-09-01 16:10:00,2026-09-01 16:30:00,ACH_GATEWAY,completed,Tier_2,Metro_Branch

LN_7003,Application_Intake,2026-09-01 10:00:00,2026-09-01 10:20:00,PORTAL_AUTO,completed,Tier_1,Digital
LN_7003,KYC_Verification,2026-09-01 10:25:00,2026-09-01 11:00:00,KYC_ANALYST_1,completed,Tier_1,Digital
LN_7003,Credit_Risk_Scoring,2026-09-01 11:05:00,2026-09-01 11:25:00,FICO_ENGINE,completed,Tier_1,Digital
LN_7003,Manual_Underwriting,2026-09-01 15:15:00,2026-09-01 16:20:00,SR_UW_MICHAEL,completed,Tier_1,Headquarters
LN_7003,Compliance_Audit,2026-09-01 16:25:00,2026-09-01 16:50:00,AUDIT_OFFICER,completed,Tier_1,Headquarters
LN_7003,Fund_Disbursement,2026-09-01 16:55:00,2026-09-01 17:15:00,ACH_GATEWAY,completed,Tier_1,Digital

LN_7004,Application_Intake,2026-09-01 10:30:00,2026-09-01 10:50:00,PORTAL_AUTO,completed,Tier_3,Metro_Branch
LN_7004,KYC_Verification,2026-09-01 10:55:00,2026-09-01 11:30:00,KYC_ANALYST_2,completed,Tier_3,Metro_Branch
LN_7004,Credit_Risk_Scoring,2026-09-01 11:35:00,2026-09-01 11:55:00,FICO_ENGINE,completed,Tier_3,Metro_Branch
LN_7004,Manual_Underwriting,2026-09-01 16:00:00,2026-09-01 17:05:00,SR_UW_SARAH,completed,Tier_3,Headquarters
LN_7004,Compliance_Audit,2026-09-01 17:10:00,2026-09-01 17:35:00,AUDIT_OFFICER,completed,Tier_3,Headquarters
LN_7004,Fund_Disbursement,2026-09-01 17:40:00,2026-09-01 18:00:00,ACH_GATEWAY,completed,Tier_3,Metro_Branch`;

/**
 * 4. CUSTOMER OPERATIONS DEMO
 * Ticket_Ingestion -> Automated_Triaging -> Tier1_Investigation -> Engineering_Escalation -> QA_Review -> Customer_Resolution
 * Dominant Bottleneck: Engineering_Escalation (Prolonged queue before dev assignment)
 */
export const CUSTOMER_OPS_DEMO_CSV = `ticket_id,action,start_time,end_time,agent_id,status,channel,priority
TCK_901,Ticket_Ingestion,2026-09-01 08:00:00,2026-09-01 08:05:00,WEBHOOK,completed,Web_Portal,P1_Critical
TCK_901,Automated_Triaging,2026-09-01 08:05:00,2026-09-01 08:15:00,AI_CLASSIFIER,completed,Web_Portal,P1_Critical
TCK_901,Tier1_Investigation,2026-09-01 08:20:00,2026-09-01 09:00:00,AGENT_EMILY,completed,Web_Portal,P1_Critical
TCK_901,Engineering_Escalation,2026-09-01 11:30:00,2026-09-01 13:00:00,DEV_LEAD_ALEX,completed,Jira_Sync,P1_Critical
TCK_901,QA_Review,2026-09-01 13:05:00,2026-09-01 13:35:00,QA_TESTER_SAM,completed,Staging_Env,P1_Critical
TCK_901,Customer_Resolution,2026-09-01 13:40:00,2026-09-01 14:00:00,AGENT_EMILY,completed,Web_Portal,P1_Critical

TCK_902,Ticket_Ingestion,2026-09-01 08:30:00,2026-09-01 08:35:00,WEBHOOK,completed,Email_Inbound,P2_High
TCK_902,Automated_Triaging,2026-09-01 08:35:00,2026-09-01 08:45:00,AI_CLASSIFIER,completed,Email_Inbound,P2_High
TCK_902,Tier1_Investigation,2026-09-01 08:50:00,2026-09-01 09:30:00,AGENT_DANIEL,completed,Email_Inbound,P2_High
TCK_902,Engineering_Escalation,2026-09-01 12:15:00,2026-09-01 13:45:00,DEV_SENIOR_RAY,completed,Jira_Sync,P2_High
TCK_902,QA_Review,2026-09-01 13:50:00,2026-09-01 14:20:00,QA_TESTER_SAM,completed,Staging_Env,P2_High
TCK_902,Customer_Resolution,2026-09-01 14:25:00,2026-09-01 14:45:00,AGENT_DANIEL,completed,Email_Inbound,P2_High

TCK_903,Ticket_Ingestion,2026-09-01 09:00:00,2026-09-01 09:05:00,WEBHOOK,completed,Web_Portal,P1_Critical
TCK_903,Automated_Triaging,2026-09-01 09:05:00,2026-09-01 09:15:00,AI_CLASSIFIER,completed,Web_Portal,P1_Critical
TCK_903,Tier1_Investigation,2026-09-01 09:20:00,2026-09-01 10:00:00,AGENT_EMILY,completed,Web_Portal,P1_Critical
TCK_903,Engineering_Escalation,2026-09-01 13:00:00,2026-09-01 14:30:00,DEV_LEAD_ALEX,completed,Jira_Sync,P1_Critical
TCK_903,QA_Review,2026-09-01 14:35:00,2026-09-01 15:05:00,QA_TESTER_SAM,completed,Staging_Env,P1_Critical
TCK_903,Customer_Resolution,2026-09-01 15:10:00,2026-09-01 15:30:00,AGENT_EMILY,completed,Web_Portal,P1_Critical`;

/**
 * 5. UNUSUAL COLUMNS DEMO (Part 40 requirement)
 * Tests semantic equivalent recognition when column names are custom / non-standard:
 * request_number, process_step, started_at, completed_at, operator, state
 */
export const UNUSUAL_COLUMNS_CSV = `request_number,process_step,started_at,completed_at,operator,state
REQ-501,Order_Verification,2026-09-01 10:00:00,2026-09-01 10:20:00,OP_JOHN,closed
REQ-501,Inventory_Allocation,2026-09-01 10:25:00,2026-09-01 10:50:00,OP_CLARA,closed
REQ-501,Assembly_Execution,2026-09-01 12:30:00,2026-09-01 13:45:00,OP_TECH_A,closed
REQ-501,Final_Audit,2026-09-01 13:50:00,2026-09-01 14:15:00,OP_AUDITOR,closed

REQ-502,Order_Verification,2026-09-01 10:30:00,2026-09-01 10:50:00,OP_JOHN,closed
REQ-502,Inventory_Allocation,2026-09-01 10:55:00,2026-09-01 11:20:00,OP_CLARA,closed
REQ-502,Assembly_Execution,2026-09-01 13:15:00,2026-09-01 14:30:00,OP_TECH_B,closed
REQ-502,Final_Audit,2026-09-01 14:35:00,2026-09-01 15:00:00,OP_AUDITOR,closed

REQ-503,Order_Verification,2026-09-01 11:00:00,2026-09-01 11:20:00,OP_JOHN,closed
REQ-503,Inventory_Allocation,2026-09-01 11:25:00,2026-09-01 11:50:00,OP_CLARA,closed
REQ-503,Assembly_Execution,2026-09-01 14:00:00,2026-09-01 15:15:00,OP_TECH_A,closed
REQ-503,Final_Audit,2026-09-01 15:20:00,2026-09-01 15:45:00,OP_AUDITOR,closed`;

/**
 * Demo Presets Registry
 */
export interface DemoDatasetPreset {
  id: string;
  name: string;
  domain: string;
  description: string;
  csv: string;
  expectedBottleneck: string;
  badge: string;
}

export const DEMO_PRESETS: DemoDatasetPreset[] = [
  {
    id: "benchmark",
    name: "Synthetic Benchmark (Hidden Queue)",
    domain: "Enterprise Operations",
    description: "Multi-stage loan & account onboarding demonstrating hidden upstream queue stalls.",
    csv: SYNTHETIC_HIDDEN_BOTTLENECK_CSV,
    expectedBottleneck: "Verification",
    badge: "Benchmark",
  },
  {
    id: "manufacturing",
    name: "Precision Manufacturing Operations",
    domain: "Manufacturing",
    description: "CNC milling, laser fabrication, and inspection showing machine capacity bottlenecks.",
    csv: MANUFACTURING_DEMO_CSV,
    expectedBottleneck: "CNC_Machining",
    badge: "Industrial",
  },
  {
    id: "logistics",
    name: "Global Express Freight & Delivery",
    domain: "Logistics",
    description: "Multi-hub freight transit, border terminal clearance, and last-mile dispatch.",
    csv: LOGISTICS_DEMO_CSV,
    expectedBottleneck: "Customs_Clearance",
    badge: "Supply Chain",
  },
  {
    id: "banking",
    name: "Commercial Loan Underwriting",
    domain: "Banking",
    description: "Digital loan origination, KYC audit, credit scoring, and senior underwriter queues.",
    csv: BANKING_DEMO_CSV,
    expectedBottleneck: "Manual_Underwriting",
    badge: "FinTech",
  },
  {
    id: "customer_ops",
    name: "SaaS Incident Escalation",
    domain: "Customer Operations",
    description: "High-volume customer support tickets, triaging, and engineering escalation delays.",
    csv: CUSTOMER_OPS_DEMO_CSV,
    expectedBottleneck: "Engineering_Escalation",
    badge: "Operations",
  },
  {
    id: "healthcare",
    name: "Emergency Department Clinical Flow",
    domain: "Healthcare",
    description: "Hospital emergency admissions, triage, consultation, testing, and discharge.",
    csv: HOSPITAL_EMERGENCY_CSV,
    expectedBottleneck: "Doctor_Consultation",
    badge: "Clinical Care",
  },
];
