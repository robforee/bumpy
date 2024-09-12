// src/components/Header.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOut, onAuthStateChanged } from "@/src/lib/firebase/auth.js";
import { db } from "@/src/lib/firebase/clientApp.js";
import { doc, setDoc } from "firebase/firestore";
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";

const Header = ({ initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (user === undefined) return;
      // refresh when user changed to ease testing
      if (user?.email !== authUser?.email) {
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleSignOut = async (event) => {
    event.preventDefault();
    try {
      await signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    try {
      await signInWithGoogle();
      // Handle successful sign-in (e.g., update UI, redirect)
    } catch (error) {
      // Handle sign-in error (e.g., show error message)
      console.error("Sign-in error:", error);
    }
  };
  
  const handleWriteToFirestore = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
	    console.log(user.uid,user.email)
      await setDoc(docRef, {
        lastClick: new Date().toISOString(),
        email: user.email
      }, { merge: true });
      console.log('Document written successfully',user.email);
    } catch (error) {
      console.error('Error writing document:', error);
    }
  };

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Analyst Server
      </Link>
      {user ? (
        <>
          <div className="profile">
            <p>
              <img className="profileImage" src={user.photoURL || "/profile.svg"} alt={user.email} />
              {user.displayName}
            </p>

            <div className="menu">
              ...
              <ul>
                <li>{user.displayName}</li>
                <li>
                  <Link href="/restaurants">
                    Restaurant Listings
                  </Link>
                </li>                
                <li>
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleWriteToFirestore}>
                    Write to Firestore
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;