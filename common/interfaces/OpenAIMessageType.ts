import { OpenAIMessageRole, OpenAIModel, OpenAIToolName } from '@common/consts/OpenAIConst';

/**
 * Represents a single message in an OpenAI chat conversation.
 */
export interface OpenAIMessageType {
  /** The role of the message sender */
  role: OpenAIMessageRole;
  /** The content of the message */
  content: string;
}

/**
 * Represents a chat conversation history for OpenAI API.
 */
export type OpenAIChatHistory = OpenAIMessageType[];

/**
 * Configuration options for OpenAI chat completion requests.
 */
export interface OpenAIChatOptions {
  /** The model to use for chat completion */
  model?: OpenAIModel;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response randomness */
  temperature?: number;

  tools?: OpenAIToolName[];
}
