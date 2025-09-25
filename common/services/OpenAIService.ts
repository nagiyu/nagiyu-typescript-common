import OpenAI from 'openai';

import ErrorUtil from '@common/utils/ErrorUtil';
import SecretsManagerUtil from '@common/aws/SecretsManagerUtil';
import { OpenAIChatHistory, OpenAIChatOptions, OpenAIMessageType } from '@common/interfaces/OpenAIMessageType';

export interface OpenAIServiceType {
  chat(messages: OpenAIChatHistory, options?: OpenAIChatOptions): Promise<string>;
}

export default class OpenAIService implements OpenAIServiceType {
  private openaiClient: OpenAI | null = null;
  private apiKey: string | null = null;

  /**
   * Initializes the OpenAI client with API key from AWS Secrets Manager.
   * @param initLoad If true, always use credentials from environment variables.
   */
  private async getOpenAIClient(initLoad = false): Promise<OpenAI> {
    if (this.openaiClient && this.apiKey) {
      return this.openaiClient;
    }

    try {
      const secretName = process.env.PROJECT_SECRET!;
      this.apiKey = await SecretsManagerUtil.getSecretValue(secretName, 'OPENAI_API_KEY', initLoad);
      
      this.openaiClient = new OpenAI({
        apiKey: this.apiKey,
      });

      return this.openaiClient;
    } catch (error) {
      ErrorUtil.throwError('Failed to initialize OpenAI client', error);
    }
  }

  /**
   * Sends a chat completion request to OpenAI API.
   * @param messages Array of messages representing the conversation history
   * @param options Optional configuration for the chat completion
   * @returns Promise that resolves to the assistant's response
   */
  public async chat(messages: OpenAIChatHistory, options?: OpenAIChatOptions): Promise<string> {
    if (!messages || messages.length === 0) {
      ErrorUtil.throwError('Messages array cannot be empty');
    }

    try {
      const client = await this.getOpenAIClient();
      
      const completion = await client.chat.completions.create({
        model: options?.model || 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        ErrorUtil.throwError('No response received from OpenAI API');
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        ErrorUtil.throwError(`OpenAI API error: ${error.message}`);
      } else {
        ErrorUtil.throwError('Unknown error occurred while calling OpenAI API');
      }
    }
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