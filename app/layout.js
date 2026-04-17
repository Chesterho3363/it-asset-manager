import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "IT 資產管理",
  description: "IT Asset Manager",
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