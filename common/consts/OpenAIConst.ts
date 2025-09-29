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

export const OPENAI_MODEL = {
  GPT_4_1_MINI: 'gpt-4.1-mini',
  GPT_4_1: 'gpt-4.1',
  GPT_5: 'gpt-5',
} as const;

export type OpenAIModel = typeof OPENAI_MODEL[keyof typeof OPENAI_MODEL];
