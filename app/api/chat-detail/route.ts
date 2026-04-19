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

function getTitleFromMessages(messages: AiMissionMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const firstTextPart = firstUserMessage?.parts.find((part) => part.type === 'text');

  if (!firstTextPart || firstTextPart.type !== 'text') {
    return '新建文档';
  }

  return firstTextPart.text.slice(0, 30) || '新建文档';
}

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

async function saveChatDetail(chatId: string, messages: UIMessage[], titleOverride?: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AiMissionDetail>(COLLECTION_NAME);
  const normalizedMessages = normalizeMessages(messages);
  const now = new Date().toISOString();

  const existing = await collection.findOne({ _id: chatId });
  const title = titleOverride || existing?.title || getTitleFromMessages(normalizedMessages);

  const payload: AiMissionDetail = {
    _id: chatId,
    title,
    category: existing?.category || 'recent',
    types: normalizedMessages,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  await collection.updateOne({ _id: chatId }, { $set: payload }, { upsert: true });
  await saveChatListItem(chatId, title);
}

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

      if (needsTitleGeneration) {
        const normalizedMessages = normalizeMessages(finalMessages);
        const generatedTitle = await generateDocumentTitle(normalizedMessages);
        await saveChatDetail(chatId, finalMessages, generatedTitle);
        return;
      }

      await saveChatDetail(chatId, finalMessages);
    },
  });
}
