import OpenAIService from '@common/services/OpenAIService';
import OpenAIServiceMock from '@common-mock/services/OpenAIServiceMock';
import { OpenAIChatHistory, OpenAIMessageType } from '@common/interfaces/OpenAIMessageType';
import { OPENAI_MESSAGE_ROLES } from '@common/consts/OpenAIConst';

describe('OpenAIService', () => {
  let mockService: OpenAIServiceMock;

  beforeEach(() => {
    mockService = new OpenAIServiceMock();
  });

  describe('Mock Service Tests', () => {
    it('should handle basic chat conversation', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.SYSTEM, content: 'You are a helpful assistant.' },
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Hello, how are you?' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('Hello! How can I help you today?');
      expect(mockService.getConversations()).toHaveLength(1);
      expect(mockService.getConversations()[0].messages).toEqual(messages);
    });

    it('should handle test-related queries', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'This is a test message' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('This is a test response. Everything is working correctly!');
    });

    it('should handle weather queries', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'What is the weather like today?' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('I\'m a mock service, so I can\'t provide real weather data, but it\'s always sunny in mock land!');
    });

    it('should handle thank you messages', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Thank you for your help!' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('You\'re welcome! Is there anything else I can help you with?');
    });

    it('should use default response for unknown queries', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Random query about xyz' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('This is a mock response from OpenAI.');
    });

    it('should include model info in response when specified', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Random question' },
      ];

      const response = await mockService.chat(messages, { model: 'gpt-4' });

      expect(response).toBe('This is a mock response from OpenAI. (using gpt-4)');
    });

    it('should allow custom default response', async () => {
      mockService.setDefaultResponse('Custom mock response');

      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Random question' },
      ];

      const response = await mockService.chat(messages);

      expect(response).toBe('Custom mock response');
    });

    it('should track multiple conversations', async () => {
      await mockService.chat([{ role: OPENAI_MESSAGE_ROLES.USER, content: 'Hello' }]);
      await mockService.chat([{ role: OPENAI_MESSAGE_ROLES.USER, content: 'Test message' }]);

      expect(mockService.getConversations()).toHaveLength(2);
      expect(mockService.getConversations()[0].response).toBe('Hello! How can I help you today?');
      expect(mockService.getConversations()[1].response).toBe('This is a test response. Everything is working correctly!');
    });

    it('should clear conversations', async () => {
      await mockService.chat([{ role: OPENAI_MESSAGE_ROLES.USER, content: 'Hello' }]);
      expect(mockService.getConversations()).toHaveLength(1);

      mockService.clearConversations();
      expect(mockService.getConversations()).toHaveLength(0);
    });

    it('should throw error for empty messages array', async () => {
      await expect(mockService.chat([])).rejects.toThrow('Messages array cannot be empty');
    });

    it('should support constructor with API key', () => {
      const testApiKey = 'test-api-key-123';
      const mockServiceWithKey = new OpenAIServiceMock(testApiKey);
      
      // The mock service should be created successfully with the API key
      expect(mockServiceWithKey).toBeInstanceOf(OpenAIServiceMock);
    });
  });

  describe('OpenAIService Helper Methods', () => {
    let service: OpenAIService;

    beforeEach(() => {
      service = new OpenAIService();
    });

    it('should create service with API key constructor', () => {
      const testApiKey = 'test-api-key-123';
      const serviceWithKey = new OpenAIService(testApiKey);
      
      expect(serviceWithKey).toBeInstanceOf(OpenAIService);
    });

    it('should add assistant response to conversation history', () => {
      const history: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.SYSTEM, content: 'You are a helpful assistant.' },
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Hello' },
      ];

      const updatedHistory = service.addAssistantResponse(history, 'Hi there!');

      expect(updatedHistory).toHaveLength(3);
      expect(updatedHistory[2]).toEqual({
        role: OPENAI_MESSAGE_ROLES.ASSISTANT,
        content: 'Hi there!'
      });
      
      // Original history should not be modified
      expect(history).toHaveLength(2);
    });

    it('should maintain conversation flow', () => {
      let conversation: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.SYSTEM, content: 'You are a helpful assistant.' },
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Hello' },
      ];

      // Add assistant response
      conversation = service.addAssistantResponse(conversation, 'Hi there!');
      
      // Add another user message
      conversation = [...conversation, { role: OPENAI_MESSAGE_ROLES.USER, content: 'How are you?' }];
      
      // Add another assistant response
      conversation = service.addAssistantResponse(conversation, 'I\'m doing well, thank you!');

      expect(conversation).toHaveLength(5);
      expect(conversation[0].role).toBe(OPENAI_MESSAGE_ROLES.SYSTEM);
      expect(conversation[1].role).toBe(OPENAI_MESSAGE_ROLES.USER);
      expect(conversation[2].role).toBe(OPENAI_MESSAGE_ROLES.ASSISTANT);
      expect(conversation[3].role).toBe(OPENAI_MESSAGE_ROLES.USER);
      expect(conversation[4].role).toBe(OPENAI_MESSAGE_ROLES.ASSISTANT);
    });
  });

  describe('Message Types', () => {
    it('should properly type OpenAI messages', () => {
      const systemMessage: OpenAIMessageType = {
        role: OPENAI_MESSAGE_ROLES.SYSTEM,
        content: 'You are a helpful assistant.'
      };

      const userMessage: OpenAIMessageType = {
        role: OPENAI_MESSAGE_ROLES.USER, 
        content: 'Hello, world!'
      };

      const assistantMessage: OpenAIMessageType = {
        role: OPENAI_MESSAGE_ROLES.ASSISTANT,
        content: 'Hello! How can I help you?'
      };

      const conversation: OpenAIChatHistory = [
        systemMessage,
        userMessage,
        assistantMessage
      ];

      expect(conversation).toHaveLength(3);
      expect(conversation[0].role).toBe(OPENAI_MESSAGE_ROLES.SYSTEM);
      expect(conversation[1].role).toBe(OPENAI_MESSAGE_ROLES.USER);
      expect(conversation[2].role).toBe(OPENAI_MESSAGE_ROLES.ASSISTANT);
    });
  });
});