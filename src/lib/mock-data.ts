import type {
  User,
  DiseaseType,
  Questionnaire,
  UserResponse,
  RiskDetection,
  Notification,
  DashboardStats,
  MenuItem,
} from "@/types";

export const mockUsers: User[] = [
  { id: "u1", nickname: "Alex Morgan", email: "alex@example.com", phone: "+1 (555) 123-4567", status: "active", riskLevel: "low", createdAt: "2026-01-15T10:30:00Z", lastActive: "2026-05-06T14:22:00Z" },
  { id: "u2", nickname: "Sarah Chen", email: "sarah@example.com", phone: "+1 (555) 234-5678", status: "active", riskLevel: "moderate", createdAt: "2026-02-20T08:15:00Z", lastActive: "2026-05-06T09:10:00Z" },
  { id: "u3", nickname: "James Wilson", email: "james@example.com", phone: "+1 (555) 345-6789", status: "active", riskLevel: "high", createdAt: "2026-01-05T14:00:00Z", lastActive: "2026-05-05T16:45:00Z" },
  { id: "u4", nickname: "Emma Thompson", email: "emma@example.com", phone: "+1 (555) 456-7890", status: "inactive", riskLevel: "low", createdAt: "2026-03-10T11:20:00Z", lastActive: "2026-04-28T10:00:00Z" },
  { id: "u5", nickname: "Michael Brown", email: "michael@example.com", phone: "+1 (555) 567-8901", status: "active", riskLevel: "critical", createdAt: "2025-12-01T09:00:00Z", lastActive: "2026-05-06T12:30:00Z" },
  { id: "u6", nickname: "Lisa Davis", email: "lisa@example.com", phone: "+1 (555) 678-9012", status: "suspended", riskLevel: "high", createdAt: "2026-01-25T16:40:00Z", lastActive: "2026-05-03T08:15:00Z" },
  { id: "u7", nickname: "David Kim", email: "david@example.com", phone: "+1 (555) 789-0123", status: "active", riskLevel: "moderate", createdAt: "2026-04-01T13:10:00Z", lastActive: "2026-05-06T11:00:00Z" },
  { id: "u8", nickname: "Rachel Green", email: "rachel@example.com", phone: "+1 (555) 890-1234", status: "active", riskLevel: "low", createdAt: "2026-04-15T07:30:00Z", lastActive: "2026-05-05T19:20:00Z" },
];

export const mockDiseaseTypes: DiseaseType[] = [
  { id: "d1", name: "Anxiety Disorder", description: "Generalized anxiety, panic attacks, and social anxiety", icon: "brain", questionCount: 15, active: true },
  { id: "d2", name: "Depression", description: "Major depressive disorder and persistent depressive disorder", icon: "heart", questionCount: 18, active: true },
  { id: "d3", name: "Bipolar Disorder", description: "Mood episodes including mania and depression", icon: "activity", questionCount: 12, active: true },
  { id: "d4", name: "PTSD", description: "Post-traumatic stress disorder assessment", icon: "shield", questionCount: 14, active: true },
  { id: "d5", name: "OCD", description: "Obsessive-compulsive disorder screening", icon: "refresh-cw", questionCount: 10, active: false },
  { id: "d6", name: "ADHD", description: "Attention deficit hyperactivity disorder assessment", icon: "zap", questionCount: 16, active: true },
];

export const mockQuestionnaires: Questionnaire[] = [
  {
    id: "q1", title: "Anxiety Assessment - Phase 1", diseaseTypeId: "d1", diseaseType: "Anxiety Disorder",
    questions: [
      { id: "q1_1", text: "How often have you felt nervous or anxious in the past 2 weeks?", type: "scale", options: ["Never", "Rarely", "Sometimes", "Often", "Always"], weight: 2, required: true },
      { id: "q1_2", text: "Do you experience sudden panic attacks?", type: "boolean", weight: 3, required: true },
      { id: "q1_3", text: "Rate your ability to relax:", type: "scale", options: ["Very easy", "Easy", "Neutral", "Difficult", "Very difficult"], weight: 1, required: true },
    ],
    createdAt: "2026-01-10T08:00:00Z", updatedAt: "2026-04-20T10:00:00Z", active: true,
  },
  {
    id: "q2", title: "Anxiety Assessment - Phase 2", diseaseTypeId: "d1", diseaseType: "Anxiety Disorder",
    questions: [
      { id: "q2_1", text: "How often do you avoid social situations?", type: "scale", options: ["Never", "Rarely", "Sometimes", "Often", "Always"], weight: 2, required: true },
      { id: "q2_2", text: "Do you experience physical symptoms (rapid heartbeat, sweating) when anxious?", type: "boolean", weight: 2, required: true },
    ],
    createdAt: "2026-02-15T09:00:00Z", updatedAt: "2026-04-22T11:00:00Z", active: true,
  },
  {
    id: "q3", title: "Depression Screening - Phase 1", diseaseTypeId: "d2", diseaseType: "Depression",
    questions: [
      { id: "q3_1", text: "How often have you felt down or hopeless in the past 2 weeks?", type: "scale", options: ["Never", "Rarely", "Sometimes", "Often", "Always"], weight: 3, required: true },
      { id: "q3_2", text: "Have you lost interest in activities you once enjoyed?", type: "boolean", weight: 3, required: true },
    ],
    createdAt: "2026-01-12T10:00:00Z", updatedAt: "2026-04-18T14:00:00Z", active: true,
  },
  {
    id: "q4", title: "Bipolar Assessment", diseaseTypeId: "d3", diseaseType: "Bipolar Disorder",
    questions: [
      { id: "q4_1", text: "Have you experienced periods of elevated mood lasting several days?", type: "boolean", weight: 3, required: true },
      { id: "q4_2", text: "How often do you experience mood swings?", type: "scale", options: ["Never", "Rarely", "Sometimes", "Often", "Always"], weight: 2, required: true },
    ],
    createdAt: "2026-03-01T08:30:00Z", updatedAt: "2026-04-25T09:00:00Z", active: true,
  },
];

