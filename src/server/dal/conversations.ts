import 'server-only';
import { getPrisma } from '@/lib/prisma';
import {
  ConversationStatus,
  MessageRole,
  MessageStatus,
} from '@/generated/prisma/client';
import { toIsoDateTime } from './dto';
import { NotFoundError } from './errors';
import type { AiMissionDetail, AiMissionMessage, ListItem } from '@/models/ai-mission';

function toListItem(id: string, title: string): ListItem {
  return {
    _id: id,
    title,
    docs_id: id,
  };
}

function roleFromMessage(role: string): AiMissionMessage['role'] {
  if (role === 'assistant' || role === 'system') {
    return role;
  }
  return 'user';
}

function toMissionDetail(conversation: {
  id: string;
  title: string;
  summary: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    clientMessageId: string | null;
    role: MessageRole;
    content: string;
    parts: unknown;
  }>;
}): AiMissionDetail {
  return {
    _id: conversation.id,
    title: conversation.title,
    summary: conversation.summary,
    category: conversation.isFavorite ? 'favorite' : 'recent',
    types: conversation.messages.map((message) => {
      const parts = Array.isArray(message.parts)
        ? (message.parts as AiMissionMessage['parts'])
        : message.content
          ? [{ type: 'text' as const, text: message.content }]
          : [];

      return {
        id: message.clientMessageId || message.id,
        role: roleFromMessage(message.role),
        parts,
      };
    }),
    created_at: toIsoDateTime(conversation.createdAt),
    updated_at: toIsoDateTime(conversation.updatedAt),
  };
}

function messagePlainText(parts: unknown, fallback = ''): string {
  if (!Array.isArray(parts)) {
    return fallback;
  }

  return parts
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const record = part as Record<string, unknown>;
      if (record.type === 'text' && typeof record.text === 'string') return record.text;
      if (record.type === 'markdown' && typeof record.markdown === 'string') {
        return record.markdown;
      }
      return '';
    })
    .join('\n')
    .trim();
}

export async function listConversations(userId: string): Promise<ListItem[]> {
  const prisma = getPrisma();
  const conversations = await prisma.conversation.findMany({
    where: { ownerId: userId, status: ConversationStatus.ACTIVE, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map((conversation) => toListItem(conversation.id, conversation.title));
}

export async function listFavoriteConversations(userId: string): Promise<ListItem[]> {
  const prisma = getPrisma();
  const conversations = await prisma.conversation.findMany({
    where: {
      ownerId: userId,
      status: ConversationStatus.ACTIVE,
      isFavorite: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map((conversation) => toListItem(conversation.id, conversation.title));
}

export async function findConversationById(
  id: string,
  userId: string
): Promise<AiMissionDetail | null> {
  const prisma = getPrisma();
  const conversation = await prisma.conversation.findFirst({
    where: { id, ownerId: userId, deletedAt: null },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!conversation) {
    return null;
  }

  return toMissionDetail(conversation);
}

export async function requireConversation(id: string, userId: string) {
  const conversation = await findConversationById(id, userId);
  if (!conversation) {
    throw new NotFoundError('未找到对应聊天详情');
  }
  return conversation;
}

export async function upsertConversationMessages(params: {
  userId: string;
  conversationId: string;
  title?: string;
  summary?: string;
  model?: string;
  messages: Array<{
    id?: string;
    role: string;
    content?: string;
    parts?: unknown;
    status?: MessageStatus;
  }>;
}): Promise<AiMissionDetail> {
  const prisma = getPrisma();
  const model = params.model ?? 'deepseek-chat';

  const conversation = await prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: { id: params.conversationId, ownerId: params.userId },
    });

    if (!existing) {
      await tx.conversation.create({
        data: {
          id: params.conversationId,
          ownerId: params.userId,
          title: params.title ?? params.messages[0]?.content?.slice(0, 80) ?? '新对话',
          summary: params.summary ?? '',
          status: ConversationStatus.ACTIVE,
          model,
        },
      });
    } else {
      await tx.conversation.update({
        where: { id: existing.id },
        data: {
          title: params.title ?? existing.title,
          summary: params.summary ?? existing.summary,
          updatedAt: new Date(),
        },
      });
    }

    const keptIds: string[] = [];

    for (const message of params.messages) {
      const role =
        message.role === 'assistant'
          ? MessageRole.ASSISTANT
          : message.role === 'system'
            ? MessageRole.SYSTEM
            : MessageRole.USER;
      const clientMessageId = message.id?.slice(0, 120) || null;
      const content = message.content ?? messagePlainText(message.parts);
      // 空消息也要有合法 part；content 兜底为 text part，保持 AiMissionPartSchema 可解析
      const parts = (message.parts as object) ??
        (content ? [{ type: 'text', text: content }] : []);
      const status = message.status ?? MessageStatus.COMPLETED;

      if (clientMessageId) {
        const row = await tx.message.upsert({
          where: {
            conversationId_clientMessageId: {
              conversationId: params.conversationId,
              clientMessageId,
            },
          },
          update: { role, status, content, parts },
          create: {
            conversationId: params.conversationId,
            clientMessageId,
            role,
            status,
            content,
            parts,
          },
        });
        keptIds.push(row.id);
      } else {
        const row = await tx.message.create({
          data: {
            conversationId: params.conversationId,
            role,
            status,
            content,
            parts,
          },
        });
        keptIds.push(row.id);
      }
    }

    if (keptIds.length > 0) {
      await tx.message.deleteMany({
        where: {
          conversationId: params.conversationId,
          id: { notIn: keptIds },
        },
      });
    }

    return tx.conversation.findFirst({
      where: { id: params.conversationId, ownerId: params.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  });

  if (!conversation) {
    throw new NotFoundError('未找到对应聊天详情');
  }

  return toMissionDetail(conversation);
}
