
import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EditStory = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold">Edit Story</h1>
        <p className="mt-4">This is a placeholder for the edit story page. Editing story ID: {id}</p>
      </main>
      <Footer />
    </div>
  );
};

export default EditStory;
