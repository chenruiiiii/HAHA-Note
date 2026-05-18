import { generateText, streamText, UIMessage, convertToModelMessages } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import clientPromise from '@/lib/mongodb';
import {
  type AiChatListItem,
  type AiMissionDetail,
  type AiMissionMessage,
  type AiMissionPart,
} from '@/models/ai-mission';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'ai_chat_detail';
const CHAT_LIST_COLLECTION_NAME = 'latest_mission';

/**
 * 将 AI SDK message part 转换为本项目存储用的消息片段格式。
 *
 * @param part - 原始 message part，可能是文本、图片或兼容旧结构的数据。
 * @returns 标准化后的消息片段；无法识别时返回 `null`。
 */
function normalizePart(part: Record<string, unknown>): AiMissionPart | null {
  if (part.type === 'text' && typeof part.text === 'string') {
    return {
      type: 'text',
      text: part.text,
    };
  }

  if (part.type === 'image_url' && part.image_url && typeof part.image_url === 'object') {
    const image = part.image_url as Record<string, unknown>;

    if (typeof image.url === 'string') {
      return {
        type: 'image_url',
        image_url: {
          url: image.url,
          alt: typeof image.alt === 'string' ? image.alt : undefined,
          width: typeof image.width === 'number' ? image.width : undefined,
          height: typeof image.height === 'number' ? image.height : undefined,
        },
      };
    }
  }

  if (typeof part.text === 'string') {
    return {
      type: 'text',
      text: part.text,
    };
  }

  return null;
}

/**
 * 将 AI SDK 的 UI 消息数组转换为会话详情可持久化的消息结构。
 *
 * @param messages - AI SDK UI 消息数组。
 * @returns 标准化后的会话消息数组。
 */
function normalizeMessages(messages: UIMessage[]): AiMissionMessage[] {
  return messages.map((message, index) => {
    const parts = Array.isArray(message.parts)
      ? message.parts
          .map((part) => normalizePart(part as Record<string, unknown>))
          .filter((part): part is AiMissionPart => part !== null)
      : [];

    return {
      id: message.id || `${message.role}_${index + 1}`,
      role: message.role === 'assistant' || message.role === 'system' ? message.role : 'user',
      parts,
    };
  });
}

/**
 * 从首条用户文本消息中截取默认文档标题。
 *
 * @param messages - 标准化后的会话消息数组。
 * @returns 最多 30 个字符的标题；没有可用文本时返回默认标题。
 */
function getTitleFromMessages(messages: AiMissionMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const firstTextPart = firstUserMessage?.parts.find((part) => part.type === 'text');

  if (!firstTextPart || firstTextPart.type !== 'text') {
    return '新建文档';
  }

  return firstTextPart.text.slice(0, 30) || '新建文档';
}

/**
 * 提取单条会话消息中的纯文本内容。
 *
 * @param message - 标准化后的会话消息。
 * @returns 合并后的文本内容；非文本片段会被忽略。
 */
function getMessagePlainText(message: AiMissionMessage) {
  return message.parts
    .map((part) => {
      if (part.type === 'text') return part.text;
      if (part.type === 'markdown') return part.markdown;
      return '';
    })
    .join('\n')
    .trim();
}

/**
 * 基于首轮问答调用 DeepSeek 生成会话文档标题。
 *
 * @param messages - 标准化后的会话消息数组。
 * @returns AI 生成的标题；生成失败或内容为空时返回默认标题。
 */
async function generateDocumentTitle(messages: AiMissionMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const firstAssistantMessage = messages.find((message) => message.role === 'assistant');
  const userText = firstUserMessage ? getMessagePlainText(firstUserMessage) : '';
  const assistantText = firstAssistantMessage ? getMessagePlainText(firstAssistantMessage) : '';

  if (!userText && !assistantText) {
    return '新建文档';
  }

  try {
    const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });
    const result = await generateText({
      model: deepseek('deepseek-chat'),
      prompt: [
        '请根据下面的对话内容提取关键词，生成一个适合作为文档标题的中文标题。',
        '要求：',
        '1. 只返回标题本身',
        '2. 不要带引号、句号、冒号',
        '3. 控制在 8 到 16 个中文字符内',
        '4. 标题要明确且像真实文档名',
        '',
        `用户问题：${userText || '无'}`,
        `首次回答：${assistantText || '无'}`,
      ].join('\n'),
    });

    const title = result.text
      .trim()
      .replace(/^[“"'`]+|[”"'`]+$/g, '')
      .slice(0, 30);
    return title || getTitleFromMessages(messages);
  } catch {
    return getTitleFromMessages(messages);
  }
}

