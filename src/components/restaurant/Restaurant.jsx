// src/components/resturant/Restaurant.jsx
"use client";

// This components shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

import { React, useState, useEffect, Suspense } from "react";
import dynamic from 'next/dynamic'
import {
  getRestaurantSnapshotById,
} from "@/src/lib/firebase/firestore.js";
import {useUser} from '@/src/lib/getUser'
import RestaurantDetails from "@/src/components/restaurant/RestaurantDetails.jsx";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

const ReviewDialog = dynamic(() => import('@/src/components/restaurant/ReviewDialog.jsx'));

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children
}) {
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  const [isOpen, setIsOpen] = useState(false);

  // The only reason this component needs to know the user ID is to associate a review with the user, and to know whether to show the review dialog
  const userId = useUser()?.uid || initialUserId;
  const userName = useUser()?.displayName || 'Explorer'
  console.log(userName);
  const [review, setReview] = useState({
    rating: 0,
    text: "",
  });
  console.log('@@@',userId,review);

  const onChange = (value, name) => {
    setReview({ ...review, [name]: value });
  };

  async function handleRestaurantImage(target) {
    const image = target.files ? target.files[0] : null;
    if (!image) {
      return;
    }

    const imageURL = await updateRestaurantImage(id, image);
    setRestaurantDetails({ ...restaurant, photo: imageURL });
  }

  const handleClose = () => {
    console.log('@@@ Restaurant.handleClose.setReview')
    setIsOpen(false);
    setReview({ rating: 2, text: "CATS" });
  };

  useEffect(() => {
    console.log('@@@ Restaurant useEffect')
    const unsubscribeFromRestaurant = getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data);
    });

    return () => {
      unsubscribeFromRestaurant();
    };
  }, []);

  console.log('@@@ Restaurant => restaurantDetails')
  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails}
        userId={userId}
        handleRestaurantImage={handleRestaurantImage}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      >{children}</RestaurantDetails>
      {userId && <Suspense fallback={<p>Loading...</p>}><ReviewDialog
        isOpen={isOpen}
        handleClose={handleClose}
        review={review}
        onChange={onChange}
        userId={userId}
        userName={userName}
        id={id}
      /></Suspense>}
    </>
  );
}
