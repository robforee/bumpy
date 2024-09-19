// src/app/api/calendar/route.js

import { NextResponse } from 'next/server';
import { getCalendarService } from '@/src/lib/tokenManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const calendar = await getCalendarService(userId);
    console.log('got calendar object')
    let req = {
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      };
    const response = await calendar.events.list(req);

    const events = response.data.items;
    console.log('resp')

    return NextResponse.json(events);
  } catch (error) {

    
    console.error('Error in Calendar API route:config', error?.config);
    console.error('Error in Calendar API route:errors', error?.errors);
    console.error('Error in Calendar API route:error', error?.error);



    if (error.message === 'No tokens found for user') {
      return NextResponse.json({ error: 'User not authenticated. Please sign in again.' }, { status: 401 });
    }
    if (error.message === 'Access token not found for user') {
      return NextResponse.json({ error: 'Access token missing. Please re-authenticate.' }, { status: 401 });
    }
    if (error.message.includes('Calendar read-only scope is not authorized')) {
      return NextResponse.json({ error: 'Calendar access not authorized. Please re-authenticate with the correct permissions.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'An error occurred while fetching Calendar events' }, { status: 500 });
  }



}