// src/app/api/drive/route.js

import { NextResponse } from 'next/server';
import { getDriveService } from '@/src/lib/tokenManager';

// GET: Fetch last 10 modified documents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const drive = await getDriveService(userId);
    
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    const files = response.data.files || [];

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching Drive files:', error);
    return NextResponse.json({ message: 'Error fetching Drive files' }, { status: 500 });
  }
}

// POST: Create a new file
export async function POST(request) {
  try {
    const { userId, name, mimeType, content } = await request.json();
    const drive = await getDriveService(userId);

    const fileMetadata = {
      name: name,
      mimeType: mimeType,
    };

    const media = {
      mimeType: mimeType,
      body: content,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    return NextResponse.json({ message: 'File created successfully', id: response.data.id });
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json({ message: 'Error creating file' }, { status: 500 });
  }
}

// DELETE: Delete a file
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fileId = searchParams.get('fileId');

    const drive = await getDriveService(userId);

    await drive.files.delete({
      fileId: fileId
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ message: 'Error deleting file' }, { status: 500 });
  }
}

// PATCH: Update a file
export async function PATCH(request) {
  try {
    const { userId, fileId, name, content } = await request.json();
    const drive = await getDriveService(userId);

    const fileMetadata = {
      name: name
    };

    const media = {
      mimeType: 'text/plain',
      body: content
    };

    await drive.files.update({
      fileId: fileId,
      resource: fileMetadata,
      media: media
    });

    return NextResponse.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ message: 'Error updating file' }, { status: 500 });
  }
}