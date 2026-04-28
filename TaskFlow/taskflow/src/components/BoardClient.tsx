// src/components/BoardClient.tsx
"use client";

import dynamic from "next/dynamic";
// Tipimizi diğer dosyadan çekiyoruz
import type { List } from "./KanbanBoard";

// KanbanBoard'u dinamik yüklerken tipini de belirtiyoruz
const KanbanBoard = dynamic(() => import("./KanbanBoard"), { 
  ssr: false,
  loading: () => (
    <div className="flex p-4 gap-4 h-full animate-pulse">
      <div className="bg-white/10 w-72 h-32 rounded-lg" />
      <div className="bg-white/10 w-72 h-32 rounded-lg" />
    </div>
  )
});

interface BoardClientProps {
  boardId: string;
  initialLists: List[]; // Artık 'any' değil, gerçek 'List[]' tipi
}

export default function BoardClient({ boardId, initialLists }: BoardClientProps) {
  return <KanbanBoard boardId={boardId} initialLists={initialLists} />;
}