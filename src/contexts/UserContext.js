// src/contexts/UserContext.js
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from "@/src/lib/firebase/auth.js";
import { userService } from '@/src/services/userService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        try {
          const profile = await userService.getUserProfile(authUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);