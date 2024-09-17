// src/app/about/page.jsx
import React from 'react';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
      </div>
    </div>
  );
};

export default AboutUsPage;