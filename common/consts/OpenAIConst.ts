/**
 * OpenAI message roles constants
 */
export const OPENAI_MESSAGE_ROLES = {
  SYSTEM: 'system',
  USER: 'user', 
  ASSISTANT: 'assistant'
} as const;

/**
 * Type for OpenAI message roles
 */
export type OpenAIMessageRole = typeof OPENAI_MESSAGE_ROLES[keyof typeof OPENAI_MESSAGE_ROLES];