
import { Story } from '@/types';

export const extractPageDetails = (story: Story) => {
  // Safely extract page details from JSON or array
  const pages = Array.isArray(story.pages) 
    ? story.pages 
    : (story.pages && typeof story.pages === 'object' 
      ? Object.values(story.pages as Record<string, any>) 
      : []);

  return pages.map(page => ({
    text: page.text || '',
    imageUrl: page.image_url || page.imageUrl || ''
  }));
};
