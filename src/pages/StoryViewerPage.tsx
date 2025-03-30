
import React from "react";
import { useParams } from "react-router-dom";
import StoryViewer from "../components/story-viewer/StoryViewer";

const StoryViewerPage = () => {
  const { id } = useParams<{ id?: string }>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <StoryViewer storyId={id} />
    </div>
  );
};

export default StoryViewerPage;
