// src/components/widgets/DriveWidget.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, ExternalLink, FileText, Image, File } from 'lucide-react';
import { checkServiceAuth } from '@/src/app/actions/auth-actions';
import { queryDriveFiles } from '@/src/app/actions/google-actions';
import { requestServiceAuth } from '@/src/lib/firebase/firebaseAuth';
import { useUser } from '@/src/contexts/UserProvider';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/clientApp';

const DriveWidget = ({ onItemClick }) => {
  const { user } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [user]);

  const checkAuth = async () => {
    if (!user) return;
    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await checkServiceAuth('drive', idToken);
      setIsAuthorized(result.isAuthorized);

      if (result.isAuthorized) {
        // Fetch real Drive files
        const filesResult = await queryDriveFiles(user.uid, idToken, 5);
        if (filesResult.success) {
          setFiles(filesResult.files);
        } else {
          console.error('Error fetching drive files:', filesResult.error);
          setFiles([]);
        }
      }
    } catch (error) {
      console.error('Error checking drive auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file'
    ];
    requestServiceAuth('drive', scopes);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-green-600" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-600" />;
    return <File className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FolderOpen className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Drive</h3>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FolderOpen className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Drive</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Connect Google Drive to access your files</p>
        <button
          onClick={handleConnect}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Connect Drive
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Drive</h3>
        </div>
        <span className="text-xs text-green-600 font-medium">Connected</span>
      </div>

      <div className="space-y-3">
        {files.length === 0 ? (
          <p className="text-sm text-gray-500">No recent files</p>
        ) : (
          files.map((file) => (
            <button
              key={file.id}
              onClick={() => onItemClick && onItemClick('drive', file)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Modified {new Date(file.modifiedTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default DriveWidget;
