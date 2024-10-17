// src/components/QueryOpenAi.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { runOpenAiQuery, runConceptQuery } from "@/src/app/actions/query-actions";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { useUser } from '@/src/contexts/UserProvider';

import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const QueryOpenAi = () => {
  const { user } = useUser();
  const [prompt, setPrompt] = useState('');
  const [concept, setConcept] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // CoT - Chain of thought
  const Step = z.object({
    explanation: z.string(),
    output: z.string(),
  });
  const MathReasoning = z.object({
    steps: z.array(Step),
    final_answer: z.string(),
  });  

  // HOW TO CHUNK DOWN A CONCEPT
  const Comment = z.object({
    title: z.string(),  subtitle: z.string(), owner: z.string(),
    parentTopicName: z.string(),    // parentTopic.title
    parentTopicConcept: z.string(), // parentTopic.concept
    concept: z.string(),            // keep in mind
    context: z.string(),            // context += "amount owed, market value,"

  })

  const Topic = z.object({  // chunk it down
    
    title: z.string(),  subtitle: z.string(),// next step

    concept: z.string(), // what is the project concept "sell the house"

    comment: z.string(), // how we got here             "25 years, time to cash in and move on"
    comment: z.string(), // things to keep in mind      "my skills, my ignorance, my timeframe"
    comment: z.string(), // things to keep in mind      "amount owed, market value,"

    context: z.string(), // identify sub-topics to study (given)
    context: z.string(), // overall plan                 (given)
    context: z.string(), // what to do next              (given)

    
    //example: z.array(Topic)    
  })

  const Topic_recursive = z.lazy(() => z.object({
    title: z.string(),
    subtitle: z.string(),
    concept: z.string(),
    comments: z.array(Comment).optional(),
    context: z.array(z.string()),
    subtopics: z.array(Topic).optional() // This is the recursive part
  }));

  const ExampleMessages = [
    {name: 'how can I solve 8x + 7 = -23',
      type: 'Chain of thought',
      messages:[
        { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
        { role: "user", content: "how can I solve 8x + 7 = -23" },
      ],
      response_format: zodResponseFormat(MathReasoning, "math_reasoning"),
    }
  ]

  useEffect(() => {
    
    // Set initial prompt based on current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    //setPrompt(`Write a few lines telling what big events typically go on in the world in mid ${currentMonth}.`);
  }, []);

  const handleSubmit = async (e) => {
    if (!user) {
      setError('No user logged in');
      return;
    }    
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {

      const idToken = await getIdToken(auth.currentUser);

      const queryData = {
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
          { role: "user", content: "how can I solve 8x + 7 = -23" },
        ],
        response_format: zodResponseFormat(MathReasoning, "math_reasoning"),
      };
      const queryString = JSON.stringify(queryData);

      console.log('#\tqueryData')
      const completion = await runConceptQuery(queryString, idToken);
      //console.log(queryData)
      //console.log(completion)
      setResponse(JSON.stringify(JSON.parse(completion),null,2));

      //const math_reasoning = completion.choices[0].message.parsed;
      //console.log(math_reasoning);

      // if (result.success) {
      //   setResponse('result.content');
      // } else {
      //   throw new Error(result.error);
      // }
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
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prompt">
            Concept
          </label>
          <textarea
            id="concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
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
