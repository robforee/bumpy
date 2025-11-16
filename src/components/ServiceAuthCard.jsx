// src/components/ServiceAuthCard.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/src/lib/firebase/clientApp';
import { requestServiceAuth } from '@/src/lib/firebase/firebaseAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';

// Service configurations
const SERVICE_CONFIG = {
  gmail: {
    displayName: 'Gmail',
    icon: '📧',
    description: 'Send and read emails',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    color: 'bg-red-500'
  },
  drive: {
    displayName: 'Google Drive',
    icon: '📁',
    description: 'Access your files',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file'
    ],
    color: 'bg-blue-500'
  },
  calendar: {
    displayName: 'Google Calendar',
    icon: '📅',
    description: 'View and create events',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    color: 'bg-green-500'
  },
  messenger: {
    displayName: 'Google Chat',
    icon: '💬',
    description: 'Send and receive messages',
    scopes: [
      'https://www.googleapis.com/auth/chat.messages',
      'https://www.googleapis.com/auth/chat.messages.create',
      'https://www.googleapis.com/auth/chat.spaces'
    ],
    color: 'bg-purple-500'
  }
};

export default function ServiceAuthCard({ serviceName }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scopes, setScopes] = useState([]);

  const config = SERVICE_CONFIG[serviceName];

  if (!config) {
    console.error(`Unknown service: ${serviceName}`);
    return null;
  }

  useEffect(() => {
    // Wait for auth state to initialize before checking
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAuth();
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [serviceName]);

  const checkAuth = async () => {
    try {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }

      const db = getFirestore();
      const serviceCredsRef = doc(db, `service_credentials/${auth.currentUser.uid}_${serviceName}`);
      const serviceCredsSnap = await getDoc(serviceCredsRef);

      if (serviceCredsSnap.exists()) {
        const creds = serviceCredsSnap.data();
        setIsAuthorized(true);
        setScopes(creds.scopes || []);
      } else {
        setIsAuthorized(false);
        setScopes([]);
      }
    } catch (error) {
      console.error(`Error checking ${serviceName} auth:`, error);
      setIsAuthorized(false);
      setScopes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    requestServiceAuth(serviceName, config.scopes);
  };

  const handleDisconnect = async () => {
    // TODO: Implement disconnect functionality
    alert('Disconnect functionality coming soon');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <CardTitle>{config.displayName}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          {isAuthorized && (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : isAuthorized ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Authorized scopes:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {scopes.map((scope, idx) => (
                  <li key={idx} className="text-gray-500">
                    {scope.split('/').pop()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConnect}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Reconnect
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            className={`w-full ${config.color} hover:opacity-90 text-white`}
          >
            Connect {config.displayName}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
