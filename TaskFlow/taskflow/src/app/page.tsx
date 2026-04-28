// src/app/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">TaskFlowa Hoş Geldiniz</h1>
        
        {/* Eğer kullanıcı giriş yaptıysa bu blok çalışır */}
        {session ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-700">
              Giriş başarılı! Merhaba, <strong>{session.user?.name}</strong>.
            </p>
            <div className="flex gap-4">
              {/* Dashboard'a giden hızlı link */}
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Panolarıma Git
              </Link>
              <button
                onClick={() => signOut()}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        ) : (
          /* Giriş yapılmadıysa bu blok çalışır */
          <button
            onClick={() => signIn("github")}
            className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-4 rounded transition-colors"
          >
            GitHub ile Giriş Yap
          </button>
        )}
      </div>
    </main>
  );
}