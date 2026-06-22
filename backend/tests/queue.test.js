const { addJob } = require('../services/queueService');
const axios = require('axios');
const { sendEmail } = require('../config/mailer');

jest.mock('axios');
jest.mock('../config/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
}));

console.log('TEST MONGO URI IN TEST RUNNER:', process.env.MONGODB_URI_TEST);

describe('Queue Service Job Dispatching & Fallback', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run jobs synchronously when the queue is not initialized (fallback mode)', async () => {
    const emailData = { to: 'test@example.com', subject: 'Test Subject', html: '<p>Test</p>' };
    await addJob('email', 'Send Test Email', emailData);
    
    expect(sendEmail).toHaveBeenCalledWith(emailData);

    const webhookData = { 
      url: 'https://example.com/webhook', 
      payload: { event: 'card.done', card: 'Test Card' }, 
      secret: 'shh', 
      event: 'card.done' 
    };
    axios.post.mockResolvedValueOnce({ status: 200 });

    await addJob('webhook', 'Trigger Webhook', webhookData);
    expect(axios.post).toHaveBeenCalled();
    const [calledUrl, calledPayload, calledConfig] = axios.post.mock.calls[0];
    expect(calledUrl).toEqual(webhookData.url);
    expect(calledPayload).toEqual(webhookData.payload);
    expect(calledConfig.headers['X-FlowDesk-Event']).toEqual('card.done');
    expect(calledConfig.headers['X-FlowDesk-Signature']).toBeDefined();
  });
});
