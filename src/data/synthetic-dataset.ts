/**
 * FlowLens AI - Synthetic Test Dataset Definition
 * Phase 1: Event Data Engine
 *
 * Designed specifically to validate that the bottleneck engine does NOT
 * simply select the stage with the longest processing time (Review, 60m),
 * but correctly identifies the hidden waiting queue bottleneck (Verification, 15m proc, ~200m wait).
 */

export const SYNTHETIC_HIDDEN_BOTTLENECK_CSV = `case_id,activity,start_time,end_time,resource_id,status
C101,Intake,2026-09-01 08:00:00,2026-09-01 08:10:00,R_IN_01,completed
C101,Verification,2026-09-01 11:30:00,2026-09-01 11:45:00,R_VR_01,completed
C101,Review,2026-09-01 11:50:00,2026-09-01 12:50:00,R_RV_01,completed
C101,Approval,2026-09-01 12:55:00,2026-09-01 13:05:00,R_AP_01,completed
C101,Dispatch,2026-09-01 13:10:00,2026-09-01 13:15:00,R_DP_01,completed
C102,Intake,2026-09-01 08:15:00,2026-09-01 08:25:00,R_IN_01,completed
C102,Verification,2026-09-01 11:55:00,2026-09-01 12:10:00,R_VR_02,completed
C102,Review,2026-09-01 12:15:00,2026-09-01 13:15:00,R_RV_02,completed
C102,Approval,2026-09-01 13:20:00,2026-09-01 13:30:00,R_AP_01,completed
C102,Dispatch,2026-09-01 13:35:00,2026-09-01 13:40:00,R_DP_01,completed
C103,Intake,2026-09-01 08:30:00,2026-09-01 08:40:00,R_IN_02,completed
C103,Verification,2026-09-01 12:20:00,2026-09-01 12:35:00,R_VR_01,completed
C103,Review,2026-09-01 12:40:00,2026-09-01 13:40:00,R_RV_01,completed
C103,Approval,2026-09-01 13:45:00,2026-09-01 13:55:00,R_AP_02,completed
C103,Dispatch,2026-09-01 14:00:00,2026-09-01 14:05:00,R_DP_02,completed
C104,Intake,2026-09-01 08:45:00,2026-09-01 08:55:00,R_IN_01,completed
C104,Verification,2026-09-01 12:45:00,2026-09-01 13:00:00,R_VR_02,completed
C104,Review,2026-09-01 13:05:00,2026-09-01 14:05:00,R_RV_02,completed
C104,Approval,2026-09-01 14:10:00,2026-09-01 14:20:00,R_AP_01,completed
C104,Dispatch,2026-09-01 14:25:00,2026-09-01 14:30:00,R_DP_01,completed
C105,Intake,2026-09-01 09:00:00,2026-09-01 09:10:00,R_IN_02,completed
C105,Verification,2026-09-01 13:10:00,2026-09-01 13:25:00,R_VR_01,completed
C105,Review,2026-09-01 13:30:00,2026-09-01 14:30:00,R_RV_01,completed
C105,Approval,2026-09-01 14:35:00,2026-09-01 14:45:00,R_AP_02,completed
C105,Dispatch,2026-09-01 14:50:00,2026-09-01 14:55:00,R_DP_02,completed
C106,Intake,2026-09-01 09:15:00,2026-09-01 09:25:00,R_IN_01,completed
C106,Verification,2026-09-01 13:35:00,2026-09-01 13:50:00,R_VR_02,completed
C106,Review,2026-09-01 13:55:00,2026-09-01 14:55:00,R_RV_02,completed
C106,Approval,2026-09-01 15:00:00,2026-09-01 15:10:00,R_AP_01,completed
C106,Dispatch,2026-09-01 15:15:00,2026-09-01 15:20:00,R_DP_01,completed
C107,Intake,2026-09-01 09:30:00,2026-09-01 09:40:00,R_IN_02,completed
C107,Verification,2026-09-01 14:00:00,2026-09-01 14:15:00,R_VR_01,completed
C107,Review,2026-09-01 14:20:00,2026-09-01 15:20:00,R_RV_01,completed
C107,Approval,2026-09-01 15:25:00,2026-09-01 15:35:00,R_AP_02,completed
C107,Dispatch,2026-09-01 15:40:00,2026-09-01 15:45:00,R_DP_02,completed
C108,Intake,2026-09-01 09:45:00,2026-09-01 09:55:00,R_IN_01,completed
C108,Verification,2026-09-01 14:25:00,2026-09-01 14:40:00,R_VR_02,completed
C108,Review,2026-09-01 14:45:00,2026-09-01 15:45:00,R_RV_02,completed
C108,Approval,2026-09-01 15:50:00,2026-09-01 16:00:00,R_AP_01,completed
C108,Dispatch,2026-09-01 16:05:00,2026-09-01 16:10:00,R_DP_01,completed
C109,Intake,2026-09-01 10:00:00,2026-09-01 10:10:00,R_IN_02,completed
C109,Verification,2026-09-01 14:50:00,2026-09-01 15:05:00,R_VR_01,completed
C109,Review,2026-09-01 15:10:00,2026-09-01 16:10:00,R_RV_01,completed
C109,Approval,2026-09-01 16:15:00,2026-09-01 16:25:00,R_AP_02,completed
C109,Dispatch,2026-09-01 16:30:00,2026-09-01 16:35:00,R_DP_02,completed
C110,Intake,2026-09-01 10:15:00,2026-09-01 10:25:00,R_IN_01,completed
C110,Verification,2026-09-01 15:15:00,2026-09-01 15:30:00,R_VR_02,completed
C110,Review,2026-09-01 15:35:00,2026-09-01 16:35:00,R_RV_02,completed
C110,Approval,2026-09-01 16:40:00,2026-09-01 16:50:00,R_AP_01,completed
C110,Dispatch,2026-09-01 16:55:00,2026-09-01 17:00:00,R_DP_01,completed`;

export const SYNTHETIC_EXPECTED_OUTCOME = {
  description:
    "Review has the highest processing time (60m avg, ~60% of processing time), but Verification has huge accumulated waiting time (~200m avg per case, >90% of all waiting time). Verification must emerge as the #1 delay contributor.",
  longestProcessingStage: "Review",
  trueBottleneckStage: "Verification",
  expectedTotalCases: 10,
  expectedTotalEvents: 50,
  expectedStagesCount: 5,
};
