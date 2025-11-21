import type { Metadata } from "next";
import { Inter } from "next/font/google";


const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "StudySprout",
  description: "Note taking app",
  icons: {
    icon: "/images/tab_logo.png",  
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={inter.className}>
      {children}
    </div>
  );
}