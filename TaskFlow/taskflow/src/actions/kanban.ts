// src/actions/kanban.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
//             EKLEME İŞLEMLERİ
// ==========================================

export async function createList(formData: FormData) {
  const title = formData.get("title") as string;
  const boardId = formData.get("boardId") as string;
  if (!title || !boardId) return;

  const lastList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
  });
  const newOrder = lastList ? lastList.order + 1 : 1;

  await prisma.list.create({ data: { title, boardId, order: newOrder } });
  revalidatePath(`/board/${boardId}`);
}

export async function createCard(formData: FormData) {
  const title = formData.get("title") as string;
  const listId = formData.get("listId") as string;
  const boardId = formData.get("boardId") as string;
  if (!title || !listId || !boardId) return;

  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
  });
  const newOrder = lastCard ? lastCard.order + 1 : 1;

  await prisma.card.create({ data: { title, listId, order: newOrder } });
  revalidatePath(`/board/${boardId}`);
}

// ==========================================
//             SİLME İŞLEMLERİ
// ==========================================

export async function deleteList(formData: FormData) {
  const id = formData.get("id") as string;
  const boardId = formData.get("boardId") as string;
  if (!id) return;

  await prisma.list.delete({ where: { id } });
  revalidatePath(`/board/${boardId}`);
}

export async function deleteCard(formData: FormData) {
  const id = formData.get("id") as string;
  const boardId = formData.get("boardId") as string;
  if (!id) return;

  await prisma.card.delete({ where: { id } });
  revalidatePath(`/board/${boardId}`);
}

// ==========================================
//           SIRALAMA GÜNCELLEME (DND)
// ==========================================

export async function updateListOrder(items: { id: string; order: number }[], boardId: string) {
  const transaction = items.map((item) =>
    prisma.list.update({
      where: { id: item.id },
      data: { order: item.order },
    })
  );
  // İşlemleri tek seferde (transaction) yapıyoruz ki veri tutarsızlığı olmasın
  await prisma.$transaction(transaction);
  revalidatePath(`/board/${boardId}`);
}

export async function updateCardOrder(items: { id: string; order: number; listId: string }[], boardId: string) {
  const transaction = items.map((item) =>
    prisma.card.update({
      where: { id: item.id },
      data: { order: item.order, listId: item.listId },
    })
  );
  await prisma.$transaction(transaction);
  revalidatePath(`/board/${boardId}`);
}