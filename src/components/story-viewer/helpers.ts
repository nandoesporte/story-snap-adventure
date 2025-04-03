import { supabase } from "@/lib/supabase";
import { getDefaultImageForTheme, isDefaultImage } from "@/lib/defaultImages";
import { setupStorageBuckets, verifyStorageAccess } from "@/lib/storageBucketSetup";
import { toast } from "sonner";
import { saveImagePermanently } from "@/lib/imageStorage";

export const getImageUrl = (imageUrl: string, theme: string = 'default'): string => {
  if (!imageUrl) {
    return getDefaultImageForTheme(theme);
  }
  
  return imageUrl;
};

export const fixImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return getDefaultImageForTheme('default');
  }
  
  // Handle default images
  if (isDefaultImage(imageUrl)) {
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    return imageUrl;
  }
  
  // Handle local saved images (from public/story-images/)
  if (imageUrl.includes('/story-images/')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // Handle relative URLs (prepend origin)
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // Handle already fixed URLs
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
    // Check if it's a temporary OpenAI URL that might expire
    if (isTemporaryUrl(imageUrl)) {
      console.log("Detectada URL temporária da OpenAI, deve ser salva permanentemente:", imageUrl.substring(0, 50) + "...");
      // We'll save it later in a separate process - for now just return the URL
    }
    
    return imageUrl;
  }
  
  // Try to fix broken URLs
  try {
    // If it's a Supabase URL but missing the protocol
    if (imageUrl.includes('supabase.co') && !imageUrl.startsWith('http')) {
      return `https://${imageUrl}`;
    }
    
    // If it looks like a Supabase storage object ID, try to get public URL
    if (imageUrl.match(/^[0-9a-f-]{36}\.[a-z]{3,4}$/i)) {
      const { data } = supabase.storage
        .from('story_images')
        .getPublicUrl(imageUrl);
      return data.publicUrl;
    }
  } catch (error) {
    console.error("Error fixing image URL:", error);
    // Continue to return original URL
  }
  
  return imageUrl;
};

export const fixImageUrlAsync = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) {
    return getDefaultImageForTheme('default');
  }
  
  // Handle default images
  if (isDefaultImage(imageUrl)) {
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    return imageUrl;
  }
  
  // Handle local saved images (from public/story-images/)
  if (imageUrl.includes('/story-images/')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // Handle relative URLs (prepend origin)
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // Handle already fixed URLs
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
    // Check if it's a temporary OpenAI URL that might expire
    if (isTemporaryUrl(imageUrl)) {
      console.log("Detectada URL temporária da OpenAI, salvando permanentemente:", imageUrl.substring(0, 50) + "...");
      try {
        const permanentUrl = await saveImagePermanently(imageUrl);
        if (permanentUrl && permanentUrl !== imageUrl) {
          return permanentUrl;
        }
      } catch (error) {
        console.error("Erro ao salvar imagem temporária permanentemente:", error);
        // Continue com a URL original se salvar falhar
      }
    }
    
    return imageUrl;
  }
  
  return imageUrl;
};

export const isTemporaryUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Lista expandida de domínios/padrões que indicam URLs temporárias
  const temporaryDomains = [
    'oaidalleapiprodscus.blob.core.windows.net',
    'production-files.openai',
    'openai-api-files',
    'openai.com',
    'cdn.openai.com',
    'labs.openai.com',
    'api.openai.com'
  ];
  
  try {
    return temporaryDomains.some(domain => url.includes(domain));
  } catch (error) {
    console.error("Error checking temporary URL:", error);
    return false;
  }
};

export const isPermanentStorage = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a ImgBB storage URL
  const isImgbbStorage = url.includes('i.ibb.co') || url.includes('ibb.co');
  
  // Check if it's a Supabase storage URL
  const isSupabaseStorage = url.includes('supabase.co/storage/v1/object/public');
  
  // Check if it's a static file in our project
  const isStaticFile = 
    isDefaultImage(url) ||
    (url.includes(window.location.origin) && 
     (url.includes('/images/') || url.includes('/placeholder.svg')));
  
  return isImgbbStorage || isSupabaseStorage || isStaticFile;
};

export const preloadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = (e) => {
      console.error(`Failed to preload image: ${url}`, e);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
};

