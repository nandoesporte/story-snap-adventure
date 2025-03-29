
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-4">This is a placeholder for the settings page.</p>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
