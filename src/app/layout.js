import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import StoreProvider from "./providers";
import Layout from "@/components/Layout";

const sans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/* Tabular figures for every count, duration and date in the UI. */
const mono = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Work Tracker",
  description:
    "Track what you worked on each day, across projects, with a daily log and task board.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <StoreProvider>
          <Layout>{children}</Layout>
        </StoreProvider>
      </body>
    </html>
  );
}
