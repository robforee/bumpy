// src/app/layout.js

import "@/src/app/styles.css";
import Header from "@/src/components/Header.jsx";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { checkGmailAccess } from "@/src/lib/gmail/serverOperations";

// Force next.js to treat this route as server-side rendered
// Without this line, during the build process, next.js will treat this route as static and build a static HTML file for it
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analyst Server", description: "Analyst Server provides secure communications monitoring and analysis",
};

export default async function RootLayout({ children }) {
  const { currentUser } = await getAuthenticatedAppForUser();
  const hasGmailAccess = currentUser ? await checkGmailAccess(currentUser.uid) : false;

  return (
    <html lang="en">
      <body>
        <Header initialUser={currentUser?.toJSON()} hasGmailAccess={hasGmailAccess} />
        <main>{children}</main>
      </body>
    </html>
  );
}

