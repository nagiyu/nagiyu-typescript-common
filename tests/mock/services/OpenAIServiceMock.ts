import { OpenAIServiceType } from '@common/services/OpenAIService';
import { OpenAIChatHistory, OpenAIChatOptions } from '@common/interfaces/OpenAIMessageType';

export default class OpenAIServiceMock implements OpenAIServiceType {
  private conversations: { messages: OpenAIChatHistory; response: string }[] = [];
  private defaultResponse = 'This is a mock response from OpenAI.';

  /**
   * Gets all conversation history for testing purposes.
   */
  public getConversations(): { messages: OpenAIChatHistory; response: string }[] {
    return this.conversations;
  }

  /**
   * Clears all conversation history.
   */
  public clearConversations(): void {
    this.conversations = [];
  }

  /**
   * Sets a custom default response for testing.
   */
  public setDefaultResponse(response: string): void {
    this.defaultResponse = response;
  }

  /**
   * Mock implementation of chat method.
   * Returns a predefined response and logs the conversation.
   */
  public async chat(messages: OpenAIChatHistory, options?: OpenAIChatOptions): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    const response = this.generateMockResponse(messages, options);
    
    this.conversations.push({
      messages: [...messages],
      response,
    });

    console.log('OpenAI Mock - Messages:', messages);
    console.log('OpenAI Mock - Response:', response);

    return response;
  }

  /**
   * Generates a mock response based on the input messages.
   */
  private generateMockResponse(messages: OpenAIChatHistory, options?: OpenAIChatOptions): string {
    const lastMessage = messages[messages.length - 1];
    
    // Simple mock logic - respond based on the last user message
    if (lastMessage?.role === 'user') {
      const content = lastMessage.content.toLowerCase();
      
      // Check for test first (more specific)
      if (content.includes('test')) {
        return 'This is a test response. Everything is working correctly!';
      }
      
      if (content.includes('hello') || content.includes('hi')) {
        return 'Hello! How can I help you today?';
      }
      
      if (content.includes('weather')) {
        return 'I\'m a mock service, so I can\'t provide real weather data, but it\'s always sunny in mock land!';
      }
      
      if (content.includes('thank')) {
        return 'You\'re welcome! Is there anything else I can help you with?';
      }
      
      // If no specific patterns match, use default
    }

    // Include model info if specified
    const modelInfo = options?.model ? ` (using ${options.model})` : '';
    return `${this.defaultResponse}${modelInfo}`;
  }
}