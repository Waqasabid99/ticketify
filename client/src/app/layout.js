import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import Navbar from "@/layout/Navbar";
import Footer from "@/layout/Footer";
import { getGenres } from "@/actions/genre.action";
import CheckAuth from "@/utils/CheckAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ticketify",
  description: "Book your tickets now!",
};

export default async function RootLayout({ children }) {
  const { genres } = await getGenres();
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col justify-between">
        <CheckAuth>
          <ToastContainer />
          <Navbar genres={genres} />
          {children}
          <Footer />
        </CheckAuth>
      </body>
    </html>
  );
}
