// src/lib/gmail/clientOperations.js

export async function fetchEmailsFromServer(query = '') {
    try {
      const response = await fetch(`/api/gmail/fetchEmails?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
