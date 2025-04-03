import { getDefaultImageForTheme } from './defaultImages';
import { toast } from 'sonner';
import { uploadToImgBB } from './imgbbUploader';

/**
 * Saves an image permanently by:
 * 1. First trying to save to local filesystem in public/story-images/
 * 2. Falling back to ImgBB if local storage fails
 * @param imageData URL, Base64 or Blob of the image
 * @param filename Optional custom filename
 * @returns Promise with the permanent URL
 */
export const saveImagePermanently = async (imageData: string | Blob, filename?: string): Promise<string> => {
  if (!imageData) {
    console.error("No image data provided to saveImagePermanently");
    return getDefaultImageForTheme('default');
  }

  try {
    // Check if it's already a local image
    if (typeof imageData === 'string' && imageData.includes('/story-images/')) {
      console.log("Image is already saved locally:", imageData);
      return imageData;
    }

    // First try to save locally
    const localUrl = await saveImageLocally(imageData, filename);
    if (localUrl) {
      console.log("Image saved locally:", localUrl);
      return localUrl;
    }
    
    // If local saving fails, try ImgBB
    console.log("Local save failed, trying ImgBB...");
    
    // Verificar se é um Blob ou string
    if (typeof imageData === 'string') {
      // Verificar se a URL já está no ImgBB
      if (imageData.includes('i.ibb.co') || imageData.includes('image.ibb.co')) {
        console.log("Image is already in ImgBB storage:", imageData);
        return imageData;
      }

      // Verificar se é uma URL local/relativa
      if (imageData.startsWith('/') && !imageData.includes('://')) {
        const fullUrl = `${window.location.origin}${imageData}`;
        console.log("Converting relative URL to absolute for ImgBB upload:", fullUrl);
        imageData = fullUrl;
      }
    }

    console.log("Saving image to ImgBB:", 
      typeof imageData === 'string' 
        ? imageData.substring(0, 50) + "..." 
        : `Blob (${imageData.size} bytes, type: ${imageData.type})`
    );
    
    // Tentar até 3 vezes em caso de falha
    let attempts = 0;
    let imgbbUrl = null;
    
    while (attempts < 3 && !imgbbUrl) {
      if (attempts > 0) {
        console.log(`Tentativa ${attempts + 1} de upload para ImgBB`);
        // Pequena pausa entre tentativas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      imgbbUrl = await uploadToImgBB(imageData, filename);
      attempts++;
    }
    
    if (imgbbUrl) {
      console.log("Image successfully uploaded to ImgBB:", imgbbUrl);
      // Save in local cache for future use
      try {
        const cacheKey = `imgbb_cache_${typeof imageData === 'string' ? imageData.slice(-40) : filename || Date.now()}`;
        localStorage.setItem(cacheKey, imgbbUrl);
      } catch (e) {
        console.warn("Couldn't save to localStorage:", e);
      }

      return imgbbUrl;
    }
    
    console.error("Failed to upload image to ImgBB after multiple attempts");
    toast.error("Não foi possível salvar a imagem no ImgBB");
    
    // Check if we have a cached version
    if (typeof imageData === 'string') {
      try {
        const cacheKey = `imgbb_cache_${imageData.slice(-40)}`;
        const cachedUrl = localStorage.getItem(cacheKey);
        if (cachedUrl) {
          console.log("Using cached ImgBB URL:", cachedUrl);
          return cachedUrl;
        }
      } catch (e) {
        console.warn("Couldn't access localStorage:", e);
      }
    }
    
    return getDefaultImageForTheme('default');
    
  } catch (error) {
    console.error("Error in saveImagePermanently:", error);
    toast.error("Erro ao salvar imagem permanentemente");
    return getDefaultImageForTheme('default');
  }
};

/**
 * Save an image to public/story-images/ folder
 * @param imageData Image data (URL, Base64 or Blob)
 * @param filename Optional custom filename
 * @returns Local URL of the saved image or null if failed
 */
export const saveImageLocally = async (imageData: string | Blob, filename?: string): Promise<string | null> => {
  try {
    // Generate a unique filename if not provided
    const uniqueFilename = filename || `story_image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Convert image to base64 if it's not already
    let base64Data = '';
    
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image')) {
        // Already base64
        base64Data = imageData;
      } else if (imageData.startsWith('http')) {
        // Fetch image and convert to base64
        try {
          const response = await fetch(imageData);
          const blob = await response.blob();
          base64Data = await blobToBase64(blob);
        } catch (error) {
          console.error("Failed to fetch image from URL:", error);
          return null;
        }
      } else {
        console.error("Unsupported image data format");
        return null;
      }
    } else {
      // Convert blob to base64
      base64Data = await blobToBase64(imageData);
    }
    
    // Save base64 image to localStorage for now since we can't directly write to filesystem in browser
    try {
      // Create a virtual path for the image
      const imageFilename = uniqueFilename.endsWith('.png') ? uniqueFilename : `${uniqueFilename}.png`;
      const virtualPath = `/story-images/${imageFilename}`;
      
      // Store the base64 data in localStorage mapped to the virtual path
      const imageStorage = JSON.parse(localStorage.getItem('local_story_images') || '{}');
      imageStorage[virtualPath] = base64Data;
      localStorage.setItem('local_story_images', JSON.stringify(imageStorage));
      
      // Also store the raw base64 data in indexedDB for better storage
      try {
        await storeImageInIndexedDB(virtualPath, base64Data);
      } catch (dbError) {
        console.warn("Failed to store in IndexedDB, using localStorage only:", dbError);
      }
      
      console.log("Image saved locally with virtual path:", virtualPath);
      
      // Check if we need to initialize our virtual file server
      if (!window.localImageInitialized) {
        initializeLocalImageServer();
      }
      
      return virtualPath;
    } catch (storageError) {
      console.error("Failed to save image locally:", storageError);
      return null;
    }
  } catch (error) {
    console.error("Error saving image locally:", error);
    return null;
  }
};

/**
 * Initialize a service worker-like handler to serve local images from localStorage/IndexedDB
 */
export const initializeLocalImageServer = () => {
  if (window.localImageInitialized) return;
  
  // Create a blob URL for each image and set it as src
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          const img = mutation.target as HTMLImageElement;
          const src = img.getAttribute('src');
          if (src && src.startsWith('/story-images/')) {
            processLocalImage(img, src);
          }
        }
        
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as HTMLElement;
              const images = element.querySelectorAll('img[src^="/story-images/"]');
              images.forEach((img) => {
                processLocalImage(img as HTMLImageElement, img.getAttribute('src') as string);
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['src'] 
    });
    
    // Also process any images that are already in the DOM
    document.querySelectorAll('img[src^="/story-images/"]').forEach((img) => {
      processLocalImage(img as HTMLImageElement, img.getAttribute('src') as string);
    });
  });
  
  window.localImageInitialized = true;
  console.log("Local image server initialized");
};

/**
 * Process a local image by loading it from localStorage/IndexedDB
 */
const processLocalImage = async (img: HTMLImageElement, src: string) => {
  try {
    // Try to load from IndexedDB first (more storage space)
    let base64Data = await getImageFromIndexedDB(src);
    
    // Fall back to localStorage if not in IndexedDB
    if (!base64Data) {
      const imageStorage = JSON.parse(localStorage.getItem('local_story_images') || '{}');
      base64Data = imageStorage[src];
    }
    
    if (base64Data) {
      // Create a blob URL and set it as the src
      const blob = await fetch(base64Data).then(res => res.blob());
      const blobUrl = URL.createObjectURL(blob);
      img.setAttribute('src', blobUrl);
      
      // Clean up the blob URL when the image is loaded
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
      };
    }
  } catch (error) {
    console.error(`Error processing local image ${src}:`, error);
  }
};

/**
 * Store an image in IndexedDB for better storage capacity
 */
const storeImageInIndexedDB = async (path: string, base64Data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StoryImagesDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'path' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const entry = { path, data: base64Data };
      const storeRequest = store.put(entry);
      
      storeRequest.onsuccess = () => resolve();
      storeRequest.onerror = (e) => reject(e);
    };
    
    request.onerror = (event) => reject(event);
  });
};

/**
 * Get an image from IndexedDB
 */
const getImageFromIndexedDB = async (path: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StoryImagesDB', 1);
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Check if the store exists
      if (!db.objectStoreNames.contains('images')) {
        resolve(null);
        return;
      }
      
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const getRequest = store.get(path);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result.data);
        } else {
          resolve(null);
        }
      };
      
      getRequest.onerror = () => resolve(null);
    };
    
    request.onerror = () => resolve(null);
  });
};

/**
 * Convert a Blob to base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Process all images in a story and save them permanently
 * @param storyData Story data object
 * @returns Updated story data with permanent image URLs
 */
export const saveStoryImagesPermanently = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    const updatedStory = { ...storyData };
    
    // Process cover image
    if (updatedStory.coverImageUrl || updatedStory.cover_image_url) {
      const coverUrl = updatedStory.coverImageUrl || updatedStory.cover_image_url;
      console.log("Saving cover image permanently:", coverUrl?.substring(0, 50) + "...");
      
      const permanentCoverUrl = await saveImagePermanently(coverUrl, `cover_${storyData.id || 'new'}`);
      updatedStory.coverImageUrl = permanentCoverUrl;
      updatedStory.cover_image_url = permanentCoverUrl;
    }
    
    // Process page images
    if (Array.isArray(updatedStory.pages)) {
      console.log(`Processing ${updatedStory.pages.length} story pages for permanent storage`);
      
      const processedPages = [];
      for (let i = 0; i < updatedStory.pages.length; i++) {
        const page = { ...updatedStory.pages[i] };
        if (page.imageUrl || page.image_url) {
          const imageUrl = page.imageUrl || page.image_url;
          console.log(`Processing page ${i+1} image: ${imageUrl?.substring(0, 30)}...`);
          
          try {
            const permanentUrl = await saveImagePermanently(
              imageUrl, 
              `page_${i+1}_${storyData.id || 'new'}`
            );
            
            page.imageUrl = permanentUrl;
            page.image_url = permanentUrl;
          } catch (pageError) {
            console.error(`Error saving page ${i+1} image:`, pageError);
            // Manter a URL original em caso de erro
          }
        }
        processedPages.push(page);
      }
      
      updatedStory.pages = processedPages;
    }
    
    // Also save a copy offline of the story in full
    try {
      const offlineStoryCache = localStorage.getItem('offline_stories') || '[]';
      const offlineStories = JSON.parse(offlineStoryCache);
      
      // Remove any version of the same story already saved
      const filteredStories = offlineStories.filter((s: any) => 
        s.id !== updatedStory.id && 
        s.title !== updatedStory.title
      );
      
      // Add the updated story
      filteredStories.push({
        ...updatedStory,
        saved_offline_at: new Date().toISOString()
      });
      
      // Limit to 20 stories saved offline
      const trimmedStories = filteredStories.slice(-20);
      
      // Save in localStorage
      localStorage.setItem('offline_stories', JSON.stringify(trimmedStories));
      console.log("Story saved for offline access");
    } catch (offlineError) {
      console.warn("Failed to save story for offline access:", offlineError);
    }
    
    return updatedStory;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    toast.error("Erro ao processar imagens da história");
    return storyData;
  }
};

/**
 * Extrair uma imagem de uma URL e salvar como Base64
 */
export const urlToBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null;
  
  if (url.startsWith('data:')) return url;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to Base64:", error);
    return null;
  }
};

/**
 * Salvar uma imagem da história no sistema de arquivo (como Base64 em localStorage)
 */
export const saveImageToLocalStorage = async (imageUrl: string, key: string): Promise<string | null> => {
  if (!imageUrl) return null;
  
  try {
    const base64Data = await urlToBase64(imageUrl);
    if (!base64Data) return null;
    
    const storedImages = JSON.parse(localStorage.getItem('story_images_cache') || '{}');
    storedImages[key] = base64Data;
    localStorage.setItem('story_images_cache', JSON.stringify(storedImages));
    
    return base64Data;
  } catch (error) {
    console.error("Error saving image to localStorage:", error);
    return null;
  }
};

/**
 * Busca e salva permanentemente as imagens das últimas histórias
 */
export const migrateRecentStoryImages = async (limit: number = 10): Promise<void> => {
  try {
    console.log(`Iniciando migração das imagens das ${limit} histórias mais recentes...`);
    
    // Buscar histórias do localStorage para processamento offline
    const processLocalStories = async () => {
      try {
        const keys = Object.keys(localStorage);
        const storyKeys = keys.filter(key => key.includes('storyData'));
        
        console.log(`Encontradas ${storyKeys.length} histórias no localStorage`);
        
        for (const key of storyKeys) {
          try {
            const storyJson = localStorage.getItem(key);
            if (storyJson) {
              const storyData = JSON.parse(storyJson);
              console.log(`Processando história do localStorage: ${storyData.title}`);
              
              const updatedStory = await saveStoryImagesPermanently(storyData);
              
              // Salvar história atualizada de volta no localStorage
              localStorage.setItem(key, JSON.stringify(updatedStory));
              console.log(`História ${storyData.title} atualizada com sucesso no localStorage`);
            }
          } catch (storyError) {
            console.error(`Erro ao processar história do localStorage:`, storyError);
          }
        }
      } catch (error) {
        console.error("Erro ao processar histórias do localStorage:", error);
      }
    };
    
    // Processar histórias do sessionStorage
    const processSessionStories = async () => {
      try {
        const storyData = sessionStorage.getItem("storyData");
        if (storyData) {
          console.log("Processando história da sessão atual");
          const parsedData = JSON.parse(storyData);
          const updatedStory = await saveStoryImagesPermanently(parsedData);
          
          // Salvar história atualizada de volta na sessionStorage
          sessionStorage.setItem("storyData", JSON.stringify(updatedStory));
          console.log("História da sessão atual atualizada com sucesso");
        }
      } catch (error) {
        console.error("Erro ao processar história da sessão:", error);
      }
    };
    
    // Executar o processamento
    await Promise.all([processLocalStories(), processSessionStories()]);
    
    toast.success("Migração de imagens concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a migração de imagens:", error);
    toast.error("Erro durante a migração de imagens");
  }
};

/**
 * Recuperar imagens salvas localmente
 */
export const getOfflineStories = (): any[] => {
  try {
    const offlineStoriesJson = localStorage.getItem('offline_stories');
    if (!offlineStoriesJson) return [];
    
    return JSON.parse(offlineStoriesJson);
  } catch (error) {
    console.error("Erro ao recuperar histórias offline:", error);
    return [];
  }
};

/**
 * Verificar se a história está disponível offline
 */
export const isStoryAvailableOffline = (storyId: string): boolean => {
  try {
    const offlineStories = getOfflineStories();
    return offlineStories.some(story => story.id === storyId);
  } catch (error) {
    console.error("Erro ao verificar disponibilidade offline da história:", error);
    return false;
  }
};
