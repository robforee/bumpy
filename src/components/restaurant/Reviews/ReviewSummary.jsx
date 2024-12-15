'use client';

import { useState, useEffect } from 'react';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { useUser } from '@/src/contexts/UserProvider';
import { getReviews_fromClient } from '@/src/app/actions/review-actions';

const { GoogleGenerativeAI } = require("@google/generative-ai");

export function GeminiSummary({ restaurantId }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    const generateSummary = async () => {
      if (!user || !restaurantId) return;

      try {
        setLoading(true);
        const idToken = await getIdToken(auth.currentUser);
        const result = await getReviews_fromClient(restaurantId, idToken);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch reviews');
        }

        const reviews = result.data;
        if (!reviews.length) {
          setSummary('No reviews yet.');
          return;
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});

        const reviewSeparator = "@";
        const prompt = `
          Based on the following restaurant reviews, 
          where each review is separated by a '${reviewSeparator}' character, 
          create a one-sentence summary of what people think of the restaurant. 
          
          Here are the reviews: ${reviews.map(review => review.text).join(reviewSeparator)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        setSummary(response.text());
      } catch (error) {
        console.error('Error generating summary:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [restaurantId, user]);

  if (loading) {
    return <GeminiSummarySkeleton />;
  }

  if (error) {
    if (error.includes("403 Forbidden")) {
      return (
        <p className="text-red-500">
          This service account doesn't have permission to talk to Gemini via Vertex
        </p>
      );
    }
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="restaurant__review_summary">
      <p>{summary}</p>
      <p>✨ Summarized with Gemini</p>
    </div>
  );
}

export function GeminiSummarySkeleton() {
  return (
    <div className="restaurant__review_summary animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
