// src/app/layout.js
import "@/src/app/styles.css";
import Header from "@/src/components/Header.jsx";
import { UserProvider } from "../contexts/UserProvider";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analyst Server",
  description: "Analyst Server provides secure communications monitoring and analysis",
};

// MAIN CLASSS WAS 
const orig = 'flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8'
const fulw = 'flex-grow w-full px-4 sm:px-6 lg:container lg:mx-auto lg:px-8 py-8'
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <UserProvider>
          <div className="LAYOUT min-h-screen flex flex-col inside-user-provider">
            <Header />
            <main className={`${fulw}`}>
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
/*
structured queries


authentication


data storage


prompt passing





*/