// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createBoard } from "@/actions/board"; // Action yolunun doğru olduğundan emin ol
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const boards = await prisma.board.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panolarım</h1>
        <p className="text-gray-500">Merhaba, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Yeni Pano Ekleme Formu */}
        <form action={createBoard} className="h-32">
          <div className="bg-gray-100 rounded-lg p-4 h-full flex flex-col justify-center items-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <input
              type="text"
              name="title"
              placeholder="Yeni pano adı..."
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 mb-3 text-center"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
            >
              Oluştur
            </button>
          </div>
        </form>

        {/* Mevcut Panoları Listeleme - Hata buradaydı, düzeltildi */}
        {boards.map((board: { id: string; title: string }) => (
          <Link href={`/board/${board.id}`} key={board.id}>
            <div className="bg-white rounded-lg p-4 h-32 shadow hover:shadow-md transition-shadow flex items-center justify-center border border-gray-200 cursor-pointer">
              <h2 className="text-lg font-semibold text-gray-700">{board.title}</h2>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}