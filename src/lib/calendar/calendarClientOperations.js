// src/lib/calendar/calendarClientOperations.js

export async function fetchCalendarEventsFromServer(userId = null) {
    if (!userId) {
      throw new Error('User ID is required');
    }
  
    try {
      const response = await fetch(`/api/calendar?userId=${encodeURIComponent(userId)}`, {
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
  
      if (data.error) {
        console.error('Error from server:', data.error);
        throw new Error(data.error);
      }
  
      // Transform the data to match your component's expectations
      const events = data.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        description: event.description,
      }));
  
      return events;
    } catch (error) {
      console.error('Error fetching Calendar events:', error);
      throw error;
    }
  }