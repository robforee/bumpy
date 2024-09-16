// src/components/Header.jsx
'use client';
import React, { useState, useEffect }          from 'react';
import Link                                    from "next/link";
import { useRouter }                           from 'next/navigation';
import { signInWithGoogle, 
                 signOut, onAuthStateChanged } from "@/src/lib/firebase/auth.js";
import { db }                                  from "@/src/lib/firebase/clientApp.js";
import { addFakeRestaurantsAndReviews,
    addReviewDirectly, addMessageToRestaurant } from "@/src/lib/firebase/firestore.js";

import { serverWriteAsImpersonatedUser, 
             ServerWriteWithServiceAccount }   from "@/src/app/actions.js";
import { writeToUserOwnedPath }                from "@/src/app/actions.js"; 

import { fetchEmailsFromServer }               from "@/src/lib/gmail/clientOperations";


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
  
  const handleWriteToUserOwnedPath = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const rating = {
        text: "This is a test rating.",
        rating: 4,
        timestamp: new Date().toISOString()
      };

      await writeToUserOwnedPath(user.uid, rating);
      console.log('Rating written successfully to user-owned path');
    } catch (error) {
      console.error('Error writing to user-owned path:', error);
    }
  };
  
  // from "@/src/lib/firebase/clientApp  which uses /auth-service-worker

  const handleWriteToReview = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }
  
    const restaurantId = '6SMbb7lkNJDImOAXiegw';
  
    try {
      // Write a review
      const review = {
        rating: 5,
        text: "This is a test review from the client side.",
        userId: user.uid,
        userName: user.displayName || user.email
      };
      // 
      await addReviewDirectly(db, restaurantId, review);
      console.log('Review written successfully');
  
      // Write a message
      const message = {
        text: "This is a test message from the client side.",
        userId: user.uid,
        userName: user.displayName || user.email
      };
      await addMessageToRestaurant(db, restaurantId, message);
      //console.log('Message written successfully');
  
    } catch (error) {
      console.error('Error writing review and message:', error);
    }
  };

  // from @/src/app/actions
  const handleServerSideWrite = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const restaurantId = 'zN454oNk93bCGQgmY1gA';
      const review = {
        text: "Perfectly cooked.",
        rating: 5,
        userId: user.uid,
        userName: user.displayName || user.email
      };
      
      await ServerWriteWithServiceAccount();
      console.log('Review written successfully from server-side');
    } catch (error) {
      console.error('Error writing review from server-side:', error);
    }
  };

  // from @/src/app/actions
  const handleServerSideUserWrite = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }
  
    try {
      const idToken = await user.getIdToken();
      const result = await serverWriteAsImpersonatedUser(idToken);
      console.log('Document written successfully from server-side as user');
    } catch (error) {
      console.error('Error writing document from server-side as user:', error);
    }
  };
  
  const handleFetchEmails = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const emails = await fetchEmailsFromServer();
      console.log('Fetched emails:', emails);
      // Update UI to display emails or navigate to an email view
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };  

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Analyst Server
      </Link>
            
      <Link href="/topics/PUqpeu0MzmTU58vhhQwy" style={{ color: 'red' }}>
            Root Topic
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
                  <a href="#" onClick={addFakeRestaurantsAndReviews}> Add sample restaurants </a>
                </li>
                <li>
                  <a href="#" onClick={handleWriteToReview}> Write RATINGS ETC </a>
                </li>
                <li>
                  <a href="#" onClick={handleWriteToUserOwnedPath}> handle Write To User Owned Path </a>
                </li>           
                <li>
                  <a href="#" onClick={handleServerSideUserWrite}> handle ServerSide User Write </a>
                </li>                           
                <li>
                  <a href="#" onClick={handleServerSideWrite}> handle ServerSide ServiceAccount Write </a>
                </li>
                <li>
                  <a href="#" onClick={handleFetchEmails}> Fetch Emails </a>
                </li>                
                <li>
                  <a href="#" onClick={handleSignOut}> Sign Out </a>
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