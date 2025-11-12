// src/components/Dashboard.jsx
"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/src/contexts/UserProvider';
import { sendGmailMessage } from '@/src/app/actions/google-actions';

const Dashboard = () => {
  const { user } = useUser();
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Send email form state
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

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

  const handleSendEmail = async () => {
    if (!sendTo || !sendSubject || !sendBody) {
      setSendResult({ success: false, error: 'Please fill in all fields' });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const token = await user.getIdToken();
      const result = await sendGmailMessage(token, sendTo, sendSubject, sendBody);
      setSendResult(result);

      if (result.success) {
        // Clear form on success
        setSendTo('');
        setSendSubject('');
        setSendBody('');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({ success: false, error: error.message });
    }
    setIsSending(false);
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

        <div style={{ flex: '1 1 300px', minWidth: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Send Test Email</h2>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>Test sending emails via Gmail API</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To:</label>
              <input
                type="email"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="recipient@example.com"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subject:</label>
              <input
                type="text"
                value={sendSubject}
                onChange={(e) => setSendSubject(e.target.value)}
                placeholder="Email subject"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Body:</label>
              <textarea
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                placeholder="Email body"
                rows={6}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              style={{
                padding: '10px',
                cursor: isSending ? 'not-allowed' : 'pointer',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </button>
            {sendResult && (
              <div style={{
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: sendResult.success ? '#d4edda' : '#f8d7da',
                color: sendResult.success ? '#155724' : '#721c24',
                border: `1px solid ${sendResult.success ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {sendResult.success ? (
                  <>
                    <strong>✓ Email sent successfully!</strong>
                    <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                      Message ID: {sendResult.messageId}
                    </div>
                  </>
                ) : (
                  <>
                    <strong>✗ Error:</strong> {sendResult.error}
                  </>
                )}
              </div>
            )}
          </div>
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
