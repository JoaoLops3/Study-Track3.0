interface Column {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

interface Card {
  id: string;
  title: string;
  due_date?: string;
  tags?: string[];
  content?: any;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
