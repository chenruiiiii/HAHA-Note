export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface TagType {
  id: number;
  name: string;
  color: string;
}

export interface Attachment {
  id: number;
  name: string;
  size: string;
  type: string;
}
