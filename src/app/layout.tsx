import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Chatbot from "@/components/Chatbot";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "EchRy - Your One-Stop Shopping Destination",
  description: "Shop the latest trends in fashion, electronics, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <Providers>
          {children}
          <Chatbot /> {/* ✅ toujours visible en bas à droite */}
        </Providers>
      </body>
    </html>
  );
}