export const ensureImagesDirectory = async () => {
  try {
    const bucketSetupResult = await setupStorageBuckets();
    
    if (!bucketSetupResult) {
      console.error("Failed to ensure storage buckets exist");
      toast.error("Falha ao configurar armazenamento para imagens", { 
        id: "storage-setup-error",
        duration: 5000
      });
    } else {
      console.log("Successfully ensured storage buckets exist");
      
      // Verify actual access to storage
      const hasAccess = await verifyStorageAccess();
      if (!hasAccess) {
        console.warn("Storage bucket exists but current user has no access");
        toast.warning("Você não tem permissões para acessar o armazenamento de imagens", {
          id: "storage-access-warning",
          duration: 5000
        });
      }
    }
    
    return bucketSetupResult;
  } catch (error) {
    console.error("Error ensuring images directory:", error);
    return false;
  }
};

export const testImageAccess = async (url: string): Promise<boolean> => {
  if (!url || url.startsWith('data:') || isDefaultImage(url) || url.includes('/story-images/')) {
    return true;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error(`Image access test failed for ${url}:`, error);
    return false;
  }
};

export const ensureStoryImagesAreSaved = async (story: any) => {
  if (!story) return story;
  
  try {
    // Processar a imagem de capa
    if (story.coverImageUrl || story.cover_image_url) {
      const coverUrl = story.coverImageUrl || story.cover_image_url;
      if (coverUrl && isTemporaryUrl(coverUrl)) {
        console.log("Salvando imagem de capa permanentemente:", coverUrl.substring(0, 50) + "...");
        const permanentUrl = await saveImagePermanently(coverUrl, `cover_${story.id || 'temp'}`);
        if (permanentUrl) {
          story.coverImageUrl = permanentUrl;
          story.cover_image_url = permanentUrl;
        }
      }
    }
    
    // Processar imagens das páginas
    if (Array.isArray(story.pages)) {
      for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        if (typeof page === 'object' && page !== null) {
          const imageUrl = page.imageUrl || page.image_url;
          
          if (imageUrl && isTemporaryUrl(imageUrl)) {
            console.log(`Salvando imagem da página ${i+1} permanentemente:`, imageUrl.substring(0, 50) + "...");
            const permanentUrl = await saveImagePermanently(imageUrl, `page_${i+1}_${story.id || 'temp'}`);
            if (permanentUrl) {
              page.imageUrl = permanentUrl;
              page.image_url = permanentUrl;
            }
          }
        }
      }
    }
    
    return story;
  } catch (error) {
    console.error("Erro ao salvar imagens da história permanentemente:", error);
    return story;
  }
};

export const checkAndRepairStoryImages = async (story: any): Promise<{
  fixed: boolean;
  fixedImages: number;
}> => {
  if (!story) return { fixed: false, fixedImages: 0 };
  
  let fixedCount = 0;
  let storyUpdated = false;
  
  try {
    // Verificar e corrigir a imagem de capa
    if (story.coverImageUrl || story.cover_image_url) {
      const coverUrl = story.coverImageUrl || story.cover_image_url;
      
      if (coverUrl && (isTemporaryUrl(coverUrl) || !(await testImageAccess(coverUrl)))) {
        console.log(`Reparando imagem de capa quebrada: ${coverUrl.substring(0, 50)}...`);
        const newCoverUrl = await saveImagePermanently(coverUrl, `cover_repair_${story.id || 'temp'}`);
        
        if (newCoverUrl && newCoverUrl !== coverUrl) {
          story.coverImageUrl = newCoverUrl;
          story.cover_image_url = newCoverUrl;
          storyUpdated = true;
          fixedCount++;
        }
      }
    }
    
    // Verificar e corrigir as imagens das páginas
    if (Array.isArray(story.pages)) {
      for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        
        if (typeof page === 'object' && page !== null) {
          const imageUrl = page.imageUrl || page.image_url;
          
          if (imageUrl && (isTemporaryUrl(imageUrl) || !(await testImageAccess(imageUrl)))) {
            console.log(`Reparando imagem quebrada da página ${i+1}: ${imageUrl.substring(0, 50)}...`);
            const newImageUrl = await saveImagePermanently(imageUrl, `page_repair_${i+1}_${story.id || 'temp'}`);
            
            if (newImageUrl && newImageUrl !== imageUrl) {
              page.imageUrl = newImageUrl;
              page.image_url = newImageUrl;
              storyUpdated = true;
              fixedCount++;
            }
          }
        }
      }
    }
    
    return { fixed: storyUpdated, fixedImages: fixedCount };
  } catch (error) {
    console.error("Erro ao verificar e reparar imagens da história:", error);
    return { fixed: storyUpdated, fixedImages: fixedCount };
  }
};
