// src/actions/board.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function createBoard(formData: FormData) {
  // 1. Kullanıcının oturumunu kontrol et
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Giriş yapmanız gerekiyor!");
  }

  // 2. Formdan gelen başlığı al
  const title = formData.get("title") as string;
  if (!title || title.trim() === "") return;

  // 3. Veritabanında yeni bir pano oluştur
  await prisma.board.create({
    data: {
      title,
      userId: session.user.id,
    },
  });

  // 4. Sayfayı yenile (verilerin güncellenmesi için)
  revalidatePath("/dashboard");
}