import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { MUIThemeProvider } from "@/components/providers/mui-theme-provider";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});
import { ErrorBoundary } from "@/components/error-boundary";



export const metadata: Metadata = {
  title: "Yaya Xtra Residence POS",
  description: "Professional Point of Sale system for bars and restaurants - Complete hospitality management solution",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/yaya-logo.png',
    apple: '/yaya-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <MUIThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </MUIThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
