import OpenAI from 'openai';

import { BadRequestError } from '@common/errors';
import { OpenAIChatHistory, OpenAIChatOptions } from '@common/interfaces/OpenAIMessageType';
import { OPENAI_MODEL } from '@common/consts/OpenAIConst';

export interface OpenAIServiceType {
  chat(messages: OpenAIChatHistory, options?: OpenAIChatOptions): Promise<string>;
}

export default class OpenAIService implements OpenAIServiceType {
  private openaiClient: OpenAI;

  /**
   * Creates a new OpenAI service instance.
   * @param apiKey Required OpenAI API key.
   */
  constructor(apiKey: string) {
    this.openaiClient = new OpenAI({ apiKey });
  }

  /**
   * Sends a chat completion request to OpenAI API.
   * @param messages Array of messages representing the conversation history
   * @param options Optional configuration for the chat completion
   * @returns Promise that resolves to the assistant's response
   */
  public async chat(messages: OpenAIChatHistory, options?: OpenAIChatOptions): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new BadRequestError('Messages array cannot be empty');
    }

    try {
      const completionParams = this.prepareCompletionParams(messages, options);
      const completion = await this.openaiClient.chat.completions.create(completionParams);

      const response = completion.choices?.[0]?.message?.content;

      if (!response) {
        throw new Error('No response received from OpenAI API');
      }

      return response;
    } catch (error) {
      // Handle different types of errors more specifically
      if (error instanceof Error) {
        // Check if it's an OpenAI API error with more specific information
        if ('error' in error && typeof error.error === 'object' && error.error !== null) {
          const apiError = error.error as any;
          if (apiError.message) {
            throw new Error(`OpenAI API error: ${apiError.message}`);
          }
        }
        throw new Error(`OpenAI API error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred while calling OpenAI API');
      }
    }
  }

  /**
   * Prepares completion parameters with model-specific adjustments.
   * @private
   */
  private prepareCompletionParams(messages: OpenAIChatHistory, options?: OpenAIChatOptions) {
    const model = options?.model || OPENAI_MODEL.GPT_4_1;

    const baseParams = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_completion_tokens: options?.maxTokens,
      temperature: options?.temperature,
    };

    // Handle GPT-5 specific parameters if needed
    if (model === OPENAI_MODEL.GPT_5) {
      return {
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      };
    }

    return baseParams;
  }

  /**
   * Creates a new conversation with a system message.
   * @param systemPrompt The system message to set the AI's behavior
   * @param userMessage The first user message
   * @param options Optional configuration for the chat completion
   * @returns Promise that resolves to the assistant's response
   */
  public async startConversation(
    systemPrompt: string,
    userMessage: string,
    options?: OpenAIChatOptions
  ): Promise<string> {
    const messages: OpenAIChatHistory = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    return this.chat(messages, options);
  }

  /**
   * Continues an existing conversation by adding a new user message.
   * @param conversationHistory The existing conversation history
   * @param userMessage The new user message to add
   * @param options Optional configuration for the chat completion
   * @returns Promise that resolves to the assistant's response
   */
  public async continueConversation(
    conversationHistory: OpenAIChatHistory,
    userMessage: string,
    options?: OpenAIChatOptions
  ): Promise<string> {
    const updatedHistory: OpenAIChatHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return this.chat(updatedHistory, options);
  }

  /**
   * Adds an assistant response to the conversation history.
   * @param conversationHistory The existing conversation history
   * @param assistantResponse The assistant's response to add
   * @returns Updated conversation history with the assistant's response
   */
  public addAssistantResponse(
    conversationHistory: OpenAIChatHistory,
    assistantResponse: string
  ): OpenAIChatHistory {
    return [
      ...conversationHistory,
      { role: 'assistant', content: assistantResponse },
    ];
  }
}
