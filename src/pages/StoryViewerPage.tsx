
import React from "react";
import { useParams } from "react-router-dom";
import StoryViewer from "@/components/story-viewer/StoryViewer";

const StoryViewerPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col">
        <StoryViewer storyId={id} />
      </main>
    </div>
  );
};

export default StoryViewerPage;
