
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { Hammer, ImageIcon, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { isTemporaryUrl, isPermanentStorage, testImageAccess } from "@/components/story-viewer/helpers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StoryImageRepairTool = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [storiesScanned, setStoriesScanned] = useState(0);
  const [totalStories, setTotalStories] = useState(0);
  const [imagesFixed, setImagesFixed] = useState(0);
  const [failedImages, setFailedImages] = useState(0);
  const [totalImagesProcessed, setTotalImagesProcessed] = useState(0);
  const [activeTab, setActiveTab] = useState("repair");
  const [results, setResults] = useState<{
    storyId: string;
    title: string;
    fixedImages: number;
    failedImages: number;
  }[]>([]);

  // Function to fetch an image as blob
  const fetchImageAsBlob = async (url: string): Promise<Blob | null> => {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.blob();
    } catch (error) {
      console.error(`Error fetching image from ${url}:`, error);
      return null;
    }
  };

  // Function to save image to Supabase Storage
  const saveImageToSupabase = async (imageData: Blob | string, fileName: string): Promise<string | null> => {
    try {
      console.log(`Attempting to save image to Supabase storage: ${fileName}`);
      
      // Ensure the story_images bucket exists
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some(bucket => bucket.name === 'story_images')) {
          const { data, error } = await supabase.storage.createBucket('story_images', { 
            public: true,
            fileSizeLimit: 5242880 // 5MB limit
          });
          
          if (error) {
            console.error("Error creating bucket:", error);
            return null;
          }
        }
      } catch (bucketError) {
        console.error("Error checking/creating bucket:", bucketError);
      }

      // Convert string URL to blob if needed
      let imageBlob: Blob;
      if (typeof imageData === 'string') {
        const blob = await fetchImageAsBlob(imageData);
        if (!blob) {
          console.error("Could not fetch image as blob");
          return null;
        }
        imageBlob = blob;
      } else {
        imageBlob = imageData;
      }

      // Determine content type
      const contentType = imageBlob.type || 'image/png';
      
      // Upload the blob to Supabase
      const { data, error } = await supabase
        .storage
        .from('story_images')
        .upload(`repaired/${fileName}`, imageBlob, {
          contentType,
          upsert: true
        });

      if (error) {
        console.error("Error uploading to Supabase:", error);
        return null;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('story_images')
        .getPublicUrl(`repaired/${fileName}`);

      console.log("Image saved to Supabase:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error saving image to Supabase:", error);
      return null;
    }
  };

  const runImageRepair = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      setStoriesScanned(0);
      setTotalStories(0);
      setImagesFixed(0);
      setFailedImages(0);
      setTotalImagesProcessed(0);
      setResults([]);

      toast.info("Iniciando reparo de imagens...");

      // Step 1: Get all stories
      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, title, pages, cover_image_url")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setTotalStories(stories.length);
      toast.info(`${stories.length} histórias encontradas para análise.`);

      // Step 2: Process each story to fix images
      let totalFixed = 0;
      let totalFailed = 0;
      let totalProcessed = 0;

      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        setStoriesScanned(i + 1);
        setScanProgress(Math.round(((i + 1) / stories.length) * 100));

        let storyFixedImages = 0;
        let storyFailedImages = 0;
        let updatedStory = { ...story };
        let storyUpdated = false;

        // Check cover image
        if (story.cover_image_url) {
          totalProcessed++;
          try {
            console.log(`Processando imagem de capa para história ${story.id}: ${story.cover_image_url}`);
            
            // Always try to migrate image, even if accessible
            const isAccessible = await testImageAccess(story.cover_image_url);
            console.log(`Cover image accessible: ${isAccessible}`);
            
            // Generate a unique filename for the image
            const fileName = `cover_${story.id}_${Date.now()}.png`;
            
            // Get the image as blob and save to Supabase
            const blob = await fetchImageAsBlob(story.cover_image_url);
            if (blob) {
              const permanentUrl = await saveImageToSupabase(blob, fileName);
              
              if (permanentUrl) {
                updatedStory.cover_image_url = permanentUrl;
                storyUpdated = true;
                storyFixedImages++;
                totalFixed++;
                console.log(`Cover image fixed: ${permanentUrl}`);
              } else {
                storyFailedImages++;
                totalFailed++;
                console.log(`Failed to fix cover image for story ${story.id}`);
              }
            } else {
              storyFailedImages++;
              totalFailed++;
              console.log(`Failed to fetch cover image for story ${story.id}`);
            }
          } catch (error) {
            console.error(`Error fixing cover image for story ${story.id}:`, error);
            storyFailedImages++;
            totalFailed++;
          }
        }

        // Check page images
        if (Array.isArray(story.pages)) {
          const updatedPages = [...story.pages];
          
          for (let pageIndex = 0; pageIndex < updatedPages.length; pageIndex++) {
            const page = updatedPages[pageIndex];
            const imageUrl = page.imageUrl || page.image_url;
            
            if (imageUrl) {
              totalProcessed++;
              try {
                console.log(`Processando imagem da página ${pageIndex + 1} para história ${story.id}: ${imageUrl}`);
                
                // Always try to migrate image, even if accessible
                const isAccessible = await testImageAccess(imageUrl);
                console.log(`Page ${pageIndex + 1} image accessible: ${isAccessible}`);
                
                // Generate a unique filename for the image
                const fileName = `${story.id}_page${pageIndex}_${Date.now()}.png`;
                
                // Get the image as blob and save to Supabase
                const blob = await fetchImageAsBlob(imageUrl);
                if (blob) {
                  const permanentUrl = await saveImageToSupabase(blob, fileName);
                  
                  if (permanentUrl) {
                    updatedPages[pageIndex] = {
                      ...page,
                      imageUrl: permanentUrl,
                      image_url: permanentUrl
                    };
                    storyUpdated = true;
                    storyFixedImages++;
                    totalFixed++;
                    console.log(`Page ${pageIndex + 1} image fixed: ${permanentUrl}`);
                  } else {
                    storyFailedImages++;
                    totalFailed++;
                    console.log(`Failed to fix page ${pageIndex + 1} image`);
                  }
                } else {
                  storyFailedImages++;
                  totalFailed++;
                  console.log(`Failed to fetch page ${pageIndex + 1} image`);
                }
              } catch (error) {
                console.error(`Error fixing image for page ${pageIndex + 1} of story ${story.id}:`, error);
                storyFailedImages++;
                totalFailed++;
              }
            }
          }
          
          if (storyUpdated) {
            updatedStory.pages = updatedPages;
          }
        }

        // Update the story if any images were fixed
        if (storyUpdated) {
          const { error: updateError } = await supabase
            .from("stories")
            .update({
              cover_image_url: updatedStory.cover_image_url,
              pages: updatedStory.pages
            })
            .eq("id", story.id);

          if (updateError) {
            console.error(`Error updating story ${story.id}:`, updateError);
            toast.error(`Erro ao atualizar história ${story.title}`);
            storyFailedImages += storyFixedImages;
            totalFailed += storyFixedImages;
            totalFixed -= storyFixedImages;
            storyFixedImages = 0;
          } else {
            console.log(`Story ${story.id} updated successfully with fixed images`);
          }
        }

        // Add to results
        if (storyFixedImages > 0 || storyFailedImages > 0) {
          setResults(prev => [...prev, {
            storyId: story.id,
            title: story.title,
            fixedImages: storyFixedImages,
            failedImages: storyFailedImages
          }]);
        }

        // Update counts
        setImagesFixed(totalFixed);
        setFailedImages(totalFailed);
        setTotalImagesProcessed(totalProcessed);
        
        // Brief pause to prevent rate limiting
        if (i < stories.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      toast.success(`Reparo de imagens concluído! ${totalFixed} imagens salvas permanentemente.`);
    } catch (error) {
      console.error("Erro durante o reparo de imagens:", error);
      toast.error("Erro durante o reparo de imagens");
    } finally {
      setIsScanning(false);
    }
  };

  // Function to verify image URLs only, without migrating
  const verifyImageUrls = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      setStoriesScanned(0);
      setTotalStories(0);
      setImagesFixed(0);
      setFailedImages(0);
      setTotalImagesProcessed(0);
      setResults([]);

      toast.info("Iniciando verificação de URLs de imagens...");

      // Step 1: Get all stories
      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, title, pages, cover_image_url")
        .order("created_at", { ascending: false })
        .limit(50); // Limitar a 50 histórias mais recentes para verificação rápida

      if (error) {
        throw error;
      }

      setTotalStories(stories.length);
      toast.info(`${stories.length} histórias encontradas para verificação de URLs.`);

      let accessibleImages = 0;
      let inaccessibleImages = 0;
      let totalImages = 0;

      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        setStoriesScanned(i + 1);
        setScanProgress(Math.round(((i + 1) / stories.length) * 100));

        let storyAccessible = 0;
        let storyInaccessible = 0;

        // Check cover image
        if (story.cover_image_url) {
          totalImages++;
          try {
            const isAccessible = await testImageAccess(story.cover_image_url);
            if (isAccessible) {
              accessibleImages++;
              storyAccessible++;
            } else {
              inaccessibleImages++;
              storyInaccessible++;
            }
          } catch (error) {
            console.error(`Erro ao verificar imagem de capa para história ${story.id}:`, error);
            inaccessibleImages++;
            storyInaccessible++;
          }
        }

        // Check page images
        if (Array.isArray(story.pages)) {
          for (let pageIndex = 0; pageIndex < story.pages.length; pageIndex++) {
            const page = story.pages[pageIndex];
            const imageUrl = page.imageUrl || page.image_url;
            
            if (imageUrl) {
              totalImages++;
              try {
                const isAccessible = await testImageAccess(imageUrl);
                if (isAccessible) {
                  accessibleImages++;
                  storyAccessible++;
                } else {
                  inaccessibleImages++;
                  storyInaccessible++;
                }
              } catch (error) {
                console.error(`Erro ao verificar imagem para página ${pageIndex + 1} da história ${story.id}:`, error);
                inaccessibleImages++;
                storyInaccessible++;
              }
            }
          }
        }

        // Add to results
        if (storyAccessible > 0 || storyInaccessible > 0) {
          setResults(prev => [...prev, {
            storyId: story.id,
            title: story.title,
            fixedImages: storyAccessible, // Repurposing fixedImages for accessible images
            failedImages: storyInaccessible // Repurposing failedImages for inaccessible images
          }]);
        }

        // Update counts
        setImagesFixed(accessibleImages);
        setFailedImages(inaccessibleImages);
        setTotalImagesProcessed(totalImages);
        
        // Brief pause to prevent rate limiting
        if (i < stories.length - 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      toast.success(`Verificação concluída! ${accessibleImages} imagens acessíveis, ${inaccessibleImages} inacessíveis.`);
    } catch (error) {
      console.error("Erro durante a verificação de URLs de imagens:", error);
      toast.error("Erro durante a verificação de URLs");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer className="h-5 w-5" />
          Reparo de Imagens
        </CardTitle>
        <CardDescription>
          Busca imagens temporárias da OpenAI em histórias e salva permanentemente no Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="repair">Reparo Completo</TabsTrigger>
            <TabsTrigger value="verify">Verificar URLs</TabsTrigger>
          </TabsList>
          <TabsContent value="repair">
            {isScanning ? (
              <div className="space-y-4">
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Progresso ({storiesScanned} de {totalStories} histórias)</p>
                  <p className="text-sm font-medium">{scanProgress}%</p>
                </div>
                <Progress value={scanProgress} />
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Histórias escaneadas:</span>
                    <span>{storiesScanned}/{totalStories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Imagens processadas:</span>
                    <span>{totalImagesProcessed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Imagens corrigidas:
                    </span>
                    <span>{imagesFixed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Falhas:
                    </span>
                    <span>{failedImages}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Esta ferramenta escaneia todas as histórias procurando por imagens temporárias ou inacessíveis
                  e as salva permanentemente no armazenamento do Supabase.
                </p>
                <p className="text-sm text-slate-600">
                  O processo verifica primeiro se a URL ainda está acessível, e então salva a imagem no bucket de 
                  armazenamento do Supabase. Mesmo imagens já acessíveis são migradas para garantir disponibilidade futura.
                </p>
                
                {results.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Resultados:</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                      {results.map((result) => (
                        <div key={result.storyId} className="border-b pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium truncate max-w-[200px]">{result.title}</span>
                            <div className="flex gap-2">
                              {result.fixedImages > 0 && (
                                <Badge variant="success" className="bg-green-500">
                                  {result.fixedImages} corrigidas
                                </Badge>
                              )}
                              {result.failedImages > 0 && (
                                <Badge variant="destructive">
                                  {result.failedImages} falhas
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="verify">
            {isScanning ? (
              <div className="space-y-4">
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Progresso ({storiesScanned} de {totalStories} histórias)</p>
                  <p className="text-sm font-medium">{scanProgress}%</p>
                </div>
                <Progress value={scanProgress} />
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Histórias verificadas:</span>
                    <span>{storiesScanned}/{totalStories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Imagens verificadas:</span>
                    <span>{totalImagesProcessed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Acessíveis:
                    </span>
                    <span>{imagesFixed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Inacessíveis:
                    </span>
                    <span>{failedImages}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Esta verificação analisa se as URLs de imagens das histórias ainda estão acessíveis, sem fazer
                  alterações automáticas.
                </p>
                <p className="text-sm text-slate-600">
                  Use esta ferramenta para diagnosticar problemas com imagens antes de executar o reparo completo.
                  A verificação é mais rápida e mostra um relatório de quais imagens estão acessíveis e quais precisam
                  ser migradas.
                </p>
                
                {results.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Resultados:</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                      {results.map((result) => (
                        <div key={result.storyId} className="border-b pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium truncate max-w-[200px]">{result.title}</span>
                            <div className="flex gap-2">
                              {result.fixedImages > 0 && (
                                <Badge variant="success" className="bg-green-500">
                                  {result.fixedImages} acessíveis
                                </Badge>
                              )}
                              {result.failedImages > 0 && (
                                <Badge variant="destructive">
                                  {result.failedImages} inacessíveis
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {activeTab === 'repair' ? (
          <Button 
            onClick={runImageRepair} 
            disabled={isScanning}
            variant="default"
            className="flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Iniciar Reparo de Imagens
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={verifyImageUrls} 
            disabled={isScanning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Verificar URLs de Imagens
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StoryImageRepairTool;
