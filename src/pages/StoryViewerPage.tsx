
import React from "react";
import { useParams } from "react-router-dom";
import StoryViewer from "../components/story-viewer/StoryViewer";

const StoryViewerPage = () => {
  const { id } = useParams<{ id?: string }>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pass id as a string or undefined */}
      <StoryViewer storyId={id || undefined} />
    </div>
  );
};

export default StoryViewerPage;
