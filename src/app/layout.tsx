import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export const metadata: Metadata = {
  title: { default: "TRINSU | إدارة تأمين السفر", template: "%s | TRINSU" },
  description: "منصة إدارة وثائق تأمين السفر"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demoMode = isDirectAccessEnabled();
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-demo-mode={demoMode ? "true" : "false"}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.classList.toggle('dark',localStorage.getItem('trinsu:theme')==='dark')}catch{}` }} />
      </head>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
