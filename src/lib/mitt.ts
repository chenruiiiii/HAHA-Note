import mitt from 'mitt';

export type AiChatEventMap = {
  'chat-message': { chatId: string; message: string };
  'stop-send-message': { chatId: string };
  'start-streaming': { chatId: string };
  'quit-streaming': { chatId: string };
};

const emitter = mitt<AiChatEventMap>();
export default emitter;
