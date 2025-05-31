import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarWithLogout } from "@/components/SidebarWithLogout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sunday App",
  description: "Real Estate Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          <div className="flex h-screen">
            <SidebarWithLogout />
            <main className="flex-1 overflow-y-auto md:ml-[16rem]">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
