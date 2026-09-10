import 'server-only';
import { ActivityType } from '@/generated/prisma/client';
import { getPrisma } from '@/lib/prisma';
import { toIsoDateTime } from './dto';

export interface ActivityListItem {
  _id: string;
  repository_id: string;
  docs_id: string;
  title: string;
  author: string;
  repository_name: string;
  updated_time: string;
}

export async function listActivities(
  userId: string,
  type: ActivityType
): Promise<ActivityListItem[]> {
  const prisma = getPrisma();
  const rows = await prisma.activity.findMany({
    where: { userId, type },
    orderBy: { occurredAt: 'desc' },
    take: 200,
    include: {
      document: {
        include: {
          repository: { select: { title: true } },
          creator: { select: { nickname: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    _id: row.id,
    repository_id: row.document.repositoryId,
    docs_id: row.document.id,
    title: row.document.title,
    author: row.document.creator.nickname,
    repository_name: row.document.repository.title,
    updated_time: toIsoDateTime(row.occurredAt),
  }));
}
