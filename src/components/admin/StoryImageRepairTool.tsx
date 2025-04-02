
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { saveImagePermanently } from "@/lib/imageStorage";
import { Hammer, ImageIcon, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { isTemporaryUrl, isPermanentStorage, testImageAccess } from "@/components/story-viewer/helpers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadToImgBB } from "@/lib/imgbbUploader";

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
            
            // Always try to migrate to ImgBB, even if accessible
            if (!isPermanentStorage(story.cover_image_url)) {
              const permanentUrl = await uploadToImgBB(story.cover_image_url, `cover_${story.id}`);
              
              if (permanentUrl && permanentUrl !== story.cover_image_url) {
                updatedStory.cover_image_url = permanentUrl;
                storyUpdated = true;
                storyFixedImages++;
                totalFixed++;
                console.log(`Cover image fixed: ${permanentUrl}`);
              } else {
                // Fallback to saveImagePermanently if uploadToImgBB fails
                const fallbackUrl = await saveImagePermanently(story.cover_image_url, `cover_${story.id}`);
                if (fallbackUrl && fallbackUrl !== story.cover_image_url) {
                  updatedStory.cover_image_url = fallbackUrl;
                  storyUpdated = true;
                  storyFixedImages++;
                  totalFixed++;
                  console.log(`Cover image fixed with fallback: ${fallbackUrl}`);
                } else {
                  storyFailedImages++;
                  totalFailed++;
                  console.log(`Failed to fix cover image for story ${story.id}`);
                }
              }
            } else {
              console.log(`Cover image for story ${story.id} is already in permanent storage: ${story.cover_image_url}`);
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
                
                // Always try to migrate to ImgBB, even if accessible
                if (!isPermanentStorage(imageUrl)) {
                  const permanentUrl = await uploadToImgBB(imageUrl, `${story.id}_page${pageIndex}`);
                  
                  if (permanentUrl && permanentUrl !== imageUrl) {
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
                    // Fallback to saveImagePermanently if uploadToImgBB fails
                    const fallbackUrl = await saveImagePermanently(imageUrl, `${story.id}_page${pageIndex}`);
                    if (fallbackUrl && fallbackUrl !== imageUrl) {
                      updatedPages[pageIndex] = {
                        ...page,
                        imageUrl: fallbackUrl,
                        image_url: fallbackUrl
                      };
                      storyUpdated = true;
                      storyFixedImages++;
                      totalFixed++;
                      console.log(`Page ${pageIndex + 1} image fixed with fallback: ${fallbackUrl}`);
                    } else {
                      storyFailedImages++;
                      totalFailed++;
                      console.log(`Failed to fix page ${pageIndex + 1} image`);
                    }
                  }
                } else {
                  console.log(`Page ${pageIndex + 1} image for story ${story.id} is already in permanent storage: ${imageUrl}`);
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
          Busca imagens temporárias da OpenAI em histórias e salva permanentemente
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
                  e as salva permanentemente nos servidores do ImgBB.
                </p>
                <p className="text-sm text-slate-600">
                  O processo verifica primeiro se a URL ainda está acessível, e caso esteja, garante que seja
                  armazenada no ImgBB para evitar indisponibilidade futura. Se a URL estiver inacessível, a ferramenta
                  tentará recuperar a imagem de caches ou usar uma imagem padrão.
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
