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

  const loadUserProfile = useCallback(async (authUser) => {
    console.log('👤 [loadUserProfile] Loading user profile:', {
      uid: authUser?.uid,
      email: authUser?.email,
      timestamp: new Date().toISOString(),
      clientId: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    });
    try {
      const profile = await userService.getUserProfile(authUser.uid);
      if (!profile) {
        console.log("Profile not found, initializing new user");
        await userService.initializeNewUserIfNeeded(authUser);
        const newProfile = await userService.getUserProfile(authUser.uid);
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
        console.log('Auth state changed:', JSON.stringify({
          uid: authUser.uid,
          email: authUser.email
        }));
        setUser(authUser);
        await loadUserProfile(authUser);
      } else {
        console.log('Auth state changed: signed out');
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user);
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