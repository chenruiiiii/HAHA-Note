export interface RepoDetailType {
  _id: string;
  name: string;
  isPublic: boolean;
  description: string;
  word_count: number;
  update_time: string;
  owner: string;
  avatar: string[];
  docs_list: RepoListItem[];
  collect: boolean;
  file_desc_title: string;
  file_desc: string;
}

interface RepoListItem {
  docs_id: string;
  docs_name: string;
}
