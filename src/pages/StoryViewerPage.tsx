
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StoryViewer from '@/components/story-viewer/StoryViewer';
import { useStoryData } from '@/components/story-viewer/useStoryData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogIn, CreditCard, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const StoryViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use a more robust error handling approach for the story data
  const { 
    storyData, 
    loading, 
    handleImageError,
    error
  } = useStoryData(id, retryCount);
  
  // Handle retry logic for loading errors
  const handleRetryLoad = useCallback(() => {
    toast.info("Trying to load the story again...");
    setIsRefreshing(true);
    setRetryCount(prev => prev + 1);
    
    // Add a slight delay to allow the UI to update
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, []);
  
  // Force refresh page to fix issues with stuck loading
  const handleForceRefresh = useCallback(() => {
    toast.info("Reloading the page...");
    window.location.reload();
  }, []);
  
  // Redirect to home if there's an error loading the story after multiple retries
  useEffect(() => {
    if (error && retryCount > 3) {
      toast.error("Could not load the story", {
        description: "Please try again later or choose another story."
      });
      
      // Give user a chance to see the error before redirecting
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, navigate]);

  // If user is not authenticated, show login notice
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-violet-600" />
                </div>
                <h1 className="text-3xl font-bold">Login Required</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  To read stories, you need to be logged into your account.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Back to Home
                  </Button>
                  <Button variant="storyPrimary" onClick={() => navigate("/auth")}>
                    Log In
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // If user doesn't have an active subscription, show subscription notice
  if (!isLoadingSubscription && !hasActiveSubscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold">Subscription Required</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  To read stories, you need to have an active subscription.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Back to Home
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    onClick={() => navigate("/planos")}
                  >
                    View Subscription Plans
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {loading || isRefreshing ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 animate-pulse">Loading story...</p>
          </div>
        ) : storyData ? (
          <StoryViewer 
            storyId={id}
          />
        ) : (
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              {error ? "Error loading story" : "Story not found"}
            </h2>
            <p className="text-gray-600 mb-8">
              {error ? "An error occurred while loading this story." : "This story doesn't exist or has been removed."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Back to Home
              </Button>
              {error && retryCount < 4 && (
                <Button 
                  variant="default" 
                  onClick={handleRetryLoad}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={handleForceRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default StoryViewerPage;
