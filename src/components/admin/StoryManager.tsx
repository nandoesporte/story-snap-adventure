import React, { useState } from 'react';
import { Story, StoryListItem } from '@/types';

const StoryManager: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);

  const formatStoryForList = (story: any): Story => ({
    ...story,
    content: Array.isArray(story.pages) 
      ? story.pages.map((page: any) => page.text || '') 
      : [],
    voice_type: story.voice_type === 'male' || story.voice_type === 'female' 
      ? story.voice_type 
      : 'female'
  });

  const handleStoriesUpdate = (fetchedStories: any[]) => {
    const formattedStories = fetchedStories.map(formatStoryForList);
    setStories(formattedStories);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story) => (
          <div key={story.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{story.title}</h2>
            <p>Character: {story.character_name}</p>
            <p>Created: {new Date(story.created_at).toLocaleDateString()}</p>
            <div className="mt-2 flex space-x-2">
              <button className="px-3 py-1 bg-blue-500 text-white rounded">View</button>
              <button className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
              <button className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryManager;
