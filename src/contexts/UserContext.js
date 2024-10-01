// src/contexts/UserContext.js
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from "@/src/lib/firebase/auth.js";
import { updateProfile } from "firebase/auth";
import { userService } from '@/src/services/userService';
import { auth } from "@/src/lib/firebase/clientApp";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // Check if the photoURL has changed
        if (authUser.photoURL !== user?.photoURL) {
          try {
            await updateProfile(authUser, { photoURL: authUser.photoURL });
            await userService.updateUserPhotoURL(authUser.uid, authUser.photoURL);
            setUser({ ...authUser });
          } catch (error) {
            console.error("Error updating user profile:", error);
          }
        } else {
          setUser(authUser);
        }

        try {
          const profile = await userService.getUserProfile(authUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);