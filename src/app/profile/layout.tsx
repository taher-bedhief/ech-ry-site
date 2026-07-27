import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddedCart from "@/components/AddedCart";
import StoreProvider from "@/app/StoreProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import MobileBottomMenu from "@/components/MobileBottomMenu";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTopBtn from "@/components/ScrollToTopBtn";
import AuthProviderClient from "@/components/providers/AuthProviderClient"; 

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "EchRy - Your One-Stop Shopping Destination",
  description: "Shop the latest trends in fashion, electronics, and more with EchRy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        {/* ✅ Redux Provider via StoreProvider */}
        <StoreProvider>
          {/* ✅ Gestion du thème */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* ✅ Amplify Auth configuré côté client */}
            <AuthProviderClient>
              <div className="flex min-h-screen flex-col">
                <header>
                  <Navbar />
                </header>
                <main className="flex-1">{children}</main>
                <Footer />
                <AddedCart />
                <MobileBottomMenu />
                <ScrollToTopBtn />
                <Toaster />
              </div>
            </AuthProviderClient>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
