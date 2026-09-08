import mitt from 'mitt';

/**
 * 全局事件总线的事件表。
 *
 * 说明：该事件表聚合了应用内所有通过全局 mitt 实例发布/订阅
 * 的事件（当前为 AI 对话相关 + 文档工作台筛选）。
 * 新增跨组件事件时，请在此一并登记事件名与 payload 类型，
 * 以保证 emit / on / off 的类型安全。
 */
export type AppEventMap = {
  'chat-message': { chatId: string; message: string };
  'stop-send-message': { chatId: string };
  'start-streaming': { chatId: string };
  'quit-streaming': { chatId: string };
  /**
   * 文档工作台（Start 页）筛选切换：'编辑过' | '浏览过'。
   * 与 DocFiltering / DocList 组件联动。
   */
  'doc-filtering': '编辑过' | '浏览过';
};

const emitter = mitt<AppEventMap>();
export default emitter;
