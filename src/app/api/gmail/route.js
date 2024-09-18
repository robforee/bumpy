// src/app/api/gmail/route.js

import { NextResponse }               from 'next/server';
import { getGmailService }             from '@/src/lib/tokenManager'


// GET: Fetch emails
export async function GET(request) {
  console.log('GET start')

  try {
    const { searchParams } = new URL(request.url);
    console.log('GET 2',searchParams)
    const userId = searchParams.get('userId');
    const query = searchParams.get('query') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
    console.log('GET 3',userId)

    const gmail = await getGmailService(userId);
    console.log('got GmailService',userId)
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults
    });

    const messages = response.data.messages || [];
    const detailedMessages = await Promise.all(messages.map(async (message) => {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id
      });
      return details.data;
    }));

    return NextResponse.json(detailedMessages);
  } catch (error) {
    //console.error('Error fetching emails:', error);
    console.error('Error fetching emails:');
    return NextResponse.json({ message: 'Error fetching emails' }, { status: 500 });
  }
}

// POST: Send email
export async function POST(request) {
  try {
    const { userId, to, subject, body } = await request.json();
    const gmail = await getGmailService(userId);

    const message = [
      'Content-Type: text/plain; charset="UTF-8"\r\n',
      'MIME-Version: 1.0\r\n',
      'Content-Transfer-Encoding: 7bit\r\n',
      `To: ${to}\r\n`,
      `Subject: ${subject}\r\n\r\n`,
      body
    ].join('');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return NextResponse.json({ message: 'Email sent successfully', id: res.data.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
  }
}

// DELETE: Delete email
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const messageId = searchParams.get('messageId');

    const gmail = await getGmailService(userId);

    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId
    });

    return NextResponse.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json({ message: 'Error deleting email' }, { status: 500 });
  }
}

// PATCH: Update email (e.g., mark as read)
export async function PATCH(request) {
  try {
    const { userId, messageId, addLabels, removeLabels } = await request.json();
    const gmail = await getGmailService(userId);

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels
      }
    });

    return NextResponse.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ message: 'Error updating email' }, { status: 500 });
  }
}

