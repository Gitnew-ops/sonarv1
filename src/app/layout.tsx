import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sonar V 1.0 - Prospecção Marítima Inteligente",
  description: "Sistema Inteligente de Prospecção Comercial Marítima. Gerencie leads, campanhas e comunicação com empresas do setor marítimo.",
  keywords: ["Sonar", "Prospecção Marítima", "CRM", "Leads", "Maritime", "Angola", "Shipping"],
  authors: [{ name: "Sonar Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Sonar V 1.0 - Prospecção Marítima Inteligente",
    description: "Sistema Inteligente de Prospecção Comercial Marítima",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
