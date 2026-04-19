import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Smart Asset Manager",
  description: "企業 IT 資產借還管理系統",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true, // 🌟 關鍵：允許安裝為 Web App (隱藏 Safari 網址列)
    statusBarStyle: "black-translucent", // 讓頂部時間/電量列變成透明或黑色
    title: "資產管理", // 安裝到桌面時的 App 名稱
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}