export const mockResponses: UserResponse[] = [
  { id: "r1", userId: "u1", userName: "Alex Morgan", questionnaireId: "q1", questionnaireTitle: "Anxiety Assessment - Phase 1", answers: [{ questionId: "q1_1", value: 2 }, { questionId: "q1_2", value: false }, { questionId: "q1_3", value: 3 }], score: 12, riskLevel: "low", completedAt: "2026-05-01T10:30:00Z", phase: "phase1", paymentStatus: "paid" },
  { id: "r2", userId: "u2", userName: "Sarah Chen", questionnaireId: "q1", questionnaireTitle: "Anxiety Assessment - Phase 1", answers: [{ questionId: "q1_1", value: 4 }, { questionId: "q1_2", value: true }, { questionId: "q1_3", value: 4 }], score: 28, riskLevel: "moderate", completedAt: "2026-05-02T14:15:00Z", phase: "phase1", paymentStatus: "paid" },
  { id: "r3", userId: "u3", userName: "James Wilson", questionnaireId: "q2", questionnaireTitle: "Anxiety Assessment - Phase 2", answers: [{ questionId: "q2_1", value: 4 }, { questionId: "q2_2", value: true }], score: 32, riskLevel: "high", completedAt: "2026-05-03T09:00:00Z", phase: "phase2", paymentStatus: "paid" },
  { id: "r4", userId: "u5", userName: "Michael Brown", questionnaireId: "q3", questionnaireTitle: "Depression Screening - Phase 1", answers: [{ questionId: "q3_1", value: 5 }, { questionId: "q3_2", value: true }], score: 42, riskLevel: "critical", completedAt: "2026-05-04T16:00:00Z", phase: "phase1", paymentStatus: "paid" },
  { id: "r5", userId: "u7", userName: "David Kim", questionnaireId: "q1", questionnaireTitle: "Anxiety Assessment - Phase 1", answers: [{ questionId: "q1_1", value: 3 }, { questionId: "q1_2", value: false }, { questionId: "q1_3", value: 3 }], score: 18, riskLevel: "moderate", completedAt: "2026-05-05T11:45:00Z", phase: "phase1", paymentStatus: "pending" },
  { id: "r6", userId: "u3", userName: "James Wilson", questionnaireId: "q4", questionnaireTitle: "Bipolar Assessment", answers: [{ questionId: "q4_1", value: true }, { questionId: "q4_2", value: 4 }], score: 30, riskLevel: "high", completedAt: "2026-05-05T15:30:00Z", phase: "phase1", paymentStatus: "paid" },
  { id: "r7", userId: "u8", userName: "Rachel Green", questionnaireId: "q1", questionnaireTitle: "Anxiety Assessment - Phase 1", answers: [{ questionId: "q1_1", value: 1 }, { questionId: "q1_2", value: false }, { questionId: "q1_3", value: 1 }], score: 6, riskLevel: "low", completedAt: "2026-05-06T08:00:00Z", phase: "phase1", paymentStatus: "paid" },
  { id: "r8", userId: "u2", userName: "Sarah Chen", questionnaireId: "q2", questionnaireTitle: "Anxiety Assessment - Phase 2", answers: [{ questionId: "q2_1", value: 3 }, { questionId: "q2_2", value: true }], score: 22, riskLevel: "moderate", completedAt: "2026-05-06T09:30:00Z", phase: "phase2", paymentStatus: "pending" },
];

