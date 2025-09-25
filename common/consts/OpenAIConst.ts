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

/**
 * Default OpenAI configuration constants
 */
export const OPENAI_DEFAULTS = {
  MODEL: 'gpt-3.5-turbo',
  SECRETS_KEY: 'OPENAI_API_KEY'
} as const;