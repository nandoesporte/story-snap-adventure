import React from 'react';
import { Story } from '@/types';

const StoryViewer: React.FC<{ story: Story }> = ({ story }) => {
  // Convert JSON pages to an array if needed
  const pages = Array.isArray(story.pages) 
    ? story.pages 
    : (story.pages && typeof story.pages === 'object' 
      ? Object.values(story.pages as Record<string, any>) 
      : []);

  const voiceType: 'male' | 'female' = 
    story.voice_type === 'male' || story.voice_type === 'female' 
      ? story.voice_type 
      : 'female';

  return (
    <div className="story-viewer">
      <div className="story-header">
        <h1 className="story-title">{story.title}</h1>
        <div className="story-meta">
          <p className="character-name">Personagem: {story.character_name}</p>
          {story.character_age && (
            <p className="character-age">Idade: {story.character_age}</p>
          )}
          {story.theme && <p className="story-theme">Tema: {story.theme}</p>}
          {story.setting && <p className="story-setting">Cenário: {story.setting}</p>}
        </div>
      </div>

      <div className="story-cover">
        {story.cover_image_url && (
          <img 
            src={story.cover_image_url} 
            alt={`Capa da história ${story.title}`} 
            className="cover-image"
          />
        )}
      </div>

      <div className="story-pages">
        {pages.map((page, index) => (
          <div key={index} className="story-page">
            <div className="page-content">
              <p className="page-text">{page.text}</p>
            </div>
            {(page.image_url || page.imageUrl) && (
              <div className="page-image">
                <img 
                  src={page.image_url || page.imageUrl} 
                  alt={`Ilustração da página ${index + 1}`} 
                  className="illustration"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryViewer;
