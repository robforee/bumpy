"use client";

import React, { useState, useEffect } from "react";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { useUser } from '@/src/contexts/UserProvider';
import { getReviews_fromClient } from '@/src/app/actions/review-actions';
import ReviewsListClient from "@/src/components/restaurant/Reviews/ReviewsListClient";
import { ReviewSkeleton } from "@/src/components/restaurant/Reviews/Review";

export default function ReviewsList({ restaurantId, initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [loading, setLoading] = useState(!initialReviews);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user || !restaurantId) return;

      try {
        setLoading(true);
        const idToken = await getIdToken(auth.currentUser);
        const result = await getReviews_fromClient(restaurantId, idToken);
        
        if (result.success) {
          setReviews(result.data);
        } else {
          setError(result.error || 'Failed to fetch reviews');
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (!initialReviews) {
      fetchReviews();
    }
  }, [restaurantId, initialReviews, user]);

  if (loading) {
    return <ReviewsListSkeleton numReviews={3} />;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <ReviewsListClient
      initialReviews={reviews}
      restaurantId={restaurantId}
      userId={user?.uid}
    />
  );
}

export function ReviewsListSkeleton({ numReviews }) {
  return (
    <article>
      <ul className="reviews">
        {Array(numReviews)
          .fill(0)
          .map((value, index) => (
            <ReviewSkeleton key={`loading-review-${index}`} />
          ))}
      </ul>
    </article>
  );
}
