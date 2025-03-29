
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Story } from '@/types';
import { Button } from '@/components/ui/button';

const StoryManager: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      const { data: storiesData, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      if (storiesData) {
        // Transform the data to match our Story interface
        const formattedStories: Story[] = storiesData.map(story => ({
          ...story,
          // Ensure pages is an array of objects
          pages: typeof story.pages === 'string' ? JSON.parse(story.pages) : story.pages,
          // Generate content array from pages if needed
          content: Array.isArray(story.pages) 
            ? story.pages.map((page: any) => page.text || '') 
            : [],
          // Ensure voice_type is properly typed
          voice_type: (story.voice_type === 'male' || story.voice_type === 'female') 
            ? story.voice_type 
            : 'female'
        }));
        
        setStories(formattedStories);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        const { error } = await supabase
          .from('stories')
          .delete()
          .eq('id', storyId);
          
        if (error) {
          throw new Error(error.message);
        }
        
        // Update the stories list
        setStories(stories.filter(story => story.id !== storyId));
      } catch (err) {
        console.error('Error deleting story:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete story');
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading stories...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Manager</h1>
      
      {stories.length === 0 ? (
        <p>No stories found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => (
            <div key={story.id} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold">{story.title}</h2>
              <p>Character: {story.character_name}</p>
              <p>Created: {new Date(story.created_at).toLocaleDateString()}</p>
              <div className="mt-2 flex space-x-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => window.open(`/stories/${story.id}`, '_blank')}
                >
                  View
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                  onClick={() => window.open(`/edit-story/${story.id}`, '_blank')}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() => handleDeleteStory(story.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryManager;
