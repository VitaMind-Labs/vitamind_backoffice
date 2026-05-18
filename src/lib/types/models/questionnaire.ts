import { Phase, Lang } from '../enums';

export interface Questionnaire {
  id: string;
  title: string;
  disease_type_id: string;
  disease_type: { id: string; name: string };
  active: boolean;
  phase: Phase;
  lang: Lang;
  version: string;
  created_at: string;
  updated_at: string;
  _count?: { questions: number };
}

export interface QuestionnaireDetail extends Questionnaire {
  questions: import('./question').Question[];
}

export interface QuestionnaireFilters {
  diseaseTypeId?: string;
  active?: string;
  phase?: Phase;
  lang?: Lang;
  from?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface CreateQuestionnairePayload {
  title: string;
  disease_type_id: string;
  active?: boolean;
  phase?: Phase;
  lang?: Lang;
  version?: string;
}

export interface UpdateQuestionnairePayload {
  title?: string;
  disease_type_id?: string;
  active?: boolean;
  phase?: Phase;
  lang?: Lang;
  version?: string;
}
