export type Align = '编辑过' | '浏览过';

// 知识库
export interface Repository {
  _id: string;
  type: 'note' | 'project' | 'code' | 'growth' | undefined;
  title: string;
  creator: string;
  time: string;
  repository: string; // 知识库名
  docs_list: [{ docs_name: string; docs_id: string }];
  isPublic?: boolean;
}

// 知识库文档
export interface DocumentDetail {
  _id: string;
  repository_id: string; // 所属知识库 ID
  title: string;
  content_html: string;
  author: string;
  updated_at: string;
}

// 编辑过的文档
export interface EditDocument {
  _id: string;
  repository_id: string; // 所属知识库 ID
  title: string;
  author: string;
  repository_name: string;
  updated_time: string;
}

// 浏览过的文档
export interface BrowseDocument {
  _id: string;
  repository_id: string; // 所属知识库 ID
  title: string;
  author: string;
  repository_name: string;
  updated_time: string;
}

// 收藏的文章/知识库
export interface Collection {
  _id: string;
  type: string;
  title: string;
  creator: string;
  time: string;
  repository: string; // 所属知识库
  repository_id: string;
  docs_list: [{ docs_name: string; docs_id: string }];
}
