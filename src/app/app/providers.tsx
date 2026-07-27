"use client";

import CognitoProvider from "@/lib/cognitoProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddedCart from "@/components/AddedCart";
import StoreProvider from "@/app/StoreProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import MobileBottomMenu from "@/components/MobileBottomMenu";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTopBtn from "@/components/ScrollToTopBtn";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CognitoProvider>
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
        </CognitoProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
