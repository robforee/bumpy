"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@/src/contexts/UserProvider';
import { getReviews_fromClient } from '@/src/app/actions/review-actions';
import { Review } from "@/src/components/restaurant/Reviews/Review";
import { callServerAction, useLoadingState } from '@/src/lib/utils/auth-utils';

export default function ReviewsListClient({
  initialReviews,
  restaurantId,
}) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const { user } = useUser();
  const { isLoading, error, startLoading, stopLoading, handleError } = useLoadingState();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user || !restaurantId) return;

      startLoading();
      const result = await callServerAction(getReviews_fromClient, restaurantId);
      
      if (result.success) {
        setReviews(result.data);
        stopLoading();
      } else {
        handleError(result.error);
      }
    };

    // Set up polling for new reviews
    const pollInterval = setInterval(fetchReviews, 30000); // Poll every 30 seconds

    // Initial fetch if no initial reviews
    if (!initialReviews) {
      fetchReviews();
    }

    return () => clearInterval(pollInterval);
  }, [restaurantId, initialReviews, user]);

  if (isLoading && !reviews.length) {
    return <div className="animate-pulse">Loading reviews...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50">
        <p className="font-semibold">Error loading reviews</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <article>
      <ul className="reviews">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <Review
              key={review.id}
              rating={review.rating}
              text={review.text}
              userName={review.userName}
              timestamp={review.timestamp}
            />
          ))
        ) : (
          <p className="text-gray-600">
            This restaurant has not been reviewed yet.
            {!user ? " Sign in to add your review!" : " Be the first to review!"}
          </p>
        )}
      </ul>
    </article>
  );
}
