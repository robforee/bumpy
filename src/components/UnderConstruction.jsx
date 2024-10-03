"use client";
import React from 'react';
import Image from 'next/image';
//import styles from './UnderConstruction.module.css';

const mockEmailData = [
  { id: 1, email: 'user1@example.com', status: 'Subscribed', lastActive: '2023-09-10' },
  { id: 2, email: 'user2@example.com', status: 'Unsubscribed', lastActive: '2023-09-08' },
  { id: 3, email: 'user3@example.com', status: 'Subscribed', lastActive: '2023-09-11' },
  { id: 4, email: 'user4@example.com', status: 'Pending', lastActive: '2023-09-09' },
  { id: 5, email: 'user5@example.com', status: 'Subscribed', lastActive: '2023-09-12' },
];

const UnderConstruction = () => {
  return (
    <div className="w-full max-w-6xl mx-auto p-5">
      <div className="relative w-full h-[300px] mb-5">
        <Image
          src="/img/hacker-noon.webp"
          alt="Hacker furiously typing"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-15 flex items-center justify-center">
          <h1 className="text-white text-5xl text-center">Under Construction</h1>
        </div>
      </div>
      <div className="bg-white p-5 rounded-lg shadow-md">
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
          <h2 className="text-2xl text-gray-700 mb-2">We're working on something awesome!</h2>
          <p className="text-gray-600 mb-4">Our team is furiously typing away to bring you the best experience. In the meantime, check out this sneak peek of our email data:</p>
        
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Email</th>
                  <th className="border border-gray-300 p-2 text-left">Status</th>
                  <th className="border border-gray-300 p-2 text-left">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {mockEmailData.map((row) => (
                  <tr key={row.id} className="even:bg-gray-50">
                    <td className="border border-gray-300 p-2">{row.email}</td>
                    <td className="border border-gray-300 p-2">{row.status}</td>
                    <td className="border border-gray-300 p-2">{row.lastActive}</td>
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