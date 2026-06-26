import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompanyIQ | Professional AI Investment Research",
  description: "Enterprise-grade AI investment research platform presenting explainable recommendations backed by deterministic financials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased light"
    >
      <body className="min-h-full bg-background text-foreground font-sans flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
