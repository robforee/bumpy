"use client";

  import React, { useState } from 'react';
  import { auth } from '../lib/firebase/clientApp';
  import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
  import ReactMarkdown from 'react-markdown';
  
  const Dashboard = () => {
    const [emails, setEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
  // Sample reports data
  const [reports, setReports] = useState([
    { reportId: 1, text: 
        `
- Self - depressed and anxious 
- Finances - zero slack and underwater 
- Mariya - working memory and intuition 
- Julia - an island
- Katie
- John - infp
- Julie - scientific proposals
- EBCC - station prepare for event
- Storage - stage 1 @ 80%, stage 2 $0
- Assistant - ask questions after user input
- Elantra - broken door lock and lapsed registration
- Market - Buffet has gone to cash, invest in productivity
- Security - drones
- UI - shift left presentation style 
- PEEPs - related to clarity of expectations, opportunities to learn and grow, feeling cared about, and a connection to the organization's mission or purpose
- Future of work – manual labor last means service sector long term demand is management, seeking meaning, belonging, holistic care, and appreciation 
- Substrate - learn it, use it


        
        `

     },
     { reportId: 2, text: `
What does AI automation look like?

        
        `},

    // Add more reports as needed
  ]);
  
    const signInWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error('Error signing in with Google:', error);
      }
    };
  
    const fetchEmails = async () => {
      setIsLoading(true);
      try {
        const token = await auth.currentUser.getIdToken();
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
            <button onClick={signInWithGoogle} style={{ marginBottom: '10px', padding: '10px', cursor: 'pointer' }}>Sign in with Google</button>
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
          
          {reports.map((report, index) => (
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
  
          {[...Array(Math.max(0, 5 - reports.length))].map((_, index) => (
            <div key={`empty-${index}`} style={{ flex: '1 1 300px', minWidth: '300px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Box {index + reports.length + 2}</h2>
              <ReactMarkdown components={{
                ul: ({node, ...props}) => <ul style={markdownStyles.ul} {...props} />,
                li: ({node, ...props}) => <li style={markdownStyles.li} {...props} />
              }}>
                {`This is an empty box. You can add Markdown content here.
  
  - Item 1 with round bullet
  - Item 2 with round bullet
  
  **Bold text** and *italic text*.`}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default Dashboard;