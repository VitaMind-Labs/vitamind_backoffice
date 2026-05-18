import { useData } from './use-data';
import { getQuestionnaires, getQuestionnaireById } from '@/actions/questionnaires';
import { getDiseaseTypes } from '@/actions/disease-types';
import type { Questionnaire, QuestionnaireDetail, QuestionnaireFilters } from '@/lib/types/models/questionnaire';
import type { DiseaseType } from '@/lib/types/models/disease-type';
import type { PaginatedResult } from '@/lib/types/api';

export function useQuestionnaires(filters?: QuestionnaireFilters) {
  return useData<PaginatedResult<Questionnaire>>(() => getQuestionnaires(filters), [filters]);
}

export function useQuestionnaire(id: string) {
  return useData<QuestionnaireDetail>(() => getQuestionnaireById(id), [id]);
}

export function useDiseaseTypes() {
  return useData<DiseaseType[]>(() => getDiseaseTypes(), []);
}
