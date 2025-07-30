
import { threeStatementVariables, threeStatementModelInfo } from './threeStatementConfig';
import { startupVariables, startupModelInfo } from './startupConfig';

/**
 * Central Model Registry
 * 
 * This file serves as the main entry point for all financial model configurations.
 * Backend Integration: Each model maps to specific FastAPI router endpoints
 * 
 * API Endpoint Structure:
 * - /api/v1/models/{model_id}/variables - Get/Set model variables
 * - /api/v1/models/{model_id}/calculate - Run model calculations
 * - /api/v1/models/{model_id}/results - Get model results/dashboard data
 */

export const MODEL_CONFIGS = {
  '3-statement': {
    info: threeStatementModelInfo,
    variables: threeStatementVariables
  },
  'startup': {
    info: startupModelInfo,
    variables: startupVariables
  }
} as const;

export type ModelId = keyof typeof MODEL_CONFIGS;

/**
 * Get model configuration by ID
 * @param modelId - The model identifier
 * @returns Model configuration object
 */
export function getModelConfig(modelId: ModelId) {
  return MODEL_CONFIGS[modelId];
}

/**
 * Get all available models
 * @returns Array of all model configurations
 */
export function getAllModels() {
  return Object.entries(MODEL_CONFIGS).map(([id, config]) => ({
    id: id as ModelId,
    ...config
  }));
}

/**
 * Check if a model ID is valid
 * @param modelId - The model identifier to validate
 * @returns Boolean indicating if the model exists
 */
export function isValidModelId(modelId: string): modelId is ModelId {
  return modelId in MODEL_CONFIGS;
}
