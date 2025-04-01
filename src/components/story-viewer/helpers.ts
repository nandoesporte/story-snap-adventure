
// Helper functions for story viewer components

/**
 * Checks if a URL is from a permanent storage location
 */
export const isPermanentStorage = (url: string | undefined): boolean => {
  if (!url) return false;
  
  try {
    return url.includes('supabase.co/storage/v1/object/public') || 
           url.includes('/placeholder.svg') ||
           url.startsWith('/');
  } catch (e) {
    return false;
  }
};

/**
 * Checks if a URL is a temporary one that will expire
 */
export const isTemporaryUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  
  try {
    // Check for OpenAI or other AI service temporary URLs
    return (url.includes('oaiusercontent.com') || 
           url.includes('openai.com') ||
           url.includes('replicate.delivery') ||
           url.includes('temp-') ||
           url.includes('leonardo.ai') ||
           url.includes('pb.ai/api')) &&
           !url.includes('supabase.co/storage');
  } catch (e) {
    return false;
  }
};
