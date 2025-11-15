// src/components/widgets/BigQueryWidget.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Database, ExternalLink, Tag } from 'lucide-react';
import { useUser } from '@/src/contexts/UserProvider';

const BigQueryWidget = ({ onItemClick }) => {
  const { user } = useUser();
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClassifications();
    }
  }, [user]);

  const loadClassifications = async () => {
    try {
      // TODO: Fetch email classifications from BigQuery
      // Stub data for now
      setClassifications([
        {
          id: '1',
          email: 'team-update@company.com',
          subject: 'Weekly Team Update',
          category: 'Work',
          priority: 'Medium',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'newsletter@service.com',
          subject: 'Monthly Newsletter',
          category: 'Newsletter',
          priority: 'Low',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          email: 'alert@bank.com',
          subject: 'Account Security Alert',
          category: 'Important',
          priority: 'High',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error loading classifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Email Classifications</h3>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Email Classifications</h3>
        </div>
        <span className="text-xs text-blue-600 font-medium">BigQuery</span>
      </div>

      <div className="space-y-3">
        {classifications.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No email classifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Email classifications will appear here once you start classifying messages
            </p>
          </div>
        ) : (
          classifications.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick && onItemClick('bigquery', item)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Tag className="h-3 w-3 text-indigo-500" />
                    <span className="text-xs font-medium text-indigo-600">{item.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.subject}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    From: {item.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleDateString()} at{' '}
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> This widget displays email classifications stored in BigQuery.
          Integration with real BigQuery data coming soon.
        </p>
      </div>
    </div>
  );
};

export default BigQueryWidget;
