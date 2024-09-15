// src/lib/gmail/fetchEmails.js

import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { fetchEmails } from "@/src/lib/gmail/serverOperations";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { currentUser } = await getAuthenticatedAppForUser();
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { query } = req.query;
      
      const emails = await fetchEmails(currentUser.uid, query);
      res.status(200).json(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
