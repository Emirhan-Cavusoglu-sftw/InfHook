import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Provider } from "./components/provider";
import Header from "./components/header";
import { HookProvider } from "./components/hookContext";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InfHook",
  description: "Uniswap V4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <HookProvider>
            <Header />
            <Suspense>

            {children}
            </Suspense>
          </HookProvider>
        </Provider>
      </body>
    </html>
  );
}
