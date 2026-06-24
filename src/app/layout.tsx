import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export const metadata: Metadata = {
  title: { default: "TRINSU | إدارة تأمين السفر", template: "%s | TRINSU" },
  description: "منصة إدارة وثائق تأمين السفر"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demoMode = isDirectAccessEnabled();
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const theme = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : "system";
  const themeScript = `
try {
  const storedTheme = localStorage.getItem('trinsu:theme');
  const cookieTheme = document.cookie.match(/(?:^|; )theme=([^;]+)/)?.[1];
  const preference = storedTheme || cookieTheme || '${theme}';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = preference === 'dark' || (preference === 'system' && systemDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = preference;
} catch {}
`;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-demo-mode={demoMode ? "true" : "false"} data-theme={theme}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-arabic">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
