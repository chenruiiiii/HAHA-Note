export interface RepoDetailType {
  _id: string;
  isPublic: boolean;
  description: string;
  update_time: string;
  creator: string;
  avatar: string[];
  docs_list: RepoListItem[];
  title: string;
  repo_desc: string;
  type: string;
  isCollect: boolean;
}

interface RepoListItem {
  docs_id: string;
  docs_name: string;
}

export interface RepoDetailApiType extends Partial<RepoDetailType> {
  _id: string;
}
