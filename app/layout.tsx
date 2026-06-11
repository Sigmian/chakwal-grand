// ============================================================
// app/layout.tsx
// Root layout — sets up fonts, theme provider, toasts
// ============================================================

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const playfair = Playfair_Display({
  subsets:  ["latin"],
  variable: "--font-playfair",
  display:  "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Chakwal Grand Guest House",
    default:  "Chakwal Grand — Premium Guest House Chain",
  },
  description:
    "Pakistan's most distinguished guest house chain — luxury hospitality in Chakwal, Kallar Kahar & Sargodha.",
  keywords: [
    "guest house chakwal",
    "hotel chakwal",
    "room booking chakwal",
    "best guest house chakwal",
    "family rooms chakwal",
    "chakwal grand",
  ],
  openGraph: {
    type:        "website",
    locale:      "en_PK",
    url:         "https://chakwalgrand.pk",
    siteName:    "Chakwal Grand Guest House",
    title:       "Chakwal Grand — Premium Guest House Chain",
    description: "Experience comfort and luxury in the heart of Punjab.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${playfair.variable}`}
    >
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}

          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                border:     "1px solid hsl(var(--border))",
                color:      "hsl(var(--foreground))",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
