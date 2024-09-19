// src/lib/gmail/gmailClientOperations.js

// src/lib/gmail/gmailClientOperations.js

export async function fetchEmailsFromServer(query = '', userId = null) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  console.log("UPDATED")

  try {
    const response = await fetch(`/api/gmail?userId=${encodeURIComponent(userId)}&query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server responded with an error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match your component's expectations
    const emails = data.map(email => ({
      id: email.id,
      subject: email.payload.headers.find(h => h.name.toLowerCase() === "subject")?.value || 'No Subject',
      from: email.payload.headers.find(h => h.name.toLowerCase() === "from")?.value || 'Unknown Sender',
      snippet: email.snippet || 'No preview available',
      date: email.payload.headers.find(h => h.name.toLowerCase() === "date")?.value || 'Unknown Date'
    }));

    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error('Failed to fetch emails. Please try again later.');
  }
}

