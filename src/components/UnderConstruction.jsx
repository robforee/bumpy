"use client";
import React from 'react';
import Image from 'next/image';
import styles from './UnderConstruction.module.css';

const mockEmailData = [
  { id: 1, email: 'user1@example.com', status: 'Subscribed', lastActive: '2023-09-10' },
  { id: 2, email: 'user2@example.com', status: 'Unsubscribed', lastActive: '2023-09-08' },
  { id: 3, email: 'user3@example.com', status: 'Subscribed', lastActive: '2023-09-11' },
  { id: 4, email: 'user4@example.com', status: 'Pending', lastActive: '2023-09-09' },
  { id: 5, email: 'user5@example.com', status: 'Subscribed', lastActive: '2023-09-12' },
];

const UnderConstruction = () => {
  return (
    <div className={styles.underConstruction}>
      <div className={styles.imageContainer}>
        <Image
          src="/img/hacker-noon.webp"
          alt="Hacker furiously typing"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className={styles.overlay}>
          <h1 className={styles.title}>Under Construction</h1>
        </div>
      </div>
      <div className={styles.content}>
        <h1 className="text-3xl font-bold text-center mb-8">About Us</h1>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-700 mb-4">
                Welcome to Analyst Server! We are a dedicated team passionate about providing powerful tools for data analysis and topic management.
              </p>
              <p className="text-gray-700 mb-4">
                Our platform is designed to help researchers, analysts, and curious minds organize their thoughts, explore complex topics, and derive meaningful insights from data.
              </p>
              <p className="text-gray-700 mb-4">
                Whether you're working on academic research, business intelligence, or personal projects, our tools are here to support your journey of discovery and understanding.
              </p>
              <p className="text-gray-700">
                We believe in the power of organized knowledge and the impact it can have on decision-making and innovation. Join us in our mission to make sense of the world, one topic at a time.
              </p>
            </div>
          </div>
          <br/>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <h2 className={styles.subtitle}>We're working on something awesome!</h2>
        <p className={styles.description}>Our team is furiously typing away to bring you the best experience. In the meantime, check out this sneak peek of our email data:</p>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {mockEmailData.map((row) => (
                <tr key={row.id}>
                  <td>{row.email}</td>
                  <td>{row.status}</td>
                  <td>{row.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;