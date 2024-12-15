// src/components/restaurant/Restaurant.jsx
"use client";

// This components shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

import React, { useState, useEffect } from "react";
import { useUser } from '@/src/contexts/UserProvider';
import { getRestaurant_fromClient } from '@/src/app/actions/restaurant-actions';
import { callServerAction, useLoadingState } from '@/src/lib/utils/auth-utils';
import RestaurantDetails from "@/src/components/restaurant/RestaurantDetails.jsx";

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children
}) {
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  const { user } = useUser();
  const { isLoading, error, startLoading, stopLoading, handleError } = useLoadingState();

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!user || !id) return;

      startLoading();
      const result = await callServerAction(getRestaurant_fromClient, id);
      
      if (result.success) {
        setRestaurantDetails(result.data);
        stopLoading();
      } else {
        handleError(result.error);
      }
    };

    if (!initialRestaurant) {
      fetchRestaurant();
    }
  }, [id, initialRestaurant, user]);

  if (isLoading && !restaurantDetails) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50">
        <p className="font-semibold">Error loading restaurant</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!restaurantDetails) {
    return <div className="text-gray-600">Restaurant not found</div>;
  }

  return (
    <div className="restaurant-details">
      <RestaurantDetails 
        restaurant={restaurantDetails}
        user={user}
      />
      {children}
    </div>
  );
}
