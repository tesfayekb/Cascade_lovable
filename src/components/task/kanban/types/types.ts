export interface Task {
  id: string;
  title: string;
  dueDate: string;
  comments?: number;
  links?: number;
  assignee: string;
  status: string;
  projectDesc?: string;
  projectImg?: string;
  category: {
    name: string;
    color: string;
  };
  index?: number; // Added to support DnD operations
}

export interface DropResult {
  name: string;
}
