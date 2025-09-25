import OpenAIService from '@common/services/OpenAIService';
import OpenAIServiceMock from '@common-mock/services/OpenAIServiceMock';
import { OpenAIChatHistory, OpenAIMessageType } from '@common/interfaces/OpenAIMessageType';

describe('OpenAIService', () => {
  let mockService: OpenAIServiceMock;

  beforeEach(() => {
    mockService = new OpenAIServiceMock();
  });

  describe('Mock Service Tests', () => {
    it('should handle basic chat conversation', async () => {
      const messages: OpenAIChatHistory = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('Hello! How can I help you today?');
      expect(mockService.getConversations()).toHaveLength(1);
      expect(mockService.getConversations()[0].messages).toEqual(messages);
    });

    it('should handle test-related queries', async () => {
      const messages: OpenAIChatHistory = [
        { role: 'user', content: 'This is a test message' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('This is a test response. Everything is working correctly!');
    });

    it('should handle weather queries', async () => {
      const messages: OpenAIChatHistory = [
        { role: 'user', content: 'What is the weather like today?' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('I\'m a mock service, so I can\'t provide real weather data, but it\'s always sunny in mock land!');
    });

    it('should handle thank you messages', async () => {
      const messages: OpenAIChatHistory = [
        { role: 'user', content: 'Thank you for your help!' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('You\'re welcome! Is there anything else I can help you with?');
    });

    it('should use default response for unknown queries', async () => {
      const messages: OpenAIChatHistory = [
        { role: 'user', content: 'Random query about xyz' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('This is a mock response from OpenAI.');
    });

    it('should include model info in response when specified', async () => {
      const messages: OpenAIChatHistory = [
        { role: 'user', content: 'Random question' },
      ];

      const response = await mockService.chat(messages, { model: 'gpt-4' });

      expect(response).toBe('This is a mock response from OpenAI. (using gpt-4)');
    });

    it('should allow custom default response', async () => {
      mockService.setDefaultResponse('Custom mock response');

      const messages: OpenAIChatHistory = [
        { role: 'user', content: 'Random question' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('Custom mock response');
    });

    it('should track multiple conversations', async () => {
      await mockService.chat([{ role: 'user', content: 'Hello' }]);
      await mockService.chat([{ role: 'user', content: 'Test message' }]);

      expect(mockService.getConversations()).toHaveLength(2);
      expect(mockService.getConversations()[0].response).toBe('Hello! How can I help you today?');
      expect(mockService.getConversations()[1].response).toBe('This is a test response. Everything is working correctly!');
    });

    it('should clear conversations', async () => {
      await mockService.chat([{ role: 'user', content: 'Hello' }]);
      expect(mockService.getConversations()).toHaveLength(1);

      mockService.clearConversations();
      expect(mockService.getConversations()).toHaveLength(0);
    });

    it('should throw error for empty messages array', async () => {
      await expect(mockService.chat([])).rejects.toThrow('Messages array cannot be empty');
    });
  });

  describe('OpenAIService Helper Methods', () => {
    let service: OpenAIService;

    beforeEach(() => {
      service = new OpenAIService();
    });

    it('should add assistant response to conversation history', () => {
      const history: OpenAIChatHistory = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ];

      const updatedHistory = service.addAssistantResponse(history, 'Hi there!');

      expect(updatedHistory).toHaveLength(3);
      expect(updatedHistory[2]).toEqual({
        role: 'assistant',
        content: 'Hi there!'
      });
      
      // Original history should not be modified
      expect(history).toHaveLength(2);
    });

    it('should maintain conversation flow', () => {
      let conversation: OpenAIChatHistory = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ];

      // Add assistant response
      conversation = service.addAssistantResponse(conversation, 'Hi there!');
      
      // Add another user message
      conversation = [...conversation, { role: 'user', content: 'How are you?' }];
      
      // Add another assistant response
      conversation = service.addAssistantResponse(conversation, 'I\'m doing well, thank you!');

      expect(conversation).toHaveLength(5);
      expect(conversation[0].role).toBe('system');
      expect(conversation[1].role).toBe('user');
      expect(conversation[2].role).toBe('assistant');
      expect(conversation[3].role).toBe('user');
      expect(conversation[4].role).toBe('assistant');
    });
  });

  describe('Message Types', () => {
    it('should properly type OpenAI messages', () => {
      const systemMessage: OpenAIMessageType = {
        role: 'system',
        content: 'You are a helpful assistant.'
      };

      const userMessage: OpenAIMessageType = {
        role: 'user', 
        content: 'Hello, world!'
      };

      const assistantMessage: OpenAIMessageType = {
        role: 'assistant',
        content: 'Hello! How can I help you?'
      };

      const conversation: OpenAIChatHistory = [
        systemMessage,
        userMessage,
        assistantMessage
      ];

      expect(conversation).toHaveLength(3);
      expect(conversation[0].role).toBe('system');
      expect(conversation[1].role).toBe('user');
      expect(conversation[2].role).toBe('assistant');
    });
  });
});