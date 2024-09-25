// src/app/about/page.jsx
import React from 'react';

import AddTopicModal from "@/src/components/AddTopicModal.jsx";

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">About Us</h1>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-700 mb-4">
              Welcome to Topic Browser
            </p>
            <AddTopicModal />
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;