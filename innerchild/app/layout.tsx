import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Inner Child | Сэтгэл зүйн зөвлөгөө",
  description:
    "Inner Child — мэргэжлийн сэтгэл зүйч, сэтгэл засалчтай онлайн болон биечлэн зөвлөгөө авах боломж. Сэтгэцийн эрүүл мэндээ хамгаалцгаая.",
  metadataBase: new URL("https://innerchild.mn"),
  openGraph: {
    title: "Inner Child | Сэтгэл зүйн зөвлөгөө",
    description: "Мэргэжлийн сэтгэл зүйч, сэтгэл засалчтай онлайн болон биечлэн зөвлөгөө авах боломж.",
    url: "https://innerchild.mn",
    siteName: "Inner Child",
    images: [{ url: "/1.png", width: 512, height: 512, alt: "Inner Child Logo" }],
    locale: "mn_MN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Inner Child | Сэтгэл зүйн зөвлөгөө",
    description: "Мэргэжлийн сэтгэл зүйч, сэтгэл засалчтай зөвлөгөө авах боломж.",
    images: ["/1.png"],
  },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