/**
 * 基于会话内容调用 DeepSeek 生成摘要。
 *
 * @param messages - 标准化后的会话消息数组。
 * @returns AI 生成的会话摘要；生成失败时返回截断后的原始对话文本。
 */
async function generateConversationSummary(messages: AiMissionMessage[]) {
  const conversation = messages
    .filter((message) => message.role !== 'system')
    .map(
      (message) => `${message.role === 'user' ? '用户' : '助手'}：${getMessagePlainText(message)}`
    )
    .join('\n')
    .trim();

  if (!conversation) {
    return '';
  }

  try {
    const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });
    const result = await generateText({
      model: deepseek('deepseek-chat'),
      prompt: [
        '请基于下面的对话内容，生成一段适合作为会话摘要的中文总结。',
        '要求：',
        '1. 控制在 60 到 100 个中文字符内',
        '2. 仅输出摘要内容，不要添加前缀',
        '3. 保留用户诉求、关键结果和主要约束',
        '',
        conversation,
      ].join('\n'),
    });

    return result.text.trim().slice(0, 120);
  } catch {
    return conversation.slice(0, 120);
  }
}

/**
 * 保存或更新最近会话列表中的展示项。
 *
 * @param chatId - 会话 ID。
 * @param title - 会话标题。
 * @returns MongoDB upsert 操作完成后的 Promise。
 */
async function saveChatListItem(chatId: string, title: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AiChatListItem>(CHAT_LIST_COLLECTION_NAME);

  await collection.updateOne(
    { docs_id: chatId },
    {
      $set: {
        docs_id: chatId,
        title,
      },
    },
    { upsert: true }
  );
}

/**
 * 保存或更新完整会话详情，并同步最近会话列表标题。
 *
 * @param chatId - 会话 ID。
 * @param messages - AI SDK UI 消息数组。
 * @param options - 可选覆盖字段，用于写入生成后的标题或摘要。
 * @returns 会话详情和最近会话列表写入完成后的 Promise。
 */
async function saveChatDetail(
  chatId: string,
  messages: UIMessage[],
  options?: {
    titleOverride?: string;
    summaryOverride?: string;
  }
) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AiMissionDetail>(COLLECTION_NAME);
  const normalizedMessages = normalizeMessages(messages);
  const now = new Date().toISOString();

  const existing = await collection.findOne({ _id: chatId });
  const title =
    options?.titleOverride || existing?.title || getTitleFromMessages(normalizedMessages);

  const payload: AiMissionDetail = {
    _id: chatId,
    title,
    summary: options?.summaryOverride || existing?.summary || '',
    category: existing?.category || 'recent',
    types: normalizedMessages,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  await collection.updateOne({ _id: chatId }, { $set: payload }, { upsert: true });
  await saveChatListItem(chatId, title);
}

/**
 * 判断当前会话是否需要重新生成标题。
 *
 * @param chatId - 会话 ID。
 * @returns 不存在会话或标题仍为默认值时返回 `true`。
 */
async function shouldGenerateTitle(chatId: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AiMissionDetail>(COLLECTION_NAME);
  const existing = await collection.findOne({ _id: chatId });

  if (!existing) {
    return true;
  }

  return !existing.title || existing.title === '新建对话' || existing.title === '新建文档';
}

/**
 * 发送聊天消息并以流式响应返回 AI 回复，同时持久化会话详情、标题和摘要。
 *
 * @param req - 请求对象，JSON body 需包含 `chatId` 和 AI SDK `messages`。
 * @returns UI message stream 响应；缺少 `chatId` 时返回 400 JSON 错误。
 */
export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await req.json();
  const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });

  if (!chatId) {
    return new Response(JSON.stringify({ code: 400, data: null, message: 'chatId is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  await saveChatDetail(chatId, messages);

  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      const needsTitleGeneration = await shouldGenerateTitle(chatId);
      const normalizedMessages = normalizeMessages(finalMessages);
      const summary = await generateConversationSummary(normalizedMessages);

      if (needsTitleGeneration) {
        const generatedTitle = await generateDocumentTitle(normalizedMessages);
        await saveChatDetail(chatId, finalMessages, {
          titleOverride: generatedTitle,
          summaryOverride: summary,
        });
        return;
      }

      await saveChatDetail(chatId, finalMessages, {
        summaryOverride: summary,
      });
    },
  });
}
