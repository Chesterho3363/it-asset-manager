import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // 🌟 從 lib 引入設定

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };