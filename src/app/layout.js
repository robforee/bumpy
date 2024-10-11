// src/app/layout.js
import "@/src/app/styles.css";
import Header from "@/src/components/Header.jsx";
import { UserProvider } from "../contexts/UserProvider";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analyst Server",
  description: "Analyst Server provides secure communications monitoring and analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <UserProvider>
          <div className="min-h-screen flex flex-col inside-user-provider">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}