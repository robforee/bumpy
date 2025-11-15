// src/app/dashboard/dashboard-page-new.jsx
'use client';

import { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';

import CalendarWidget from '@/src/components/widgets/CalendarWidget';
import EmailWidget from '@/src/components/widgets/EmailWidget';
import BigQueryWidget from '@/src/components/widgets/BigQueryWidget';
import DriveWidget from '@/src/components/widgets/DriveWidget';
import ItemDetailModal from '@/src/components/ItemDetailModal';

export default function DashboardPageNew() {
  const { user, userProfile } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (itemType, item) => {
    setSelectedItemType(itemType);
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItemType(null);
    setSelectedItem(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Analyst Server</h2>
          <p className="text-gray-600">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your communications and stay organized
        </p>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Email Widget - Featured */}
        <div className="lg:col-span-2">
          <EmailWidget onItemClick={handleItemClick} />
        </div>

        {/* BigQuery Classifications Widget */}
        <BigQueryWidget onItemClick={handleItemClick} />

        {/* Calendar Widget */}
        <CalendarWidget onItemClick={handleItemClick} />

        {/* Drive Widget */}
        <div className="lg:col-span-2">
          <DriveWidget onItemClick={handleItemClick} />
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        itemType={selectedItemType}
        item={selectedItem}
      />
    </div>
  );
}
