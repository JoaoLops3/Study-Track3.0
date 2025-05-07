import React, { useState } from "react";

interface Card {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

const [dueDate, setDueDate] = useState<string | null>(card.updated_at || null);
