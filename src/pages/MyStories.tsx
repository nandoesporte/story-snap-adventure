
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Story, StoryListItem, Json } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MyStories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      toast.info('Please log in to view your stories.');
      return;
    }
    
    fetchMyStories();
  }, [user]);

  const fetchMyStories = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (storiesError) {
        throw new Error(storiesError.message);
      }
      
      if (storiesData) {
        // Transform to match our StoryListItem interface
        const formattedStories = storiesData.map((story) => {
          // Create a proper StoryListItem
          const storyItem: StoryListItem = {
            id: story.id,
            title: story.title,
            user_id: story.user_id || '',
            character_name: story.character_name,
            character_age: story.character_age,
            character_prompt: story.character_prompt,
            cover_image_url: story.cover_image_url,
            pages: story.pages as Json,
            content: Array.isArray(story.pages) 
              ? story.pages.map((page: any) => page.text || '') 
              : [],
            created_at: story.created_at || '',
            updated_at: story.updated_at || '',
            is_public: story.is_public || false,
            setting: story.setting,
            theme: story.theme,
            style: story.style,
            voice_type: (story.voice_type === 'male' || story.voice_type === 'female') 
              ? story.voice_type 
              : 'female'
          };
          return storyItem;
        });
        
        setStories(formattedStories);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
      toast.error("Couldn't load your stories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewStory = () => {
    navigate('/create-story');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="container max-w-4xl px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
              My Stories
            </h1>
            <Button onClick={handleCreateNewStory} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Story
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading your stories...</span>
            </div>
          ) : stories.length === 0 ? (
            <Card className="border-2 border-dashed border-violet-300">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  No Stories Yet
                </CardTitle>
                <CardDescription>
                  Start creating your magical stories now!
                </CardDescription>
              </CardHeader>
              <CardContent>
                Click the "Create New Story" button to begin your storytelling adventure.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <Card key={story.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold truncate">{story.title}</CardTitle>
                    <CardDescription>
                      Character: {story.character_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    Created: {new Date(story.created_at).toLocaleDateString()}
                  </CardContent>
                  {/* Add actions here, like view, edit, delete */}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyStories;
