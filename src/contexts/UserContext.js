// src/contexts/UserContext.js
"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from '@/src/lib/firebase/auth';
import { userService } from '@/src/services/userService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshUserProfile = async () => {
    if (user) {
      setProfileLoading(true);
      try {
        console.log('Refreshing user profile for:', user.uid);
        const profile = await userService.getUserProfile(user.uid);
        console.log('Fetched user profile:', profile);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('Setting up auth state change listener');
    const unsubscribe = onAuthStateChanged(async (user) => {
      console.log('Auth state changed. User:', user?.uid);
      setUser(user);
      if (user) {
        await refreshUserProfile();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, userProfile, profileLoading, refreshUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);