import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: { default: "TRINSU | إدارة تأمين السفر", template: "%s | TRINSU" },
  description: "منصة إدارة وثائق تأمين السفر"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const demoMode = isDirectAccessEnabled() && !session?.user;
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-demo-mode={demoMode ? "true" : "false"}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.classList.toggle('dark',localStorage.getItem('trinsu:theme')==='dark')}catch{}` }} />
      </head>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
