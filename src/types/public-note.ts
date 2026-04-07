export interface PublicNoteOutlineItem {
  id: string;
  text: string;
  level: number;
}

export interface PublicNoteDetail {
  id: string;
  title: string;
  titleHtml: string;
  summary: string;
  summaryHtml: string;
  sourceName: string;
  sourceAvatar?: string;
  sourceTag?: string;
  authorName: string;
  authorAvatar?: string;
  contentHtml: string;
  likeCount: number;
  commentCount: number;
  wordCount: number;
  updatedAt: string;
  docUrl: string;
}
