// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  // 1. pg paketini kullanarak bir bağlantı havuzu oluşturuyoruz
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // 2. Prisma'nın bu havuzu kullanabilmesi için adaptörü tanımlıyoruz
  const adapter = new PrismaPg(pool);
  
  // 3. PrismaClient'ı, boş bırakmak yerine bu adaptörle başlatıyoruz
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;