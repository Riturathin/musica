import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider";
import "./globals.css";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Musica",
    template: "%s | Musica",
  },
  description: "A Spotify-inspired music web app.",
  applicationName: "Musica",
  keywords: [
    "music",
    "playlists",
    "streaming",
    "songs",
    "lyrics",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${robotoSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
