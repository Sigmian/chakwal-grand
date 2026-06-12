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
  metadataBase: new URL("https://www.staychakwal.de"),
  title: {
    template: "%s | Chakwal Grand Guest House",
    default:  "Chakwal Grand Guest House — Premium Stay in Chakwal, Punjab",
  },
  description:
    "Chakwal Grand Guest House offers premium, affordable accommodation in Chakwal with AC rooms, free WiFi, and 24/7 service. Book your stay today from PKR 2,000/night.",
  keywords: [
    "guest house in Chakwal",
    "hotel in Chakwal",
    "best guest house Chakwal",
    "cheap hotel Chakwal",
    "Chakwal accommodation",
    "family room Chakwal",
    "AC room Chakwal",
    "room booking Chakwal",
    "stay in Chakwal Punjab",
    "Chakwal Grand",
    "CGH Chakwal",
    "guest house near Kalar Kahar",
    "Punjab guest house booking",
    "overnight stay Chakwal",
  ],
  authors: [{ name: "Chakwal Grand Guest House", url: "https://www.staychakwal.de" }],
  creator: "Chakwal Grand Guest House",
  publisher: "Chakwal Grand Guest House",
  alternates: {
    canonical: "https://www.staychakwal.de",
  },
  openGraph: {
    type:        "website",
    locale:      "en_PK",
    url:         "https://www.staychakwal.de",
    siteName:    "Chakwal Grand Guest House",
    title:       "Chakwal Grand Guest House — Premium Stay in Chakwal, Punjab",
    description: "Premium, affordable guest house in Chakwal with AC rooms, free WiFi & 24/7 service. Book from PKR 2,000/night.",
    images: [{ url: "/images/logo.png", width: 1200, height: 630, alt: "Chakwal Grand Guest House" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Chakwal Grand Guest House — Premium Stay in Chakwal",
    description: "Book AC rooms from PKR 2,000/night. Free WiFi, 24/7 service, Chakwal Punjab.",
    images:      ["/images/logo.png"],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon:             "/images/logo.png",
    apple:            "/images/logo.png",
    shortcut:         "/images/logo.png",
  },
  verification: {
    google: "bd67aeb73c94fb36",
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
