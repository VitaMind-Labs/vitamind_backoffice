import { api } from "./client";
import type { FalsePositives, ModelDrift } from "@/types/admin";

export const analyticsApi = {
  modelDrift: () => api.get<ModelDrift>("/model-drift"),
  falsePositives: () => api.get<FalsePositives>("/false-positives"),
};
