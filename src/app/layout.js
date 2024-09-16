// src/app/layout.js
import "@/src/app/styles.css";
import Header from "@/src/components/Header.jsx";
import { UserProvider } from '../contexts/UserContext';

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analyst Server",
  description: "Analyst Server provides secure communications monitoring and analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Header />
          <main>{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}