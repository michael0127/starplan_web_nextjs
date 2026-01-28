import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://starplan.ai"),
  title: "StarPlan — AI Hiring, Ranked for Success",
  description:
    "AI-powered recruitment platform for AI startups. Our ranking engine predicts candidate success using technical signals from GitHub, research papers, and real projects. Hire AI talent faster with decision-ready shortlists.",
  keywords: [
    "AI recruitment",
    "machine learning hiring",
    "AI talent",
    "ML engineer recruitment",
    "LLM hiring",
    "technical recruitment",
    "AI startups",
    "candidate ranking",
  ],
  authors: [{ name: "StarPlan" }],
  creator: "StarPlan",
  publisher: "StarPlan",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://starplan.ai",
    siteName: "StarPlan",
    title: "StarPlan — AI Hiring, Ranked for Success",
    description:
      "AI-powered recruitment for AI startups. Predict candidate success, not keyword matches. Get decision-ready shortlists with transparent reasoning.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StarPlan - AI-Powered Recruitment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StarPlan — AI Hiring, Ranked for Success",
    description:
      "AI-powered recruitment for AI startups. Predict candidate success, not keyword matches.",
    images: ["/og-image.png"],
    creator: "@starplan",
  },
  icons: {
    icon: "/img/star.png",
    shortcut: "/img/star.png",
    apple: "/img/star.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4F67FF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://calendly.com" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
