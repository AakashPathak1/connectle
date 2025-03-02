import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import PageViewTracker from "@/components/page-view-tracker";
import ErrorBoundary from "@/components/error-boundary";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
};

export const metadata: Metadata = {
  title: "Connectle",
  description: "A word association game that challenges you to connect words through semantic similarity",
  // icons: {
  //   icon: [
  //     { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
  //     { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
  //     { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
  //   ],
  //   apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  //   other: [
  //     {
  //       rel: 'mask-icon',
  //       url: '/favicon.svg',
  //       color: '#8B5CF6'
  //     }
  //   ]
  // },
  // manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${nunito.variable} ${nunitoSans.variable} font-nunito antialiased`}
      >
        <AnalyticsProvider>
          <PageViewTracker />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AnalyticsProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
