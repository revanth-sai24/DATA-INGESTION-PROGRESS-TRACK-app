import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from './providers';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TaskMaster - Professional Task Management",
  description: "Manage your tasks efficiently with our professional task management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          <Layout>
            {children}
          </Layout>
        </StoreProvider>
      </body>
    </html>
  );
}
