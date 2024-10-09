// src/components/QueryOpenAi.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { runOpenAiQuery } from "@/src/app/actions/query-actions";

const QueryOpenAi = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set initial prompt based on current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    setPrompt(`Write a few lines telling what big events typically go on in the world in mid ${currentMonth}.`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const queryData = {
        systemPrompt: "You are a helpful assistant providing information about world events.",
        userPrompts: [prompt],
        model: "gpt-4o-mini",
        temperature: 0.7,
        responseFormat: { type: "text" },
      };

      const result = await runOpenAiQuery(queryData);

      if (result.success) {
        setResponse(result.content);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4">Query OpenAI</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prompt">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !prompt}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit Query'}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {response && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};

export default QueryOpenAi;
