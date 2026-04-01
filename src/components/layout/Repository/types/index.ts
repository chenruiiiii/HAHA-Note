export interface RepoDetailType {
  name: string;
  isPublic: boolean;
  description: string;
  word_count: number;
  update_time: string;
  owner: string;
  avatar: string[];
  repo_list: RepoListItem[];
  collect: boolean;
  file_desc_title: string;
  file_desc: string;
}

interface RepoListItem {
  id: string;
  name: string;
  update_time: string;
}
