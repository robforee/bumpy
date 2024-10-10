// src/contexts/UserProvider.js
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from '@/src/lib/firebase/firebaseAuth';
import { userService } from '@/src/services/userService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (uid) => {
    try {
      const profile = await userService.getUserProfile(uid);
      if (!profile) {
        console.log("Profile not found, initializing new user");
        await userService.initializeNewUserIfNeeded({ uid });
        const newProfile = await userService.getUserProfile(uid);
        setUserProfile(newProfile);
      } else {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        console.log("Auth state changed:",process.env.NODE_ENV, 
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 
          process.env.NEXT_PUBLIC_FOREE
        ); //  
        setUser(authUser);
        await loadUserProfile(authUser.uid);
      } else {
        console.log("Auth state changed:");
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  }, [user, loadUserProfile]);

  const value = {
    user,
    userProfile,
    loading,
    refreshUserProfile
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);