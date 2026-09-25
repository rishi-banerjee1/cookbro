import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cook Bro | Tomorrow, sorted.",
  description: "Indian and international family meals, practical recipes and a cook-ready shopping list.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true, statusBarStyle:"default", title:"Cook Bro"},
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {width:"device-width", initialScale:1, viewportFit:"cover", themeColor:"#2d513d"};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
