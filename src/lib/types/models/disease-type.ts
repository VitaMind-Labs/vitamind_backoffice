export interface DiseaseType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  question_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiseaseTypeWithQuestionnaires extends DiseaseType {
  questionnaires?: Array<{ id: string; title: string }>;
}

export interface CreateDiseaseTypePayload {
  name: string;
  description?: string;
  icon?: string;
  question_count?: number;
}

export interface UpdateDiseaseTypePayload {
  name?: string;
  description?: string;
  icon?: string;
  question_count?: number;
  active?: boolean;
}
