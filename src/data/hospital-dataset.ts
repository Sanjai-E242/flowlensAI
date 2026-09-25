/**
 * FlowLens AI - Realistic Hospital Emergency Department Dataset
 * Generic Process Engine Test Dataset (Part 5 Compliance)
 *
 * Fields: case_id, activity, start_time, end_time, resource_id, status, location, priority
 * Process Stages: Registration -> Triage -> Doctor_Consultation -> Diagnostic_Test -> Pharmacy -> Discharge
 */

export const HOSPITAL_EMERGENCY_CSV = `case_id,activity,start_time,end_time,resource_id,status,location,priority
P201,Registration,2026-09-02 08:00:00,2026-09-02 08:06:00,DESK_01,completed,Admissions,Urgent
P201,Triage,2026-09-02 08:08:00,2026-09-02 08:18:00,RN_SARAH,completed,Triage_Bay_A,Urgent
P201,Doctor_Consultation,2026-09-02 09:35:00,2026-09-02 09:55:00,DR_CHEN,completed,Exam_Room_1,Urgent
P201,Diagnostic_Test,2026-09-02 10:00:00,2026-09-02 10:25:00,TECH_ALEX,completed,Radiology_Lab,Urgent
P201,Pharmacy,2026-09-02 10:35:00,2026-09-02 10:45:00,PHARM_LISA,completed,Pharmacy_Window,Urgent
P201,Discharge,2026-09-02 10:48:00,2026-09-02 10:55:00,RN_SARAH,completed,Discharge_Lounge,Urgent
P202,Registration,2026-09-02 08:05:00,2026-09-02 08:12:00,DESK_02,completed,Admissions,High
P202,Triage,2026-09-02 08:15:00,2026-09-02 08:24:00,RN_MARK,completed,Triage_Bay_B,High
P202,Doctor_Consultation,2026-09-02 09:50:00,2026-09-02 10:12:00,DR_SMITH,completed,Exam_Room_2,High
P202,Diagnostic_Test,2026-09-02 10:18:00,2026-09-02 10:42:00,TECH_ALEX,completed,Radiology_Lab,High
P202,Pharmacy,2026-09-02 10:50:00,2026-09-02 11:00:00,PHARM_LISA,completed,Pharmacy_Window,High
P202,Discharge,2026-09-02 11:05:00,2026-09-02 11:12:00,RN_MARK,completed,Discharge_Lounge,High
P203,Registration,2026-09-02 08:15:00,2026-09-02 08:22:00,DESK_01,completed,Admissions,Routine
P203,Triage,2026-09-02 08:25:00,2026-09-02 08:33:00,RN_SARAH,completed,Triage_Bay_A,Routine
P203,Doctor_Consultation,2026-09-02 10:15:00,2026-09-02 10:35:00,DR_CHEN,completed,Exam_Room_1,Routine
P203,Diagnostic_Test,2026-09-02 10:45:00,2026-09-02 11:10:00,TECH_ALEX,completed,Radiology_Lab,Routine
P203,Pharmacy,2026-09-02 11:20:00,2026-09-02 11:30:00,PHARM_JAMES,completed,Pharmacy_Window,Routine
P203,Discharge,2026-09-02 11:35:00,2026-09-02 11:42:00,RN_SARAH,completed,Discharge_Lounge,Routine
P204,Registration,2026-09-02 08:25:00,2026-09-02 08:31:00,DESK_02,completed,Admissions,Urgent
P204,Triage,2026-09-02 08:35:00,2026-09-02 08:44:00,RN_MARK,completed,Triage_Bay_B,Urgent
P204,Doctor_Consultation,2026-09-02 10:30:00,2026-09-02 10:52:00,DR_SMITH,completed,Exam_Room_2,Urgent
P204,Diagnostic_Test,2026-09-02 11:00:00,2026-09-02 11:24:00,TECH_ALEX,completed,Radiology_Lab,Urgent
P204,Pharmacy,2026-09-02 11:35:00,2026-09-02 11:45:00,PHARM_LISA,completed,Pharmacy_Window,Urgent
P204,Discharge,2026-09-02 11:50:00,2026-09-02 11:58:00,RN_MARK,completed,Discharge_Lounge,Urgent
P205,Registration,2026-09-02 08:40:00,2026-09-02 08:47:00,DESK_01,completed,Admissions,High
P205,Triage,2026-09-02 08:50:00,2026-09-02 09:00:00,RN_SARAH,completed,Triage_Bay_A,High
P205,Doctor_Consultation,2026-09-02 10:55:00,2026-09-02 11:18:00,DR_CHEN,completed,Exam_Room_1,High
P205,Diagnostic_Test,2026-09-02 11:25:00,2026-09-02 11:50:00,TECH_ALEX,completed,Radiology_Lab,High
P205,Pharmacy,2026-09-02 12:00:00,2026-09-02 12:10:00,PHARM_JAMES,completed,Pharmacy_Window,High
P205,Discharge,2026-09-02 12:15:00,2026-09-02 12:22:00,RN_SARAH,completed,Discharge_Lounge,High
P206,Registration,2026-09-02 08:55:00,2026-09-02 09:02:00,DESK_02,completed,Admissions,Routine
P206,Triage,2026-09-02 09:05:00,2026-09-02 09:14:00,RN_MARK,completed,Triage_Bay_B,Routine
P206,Doctor_Consultation,2026-09-02 11:20:00,2026-09-02 11:40:00,DR_SMITH,completed,Exam_Room_2,Routine
P206,Diagnostic_Test,2026-09-02 11:48:00,2026-09-02 12:12:00,TECH_ALEX,completed,Radiology_Lab,Routine
P206,Pharmacy,2026-09-02 12:20:00,2026-09-02 12:30:00,PHARM_LISA,completed,Pharmacy_Window,Routine
P206,Discharge,2026-09-02 12:35:00,2026-09-02 12:42:00,RN_MARK,completed,Discharge_Lounge,Routine
P207,Registration,2026-09-02 09:10:00,2026-09-02 09:17:00,DESK_01,completed,Admissions,Urgent
P207,Triage,2026-09-02 09:20:00,2026-09-02 09:29:00,RN_SARAH,completed,Triage_Bay_A,Urgent
P207,Doctor_Consultation,2026-09-02 11:45:00,2026-09-02 12:05:00,DR_CHEN,completed,Exam_Room_1,Urgent
P207,Diagnostic_Test,2026-09-02 12:15:00,2026-09-02 12:38:00,TECH_ALEX,completed,Radiology_Lab,Urgent
P207,Pharmacy,2026-09-02 12:45:00,2026-09-02 12:55:00,PHARM_JAMES,completed,Pharmacy_Window,Urgent
P207,Discharge,2026-09-02 13:00:00,2026-09-02 13:08:00,RN_SARAH,completed,Discharge_Lounge,Urgent
P208,Registration,2026-09-02 09:25:00,2026-09-02 09:32:00,DESK_02,completed,Admissions,High
P208,Triage,2026-09-02 09:35:00,2026-09-02 09:44:00,RN_MARK,completed,Triage_Bay_B,High
P208,Doctor_Consultation,2026-09-02 12:10:00,2026-09-02 12:32:00,DR_SMITH,completed,Exam_Room_2,High
P208,Diagnostic_Test,2026-09-02 12:40:00,2026-09-02 13:05:00,TECH_ALEX,completed,Radiology_Lab,High
P208,Pharmacy,2026-09-02 13:15:00,2026-09-02 13:25:00,PHARM_LISA,completed,Pharmacy_Window,High
P208,Discharge,2026-09-02 13:30:00,2026-09-02 13:38:00,RN_MARK,completed,Discharge_Lounge,High`;
