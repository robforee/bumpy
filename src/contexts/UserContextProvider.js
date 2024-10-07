// src/contexts/UserContextProvider.js
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from '@/src/lib/firebase/auth';
import { userService } from '@/src/services/userService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (authUser) => {
    try {
      const result = await userService.getUserInfo();
      if (result.success) {
        setUserProfile(result.data.profile)  
      } else {
        if(result?.error === "not logged in"){
          // happens alot, no big deal
        }else{
          throw new Error('error loading user info', result.error);  
        }
      }    
  
    } catch (error) {
      console.error("Error loading userService.getUserInfo:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        setUser(authUser);
        await loadUserProfile(authUser);
        console.log("Auth state changed: user profile loaded");
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