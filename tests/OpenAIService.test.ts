import OpenAIService from '@common/services/OpenAIService';
import OpenAIServiceMock from '@common-mock/services/OpenAIServiceMock';
import { OpenAIChatHistory, OpenAIMessageType } from '@common/interfaces/OpenAIMessageType';
import { OPENAI_MESSAGE_ROLES, OPENAI_MODEL } from '@common/consts/OpenAIConst';

describe('OpenAIService', () => {
  let mockService: OpenAIServiceMock;
  const testApiKey = 'test-api-key-123';

  beforeEach(() => {
    mockService = new OpenAIServiceMock(testApiKey);
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

      const response = await mockService.chat(messages, { model: OPENAI_MODEL.GPT_4_1 });

      expect(response).toBe('This is a mock response from OpenAI. (using gpt-4.1)');
    });

    it('should support GPT-5 model', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Random question' },
      ];

      const response = await mockService.chat(messages, { model: OPENAI_MODEL.GPT_5 });

      expect(response).toBe('This is a mock response from OpenAI. (using gpt-5)');
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
    const testApiKey = 'test-api-key-123';

    beforeEach(() => {
      service = new OpenAIService(testApiKey);
    });

    it('should create service with API key constructor', () => {
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

  // Real OpenAI API tests (skipped by default)
  // To run these tests, remove the .skip and provide a real API key
  describe.skip('Real OpenAI API Tests', () => {
    let service: OpenAIService;
    const realApiKey = process.env.OPENAI_API_KEY || 'your-real-api-key-here';

    beforeEach(() => {
      service = new OpenAIService(realApiKey);
    });

    it('should make actual OpenAI API call for basic chat', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.SYSTEM, content: 'You are a helpful assistant. Respond with exactly "Hello World" and nothing else.' },
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Please say hello.' },
      ];

      const response = await service.chat(messages);

      console.log('OpenAI API response:', response);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for API call

    it('should handle startConversation with real API', async () => {
      const response = await service.startConversation(
        'You are a helpful assistant. Always respond with exactly "Test response" and nothing else.',
        'Hello, please respond.'
      );

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle continueConversation with real API', async () => {
      let conversation: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.SYSTEM, content: 'You are a helpful assistant. Always keep responses under 10 words.' },
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Hello' },
      ];

      const firstResponse = await service.chat(conversation);

      console.log('OpenAI API 1st response:', firstResponse);

      conversation = service.addAssistantResponse(conversation, firstResponse);

      const secondResponse = await service.continueConversation(
        conversation,
        'How are you?'
      );

      console.log('OpenAI API 2nd response:', secondResponse);

      expect(typeof secondResponse).toBe('string');
      expect(secondResponse.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle different models with real API', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Say "test" and nothing else.' },
      ];

      const response = await service.chat(messages, {
        model: OPENAI_MODEL.GPT_4_1_MINI,
        maxTokens: 10,
        temperature: 0
      });

      console.log('OpenAI API response:', response);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle GPT-5 model with real API', async () => {
      const messages: OpenAIChatHistory = [
        { role: OPENAI_MESSAGE_ROLES.USER, content: 'Say "test" and nothing else.' },
      ];

      const response = await service.chat(messages, {
        model: OPENAI_MODEL.GPT_5,
        maxTokens: 10,
        temperature: 0
      });

      console.log('OpenAI API GPT-5 response:', response);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 30000);
  });
});
