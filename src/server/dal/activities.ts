import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { ActivityType } from '@/generated/prisma/client';
import { toIsoDateTime } from './dto';

export interface ActivityListItem {
  _id: string;
  repository_id: string;
  title: string;
  author: string;
  repository_name: string;
  updated_time: string;
}

function toActivityItem(row: {
  id: string;
  occurredAt: Date;
  document: {
    title: string;
    repositoryId: string;
    repository: { title: string };
    creator: { nickname: string };
  };
}): ActivityListItem {
  return {
    _id: row.id,
    repository_id: row.document.repositoryId,
    title: row.document.title,
    author: row.document.creator.nickname,
    repository_name: row.document.repository.title,
    updated_time: toIsoDateTime(row.occurredAt),
  };
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

  return rows.map(toActivityItem);
}
