// src/lib/drive/driveClientOperations.js

export async function fetchDriveFilesFromServer(userId = null) {
    if (!userId) {
      throw new Error('User ID is required');
    }
  
    try {
      const response = await fetch(`/api/drive?userId=${encodeURIComponent(userId)}`, {
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
      const files = data.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        // Add any other properties you need
      }));
  
      return files;
    } catch (error) {
      console.error('Error fetching Drive files:', error);
      throw new Error('Failed to fetch Drive files. Please try again later.');
    }
  }
  
