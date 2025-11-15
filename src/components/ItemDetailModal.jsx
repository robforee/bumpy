// src/components/ItemDetailModal.jsx
'use client';

import React from 'react';
import { X, Calendar, Mail, Database, FolderOpen, Reply, Archive, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

const ItemDetailModal = ({ isOpen, onClose, itemType, item }) => {
  if (!item) return null;

  const renderCalendarDetails = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Event</label>
        <p className="text-lg font-semibold text-gray-900">{item.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Start</label>
          <p className="text-sm text-gray-900">
            {new Date(item.start).toLocaleString()}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">End</label>
          <p className="text-sm text-gray-900">
            {new Date(item.end).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex space-x-2 mt-6">
        <Button className="flex-1">Join Meeting</Button>
        <Button variant="outline">View in Calendar</Button>
      </div>
    </div>
  );

  const renderEmailDetails = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500">From</label>
        <p className="text-sm text-gray-900">{item.from}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Subject</label>
        <p className="text-lg font-semibold text-gray-900">{item.subject}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Message</label>
        <div className="bg-gray-50 rounded-lg p-4 mt-2">
          <p className="text-sm text-gray-700">{item.snippet || 'No preview available'}</p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Received</label>
        <p className="text-sm text-gray-900">
          {new Date(item.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mt-6">
        <Button className="flex items-center space-x-2">
          <Reply className="h-4 w-4" />
          <span>Reply</span>
        </Button>
        <Button variant="outline" className="flex items-center space-x-2">
          <Archive className="h-4 w-4" />
          <span>Archive</span>
        </Button>
        <Button variant="outline" className="flex items-center space-x-2">
          <Tag className="h-4 w-4" />
          <span>Classify</span>
        </Button>
      </div>
    </div>
  );

  const renderBigQueryDetails = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Subject</label>
        <p className="text-lg font-semibold text-gray-900">{item.subject}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">From</label>
        <p className="text-sm text-gray-900">{item.email}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Category</label>
          <p className="text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {item.category}
            </span>
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Priority</label>
          <p className="text-sm">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              item.priority === 'High' ? 'bg-red-100 text-red-800' :
              item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {item.priority}
            </span>
          </p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Classified</label>
        <p className="text-sm text-gray-900">
          {new Date(item.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="flex space-x-2 mt-6">
        <Button variant="outline">Reclassify</Button>
        <Button variant="outline">View Original Email</Button>
      </div>
    </div>
  );

  const renderDriveDetails = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-500">File Name</label>
        <p className="text-lg font-semibold text-gray-900">{item.name}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Type</label>
        <p className="text-sm text-gray-900">{item.mimeType}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Last Modified</label>
        <p className="text-sm text-gray-900">
          {new Date(item.modifiedTime).toLocaleString()}
        </p>
      </div>
      <div className="flex space-x-2 mt-6">
        <Button className="flex-1">Open in Drive</Button>
        <Button variant="outline">Download</Button>
      </div>
    </div>
  );

  const getIcon = () => {
    switch (itemType) {
      case 'calendar':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'email':
        return <Mail className="h-5 w-5 text-purple-600" />;
      case 'bigquery':
        return <Database className="h-5 w-5 text-indigo-600" />;
      case 'drive':
        return <FolderOpen className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (itemType) {
      case 'calendar':
        return 'Event Details';
      case 'email':
        return 'Email Details';
      case 'bigquery':
        return 'Classification Details';
      case 'drive':
        return 'File Details';
      default:
        return 'Details';
    }
  };

  const renderContent = () => {
    switch (itemType) {
      case 'calendar':
        return renderCalendarDetails();
      case 'email':
        return renderEmailDetails();
      case 'bigquery':
        return renderBigQueryDetails();
      case 'drive':
        return renderDriveDetails();
      default:
        return <p className="text-sm text-gray-500">No details available</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <Button
            variant="ghost"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;
