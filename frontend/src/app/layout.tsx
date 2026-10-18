import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "KneeAI — Explainable Knee Osteoarthritis Grade Classification",
  description:
    "Deep Learning Decision Support System for Kellgren-Lawrence Knee Osteoarthritis Grading with Grad-CAM Explainability",
  keywords: [
    "Knee Osteoarthritis",
    "Kellgren-Lawrence",
    "Deep Learning",
    "Grad-CAM",
    "Medical Imaging",
    "Decision Support",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-softBg text-darkGreen antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
