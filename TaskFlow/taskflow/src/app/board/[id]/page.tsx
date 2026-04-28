// src/app/board/[id]/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import BoardClient from "@/components/BoardClient";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const board = await prisma.board.findFirst({
    where: { id: boardId, userId: session.user.id },
    include: {
      lists: {
        orderBy: { order: "asc" },
        include: { cards: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!board) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col">
      <header className="bg-black/20 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">{board.title}</h1>
        <Link href="/dashboard" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition-colors font-medium">
          Panolara Dön
        </Link>
      </header>

      <main className="flex-1 p-4 overflow-x-auto">
        {/* Güvenli sarmalayıcıyı çağırıyoruz */}
        <BoardClient boardId={board.id} initialLists={board.lists} />
      </main>
    </div>
  );
}