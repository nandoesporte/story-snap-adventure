
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold">404</h1>
        <h2 className="text-2xl mt-4">Page not found</h2>
        <p className="mt-2">The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Go back home
        </Link>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
