import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { ConversationStatus, MessageStatus, MessageRole } from '@/generated/prisma/client';
import type { Message, Conversation } from '@/generated/prisma/client';

export interface ChatMissionListItem {
  _id: string;
  title: string;
  docs_id: string;
}

export interface AiChatDetailRecord {
  _id: string;
  title: string;
  messages: Array<{
    id: string;
    role: MessageRole;
    status: MessageStatus;
    content: string;
    parts: unknown;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

function toListItem(conversation: Conversation): ChatMissionListItem {
  return {
    _id: conversation.id,
    title: conversation.title,
    docs_id: conversation.id,
  };
}

function toAiChatDetailRecord(conversation: Conversation & { messages: Message[] }): AiChatDetailRecord {
  return {
    _id: conversation.id,
    title: conversation.title,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      status: message.status,
      content: message.content,
      parts: (message.parts as unknown) ?? null,
      createdAt: message.createdAt.toISOString(),
    })),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export async function listConversations(userId: string): Promise<ChatMissionListItem[]> {
  const prisma = getPrisma();
  const conversations = await prisma.conversation.findMany({
    where: { ownerId: userId, status: ConversationStatus.ACTIVE, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map(toListItem);
}

export async function listFavoriteConversations(userId: string): Promise<ChatMissionListItem[]> {
  const prisma = getPrisma();
  const conversations = await prisma.conversation.findMany({
    where: { ownerId: userId, status: ConversationStatus.ACTIVE, isFavorite: true, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map(toListItem);
}

export async function findConversationById(
  id: string,
  userId: string
): Promise<AiChatDetailRecord | null> {
  const prisma = getPrisma();
  const conversation = await prisma.conversation.findFirst({
    where: { id, ownerId: userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  return toAiChatDetailRecord(conversation);
}

export async function saveConversationMessages(
  userId: string,
  conversationId: string,
  messages: Array<{ role: MessageRole; content: string; parts?: unknown; status?: MessageStatus }>
): Promise<AiChatDetailRecord | null> {
  const prisma = getPrisma();
  const conversation = await prisma.$transaction(async (tx) => {
    let conversation = await tx.conversation.findFirst({
      where: { id: conversationId, ownerId: userId },
    });

    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          id: conversationId,
          ownerId: userId,
          title: messages[0]?.content?.slice(0, 80) ?? '新对话',
          status: ConversationStatus.ACTIVE,
          model: 'deepseek-chat',
        },
      });
    }

    for (const message of messages) {
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: message.role,
          status: message.status ?? MessageStatus.COMPLETED,
          content: message.content,
          parts: (message.parts as object) ?? undefined,
        },
      });
    }

    const updated = await tx.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return tx.conversation.findFirst({
      where: { id: updated.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });

  return conversation ? toAiChatDetailRecord(conversation) : null;
}