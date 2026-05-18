import { QuestionType } from '../enums';

export interface Question {
  id: string;
  questionnaire_id: string;
  text: string;
  type: QuestionType;
  options: string[];
  weight: number;
  required: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  questionnaire?: { id: string; title: string };
}

export interface CreateQuestionPayload {
  text: string;
  type: QuestionType;
  options?: string[];
  weight?: number;
  required?: boolean;
  order: number;
}

export interface UpdateQuestionPayload {
  text?: string;
  type?: QuestionType;
  options?: string[];
  weight?: number;
  required?: boolean;
  order?: number;
}
