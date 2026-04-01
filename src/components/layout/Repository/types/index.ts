export interface RepoDetailType {
  name: string;
  isPublic: boolean;
  description: string;
  update_time: string;
  owner: string;
  avatar: string[];
  repo_list: RepoListItem[];
  collect: boolean;
}

interface RepoListItem {
  name: string;
  update_time: string;
}
