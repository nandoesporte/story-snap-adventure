
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="mt-4">This is a placeholder for the pricing page.</p>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
