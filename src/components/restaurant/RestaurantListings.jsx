"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@/src/contexts/UserProvider';
import { getRestaurants_fromClient } from '@/src/app/actions/restaurant-actions';
import { callServerAction, useLoadingState } from '@/src/lib/utils/auth-utils';
import Link from 'next/link';
import renderStars from "@/src/components/restaurant/Stars.jsx";
import Filters from "@/src/components/restaurant/Filters.jsx";

const RestaurantItem = ({ restaurant }) => (
  <li key={restaurant.id}>
    <Link href={`/restaurant/${restaurant.id}`}>
      <ActiveResturant restaurant={restaurant} />
    </Link>
  </li>
);

const ActiveResturant = ({ restaurant }) => (
  <div>
    <ImageCover photo={restaurant.photo} name={restaurant.name} />
    <ResturantDetails restaurant={restaurant} />
  </div>
);

const ImageCover = ({ photo, name }) => (
  <div className="image-cover">
    <img src={photo} alt={name} />
  </div>
);

const ResturantDetails = ({ restaurant }) => (
  <div className="restaurant__details">
    <h2>{restaurant.name}</h2>
    {/* <RestaurantRating restaurant={restaurant} /> */}
    <RestaurantMetadata restaurant={restaurant} />
  </div>
);

const RestaurantRating = ({ restaurant }) => (
  <div className="restaurant__rating">
    <ul>{renderStars(restaurant.avgRating)}</ul>
    <span>({restaurant.numRatings})</span>
  </div>
);

const RestaurantMetadata = ({ restaurant }) => (
  <div className="restaurant__meta">
    <p>
      {/* {restaurant.category}  */}
      {/* | {restaurant.city} */}
      .. {"ok ".repeat(2)}
    </p>
  </div>
);

export default function RestaurantListings({ initialRestaurants, searchParams }) {
  const [restaurants, setRestaurants] = useState(initialRestaurants || []);
  const { user } = useUser();
  const { isLoading, error, startLoading, stopLoading, handleError } = useLoadingState();

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user) return;

      startLoading();
      const result = await callServerAction(getRestaurants_fromClient);
      
      if (result.success) {
        setRestaurants(result.data);
        stopLoading();
      } else {
        handleError(result.error);
      }
    };

    if (!initialRestaurants) {
      fetchRestaurants();
    }
  }, [initialRestaurants, user]);

  if (isLoading && !restaurants.length) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50">
        <p className="font-semibold">Error loading restaurants</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!restaurants.length) {
    return (
      <div className="text-gray-600 text-center py-8">
        <p className="mb-2">No restaurants found</p>
        {user && (
          <p className="text-sm">
            Be the first to add a restaurant!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Filters searchParams={searchParams} />
      <ul className="restaurant-list">
        {restaurants.map((restaurant) => (
          <RestaurantItem key={restaurant.id} restaurant={restaurant} />
        ))}
      </ul>
    </div>
  );
}