export const mockRiskDetections: RiskDetection[] = [
  { id: "rd1", userId: "u5", userName: "Michael Brown", riskLevel: "critical", score: 42, indicators: ["Expressed suicidal ideation", "Severe social withdrawal", "Sleep disturbance"], recommendations: ["Immediate psychiatric consultation", "Crisis hotline referral", "Remove access to harmful means"], detectedAt: "2026-05-04T16:00:00Z", acknowledged: false, urgent: true },
  { id: "rd2", userId: "u3", userName: "James Wilson", riskLevel: "high", score: 32, indicators: ["Panic attacks increasing in frequency", "Avoidance behaviors", "Hypervigilance"], recommendations: ["Therapy session within 48 hours", "Consider medication adjustment", "Relaxation techniques training"], detectedAt: "2026-05-03T09:00:00Z", acknowledged: false, urgent: true },
  { id: "rd3", userId: "u6", userName: "Lisa Davis", riskLevel: "high", score: 28, indicators: ["Mood instability", "Impulsive behavior", "Substance use concerns"], recommendations: ["Mood stabilizer evaluation", "Substance abuse counseling", "Regular monitoring"], detectedAt: "2026-05-02T11:00:00Z", acknowledged: true, urgent: false },
  { id: "rd4", userId: "u2", userName: "Sarah Chen", riskLevel: "moderate", score: 22, indicators: ["Mild anxiety symptoms", "Sleep difficulties", "Work-related stress"], recommendations: ["Stress management program", "Sleep hygiene improvement", "Follow-up in 2 weeks"], detectedAt: "2026-05-02T14:15:00Z", acknowledged: true, urgent: false },
  { id: "rd5", userId: "u7", userName: "David Kim", riskLevel: "moderate", score: 18, indicators: ["Social anxiety", "Low self-esteem", "Academic pressure"], recommendations: ["Cognitive behavioral therapy", "Peer support group", "Academic counseling"], detectedAt: "2026-05-05T11:45:00Z", acknowledged: false, urgent: false },
];

export const mockNotifications: Notification[] = [
  { id: "n1", type: "payment", title: "Payment Received", message: "Alex Morgan completed payment of €3.99 for Phase 1 test.", timestamp: "2026-05-06T14:22:00Z", read: false, userId: "u1", amount: 3.99, phase: "phase1" },
  { id: "n2", type: "test_completed", title: "Phase 1 Test Completed", message: "Rachel Green completed the Anxiety Assessment - Phase 1.", timestamp: "2026-05-06T08:00:00Z", read: false, userId: "u8", phase: "phase1" },
  { id: "n3", type: "payment", title: "Payment Pending", message: "David Kim has a pending payment of €3.99 for Phase 1 test.", timestamp: "2026-05-05T11:45:00Z", read: false, userId: "u7", amount: 3.99, phase: "phase1" },
  { id: "n4", type: "test_completed", title: "Phase 2 Test Completed", message: "James Wilson completed the Anxiety Assessment - Phase 2.", timestamp: "2026-05-05T09:00:00Z", read: true, userId: "u3", phase: "phase2" },
  { id: "n5", type: "test_completed", title: "Phase 2 Test Completed", message: "Sarah Chen completed the Anxiety Assessment - Phase 2.", timestamp: "2026-05-06T09:30:00Z", read: false, userId: "u2", phase: "phase2" },
  { id: "n6", type: "payment", title: "Payment Received", message: "James Wilson paid €3.99 for Phase 2 test.", timestamp: "2026-05-03T09:00:00Z", read: true, userId: "u3", amount: 3.99, phase: "phase2" },
  { id: "n7", type: "payment", title: "Payment Failed", message: "Sarah Chen's payment of €3.99 for Phase 2 failed. Please retry.", timestamp: "2026-05-06T09:35:00Z", read: false, userId: "u2", amount: 3.99, phase: "phase2" },
  { id: "n8", type: "urgent", title: "Urgent: Critical Risk Detected", message: "Michael Brown has been flagged with critical risk level. Immediate action required.", timestamp: "2026-05-04T16:00:00Z", read: false, userId: "u5" },
  { id: "n9", type: "risk_alert", title: "High Risk Alert", message: "James Wilson scored high on the Bipolar assessment. Review recommended.", timestamp: "2026-05-05T15:30:00Z", read: false, userId: "u3" },
];

export const mockStats: DashboardStats = {
  totalUsers: 8,
  activeUsers: 6,
  totalQuestionnaires: 4,
  totalResponses: 8,
  criticalRisks: 1,
  pendingPayments: 2,
  newUsersToday: 0,
  testsCompletedToday: 2,
};

export const adminMenuItems: MenuItem[] = [
  { label: "Dashboard", path: "", icon: "LayoutDashboard", badge: 0 },
  { label: "Users", path: "/users", icon: "Users", badge: 0 },
  { label: "Questionnaires", path: "/questionnaires", icon: "ClipboardList", badge: 0 },
  { label: "Responses", path: "/responses", icon: "FileText", badge: 0 },
  { label: "Risk Detection", path: "/risks", icon: "ShieldAlert", badge: 3 },
  { label: "Notifications", path: "/notifications", icon: "Bell", badge: 5 },
];
