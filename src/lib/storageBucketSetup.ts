
import { supabase } from "./supabase";
import { toast } from "sonner";

export const setupStorageBuckets = async () => {
  try {
    console.log("Checking if story_images bucket exists...");
    
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      
      // Check if the error is a permission issue
      if (error.message.includes('permission') || error.status === 403) {
        toast.error("Sem permissão para acessar o armazenamento. Verifique as políticas RLS no Supabase.", { 
          id: "bucket-permission-error",
          duration: 6000
        });
        return false;
      }
      
      toast.error("Erro ao verificar buckets de armazenamento", { id: "bucket-check-error" });
      return false;
    }
    
    // Find if story_images bucket exists
    const storyImagesBucket = buckets?.find(bucket => bucket.name === 'story_images');
    
    if (!storyImagesBucket) {
      console.log("story_images bucket doesn't exist in current user context");
      
      // Try to create bucket if it doesn't exist
      try {
        const { error: createError } = await supabase.storage.createBucket('story_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          console.error("Error creating story_images bucket:", createError);
          
          if (createError.message.includes('permission') || createError.message.includes('already exists')) {
            // Bucket likely exists but current user doesn't have access due to RLS
            toast.warning("O bucket de imagens existe no Supabase, mas você não tem permissões para acessá-lo", { 
              id: "bucket-access-warning",
              duration: 5000
            });
          } else {
            toast.error("Erro ao criar bucket de armazenamento", { id: "bucket-create-error" });
          }
        } else {
          console.log("Created story_images bucket");
          toast.success("Bucket de armazenamento criado com sucesso", { id: "bucket-create-success" });
          return true;
        }
      } catch (createErr) {
        console.error("Failed to create storage bucket:", createErr);
      }
      
      // Return true assuming bucket exists but user can't access due to RLS
      return true;
    } else {
      console.log("story_images bucket exists and is accessible by current user");
      
      // Ensure the bucket is public if we have access to update it
      try {
        const { error: updateError } = await supabase.storage.updateBucket('story_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (updateError) {
          console.error("Error updating story_images bucket to public:", updateError);
          toast.warning("Não foi possível atualizar as permissões do bucket", { duration: 3000 });
        } else {
          console.log("Ensured story_images bucket is public");
        }
      } catch (updateErr) {
        console.error("Failed to update bucket permissions:", updateErr);
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
    toast.error("Falha ao configurar armazenamento de imagens", { id: "storage-setup-error" });
    return false;
  }
};

// Helper function to check if an image URL can be accessed from the storage
export const verifyStorageAccess = async (): Promise<boolean> => {
  try {
    // First try to list objects to see if we have access
    const { data, error } = await supabase.storage
      .from('story_images')
      .list('', { limit: 1 });
      
    if (error) {
      console.warn("Storage access check failed:", error);
      
      // Try another method - get public URL for a test object
      try {
        const { data: publicUrlData } = supabase.storage
          .from('story_images')
          .getPublicUrl('access_test.txt');
          
        // Try to fetch the URL to check if it's publicly accessible
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
        if (response.ok || response.status === 404) {
          // 404 is also fine - it means the URL format works but file doesn't exist
          console.log("Storage is publicly accessible");
          return true;
        }
      } catch (fetchError) {
        console.error("Error checking public access:", fetchError);
      }
      
      return false;
    }
    
    console.log("Storage access check successful");
    return true;
  } catch (error) {
    console.error("Error verifying storage access:", error);
    return false;
  }
};

// Helper function to provide troubleshooting guidance
export const getStorageAccessHelp = (): string => {
  return `
Para corrigir as configurações de armazenamento no Supabase:

1. Acesse o painel do Supabase e vá para a seção Storage
2. Verifique se o bucket "story_images" existe
3. Certifique-se de que o bucket esteja configurado como "Public"
4. Configure as políticas RLS para permitir acesso público às imagens:
   - Adicione uma política para SELECT que permita acesso anônimo
   - Exemplo: CREATE POLICY "Allow public reading of story images" ON storage.objects FOR SELECT USING (bucket_id = 'story_images');
5. Reinicie a aplicação após fazer as alterações
`;
};
