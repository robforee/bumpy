// src/components/CodeBlock.jsx

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ children, language = 'javascript' }) => {
  // Remove leading newline and common indentation
  //console.log(typeof(children))
  
  let code = children.trim().replace(/^\n|\n$/g, '');
  //let code = children;
  const lines = code.split('\n');
  const commonIndent = lines[0].match(/^\s*/)[0].length;
  const trimmedCode = lines.map(line => line.slice(commonIndent)).join('\n');

  return (
    <div className="relative my-4">
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        customStyle={{
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        {trimmedCode}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;