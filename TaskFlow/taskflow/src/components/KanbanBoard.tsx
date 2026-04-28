// src/components/KanbanBoard.tsx
"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createList, createCard, deleteList, deleteCard, updateListOrder, updateCardOrder } from "@/actions/kanban";

export type Card = { id: string; title: string; order: number; listId: string };
export type List = { id: string; title: string; order: number; cards: Card[] };

interface KanbanBoardProps {
  boardId: string;
  initialLists: List[];
}

export default function KanbanBoard({ boardId, initialLists }: KanbanBoardProps) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [prevInitialLists, setPrevInitialLists] = useState<List[]>(initialLists);

  // CASCADING HATASINI ÖNLEYEN RENDER PHASE UPDATE
  // useEffect kullanmadan, sunucudan yeni veri gelirse state'i senkronize eder.
  if (initialLists !== prevInitialLists) {
    setLists(initialLists);
    setPrevInitialLists(initialLists);
  }

  // --- REAL TIME GÜNCELLEME İÇİN HELPER FONKSİYONLAR ---

  const handleAction = async (formData: FormData, actionFn: (fd: FormData) => Promise<void>, optimisticUpdate: () => void) => {
    optimisticUpdate(); // Önce arayüzü güncelle (Anlık tepki)
    await actionFn(formData); // Sonra veritabanına gönder
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "list") {
      const newLists = Array.from(lists);
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);
      newLists.forEach((list, index) => (list.order = index + 1));
      setLists(newLists);
      await updateListOrder(newLists.map(l => ({ id: l.id, order: l.order })), boardId);
    } else {
      const sourceList = lists.find(l => l.id === source.droppableId);
      const destList = lists.find(l => l.id === destination.droppableId);
      if (!sourceList || !destList) return;

      if (source.droppableId === destination.droppableId) {
        const newCards = Array.from(sourceList.cards);
        const [moved] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, moved);
        newCards.forEach((c, idx) => (c.order = idx + 1));
        setLists(lists.map(l => (l.id === sourceList.id ? { ...l, cards: newCards } : l)));
        await updateCardOrder(newCards.map(c => ({ id: c.id, order: c.order, listId: sourceList.id })), boardId);
      } else {
        const sourceCards = Array.from(sourceList.cards);
        const destCards = Array.from(destList.cards);
        const [moved] = sourceCards.splice(source.index, 1);
        moved.listId = destList.id;
        destCards.splice(destination.index, 0, moved);
        sourceCards.forEach((c, idx) => (c.order = idx + 1));
        destCards.forEach((c, idx) => (c.order = idx + 1));
        setLists(lists.map(l => {
          if (l.id === sourceList.id) return { ...l, cards: sourceCards };
          if (l.id === destList.id) return { ...l, cards: destCards };
          return l;
        }));
        await updateCardOrder([...sourceCards, ...destCards].map(c => ({ id: c.id, order: c.order, listId: c.listId })), boardId);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="list" direction="horizontal">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-4 items-start h-full">
            {lists.map((list, index) => (
              <Draggable key={list.id} draggableId={list.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className="bg-gray-100 rounded-lg w-72 shrink-0 p-3 shadow-sm flex flex-col max-h-full">
                    
                    <div {...provided.dragHandleProps} className="flex justify-between items-center px-1 pb-2 cursor-grab active:cursor-grabbing">
                      <h2 className="font-semibold text-gray-700">{list.title}</h2>
                      <form action={(fd) => handleAction(fd, deleteList, () => setLists(lists.filter(l => l.id !== list.id)))}>
                        <input type="hidden" name="id" value={list.id} />
                        <input type="hidden" name="boardId" value={boardId} />
                        <button type="submit" className="text-gray-400 hover:text-red-600 px-1">✕</button>
                      </form>
                    </div>

                    <Droppable droppableId={list.id} type="card">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-[20px]">
                          {list.cards.map((card, cardIndex) => (
                            <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="group bg-white p-2.5 rounded shadow-sm border border-gray-200 text-sm text-gray-800 flex justify-between items-start">
                                  <span>{card.title}</span>
                                  <form action={(fd) => handleAction(fd, deleteCard, () => setLists(lists.map(l => ({ ...l, cards: l.cards.filter(c => c.id !== card.id) }))))}>
                                    <input type="hidden" name="id" value={card.id} />
                                    <input type="hidden" name="boardId" value={boardId} />
                                    <button type="submit" className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1">✕</button>
                                  </form>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    <form action={(fd) => {
                      const title = fd.get("title") as string;
                      handleAction(fd, createCard, () => {
                        setLists(lists.map(l => l.id === list.id ? { ...l, cards: [...l.cards, { id: Math.random().toString(), title, order: l.cards.length + 1, listId: l.id }] } : l));
                      });
                    }}>
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="boardId" value={boardId} />
                      <input type="text" name="title" placeholder="Kart ekle..." className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-blue-500" required />
                    </form>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            <div className="bg-white/20 rounded-lg w-72 shrink-0 p-3">
              <form action={(fd) => {
                const title = fd.get("title") as string;
                handleAction(fd, createList, () => setLists([...lists, { id: Math.random().toString(), title, order: lists.length + 1, cards: [] }]));
              }}>
                <input type="hidden" name="boardId" value={boardId} />
                <input type="text" name="title" placeholder="+ Liste ekle" className="w-full bg-transparent text-white placeholder-white/80 px-2 py-1 outline-none font-medium" required />
              </form>
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}