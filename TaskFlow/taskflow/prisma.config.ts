import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    // Supabase CLI (push/migration) işlemleri için her zaman DIRECT_URL kullanılır
    url: env("DIRECT_URL"),
  },
});