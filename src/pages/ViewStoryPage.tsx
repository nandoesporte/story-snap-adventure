
import React from 'react';
import { useParams } from 'react-router-dom';
import StoryViewer from '@/components/story-viewer/StoryViewer';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ViewStoryPage = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        <StoryViewer storyId={id} />
      </div>
      <Footer />
    </div>
  );
};

export default ViewStoryPage;
