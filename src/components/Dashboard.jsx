// src/components/Dashboard.jsx
"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/src/contexts/UserProvider';

const Dashboard = () => {
  const { user } = useUser();
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample reports data
  const [reports, setReports] = useState([
    { reportId: 1, text: ``     },
    { reportId: 2, text: ``     },
  ]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/gmail', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEmails(data.emails.slice(0, 10));
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
    setIsLoading(false);
  };

  // Custom styles for Markdown content
  const markdownStyles = {
    ul: {
      listStyleType: 'none',
      paddingLeft: '20px',
    },
    li: {
      position: 'relative',
      marginBottom: '5px',
    },
    'li::before': {
      content: '""',
      position: 'absolute',
      left: '-15px',
      top: '8px',
      width: '6px',
      height: '6px',
      backgroundColor: 'black',
      borderRadius: '50%',
    },
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ flex: '1 1 300px', minWidth: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Gmail Query</h2>
          <button onClick={fetchEmails} disabled={isLoading} style={{ padding: '10px', cursor: 'pointer' }}>
            {isLoading ? 'Loading...' : 'Fetch Last 10 Emails'}
          </button>
          {emails.length > 0 && (
            <ul style={{ marginTop: '1rem', paddingLeft: '20px' }}>
              {emails.map((email, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  <strong>{email.subject}</strong> - {email.from}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {reports.map((report) => (
          <div key={report.reportId} style={{ flex: '1 1 300px', minWidth: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Report {report.reportId}</h2>
            <ReactMarkdown components={{
              ul: ({node, ...props}) => <ul style={markdownStyles.ul} {...props} />,
              li: ({node, ...props}) => <li style={markdownStyles.li} {...props} />
            }}>
              {report.text}
            </ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
