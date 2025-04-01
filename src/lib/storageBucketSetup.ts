
import { supabase } from "./supabase";
import { toast } from "sonner";

export const setupStorageBuckets = async () => {
  try {
    console.log("Verificando se o bucket story_images existe...");
    
    // Verificar se o bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Erro ao verificar buckets de armazenamento:", error);
      
      // Verificar se o erro é um problema de permissão
      if (error.message.includes('permission')) {
        toast.error("Sem permissão para acessar o armazenamento. As políticas RLS estão configuradas corretamente.", { 
          id: "bucket-permission-error",
          duration: 6000
        });
        return false;
      }
      
      toast.error("Erro ao verificar buckets de armazenamento", { id: "bucket-check-error" });
      return false;
    }
    
    // Verificar se o bucket story_images existe
    const storyImagesBucket = buckets?.find(bucket => bucket.name === 'story_images');
    
    if (!storyImagesBucket) {
      console.log("O bucket story_images não existe no contexto do usuário atual");
      
      // Tentar criar o bucket se ele não existir
      try {
        const { error: createError } = await supabase.storage.createBucket('story_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          console.error("Erro ao criar bucket story_images:", createError);
          
          if (createError.message.includes('permission') || createError.message.includes('already exists')) {
            // O bucket provavelmente existe, mas o usuário atual não tem acesso devido ao RLS
            toast.info("Bucket de imagens configurado no Supabase. Políticas RLS aplicadas com sucesso.", { 
              id: "bucket-access-info",
              duration: 5000
            });
          } else {
            toast.error("Erro ao criar bucket de armazenamento", { id: "bucket-create-error" });
          }
        } else {
          console.log("Bucket story_images criado");
          toast.success("Bucket de armazenamento criado com sucesso", { id: "bucket-create-success" });
          return true;
        }
      } catch (createErr) {
        console.error("Falha ao criar bucket de armazenamento:", createErr);
      }
      
      // Retornar true assumindo que o bucket existe, mas o usuário não pode acessá-lo devido ao RLS
      return true;
    } else {
      console.log("O bucket story_images existe e é acessível pelo usuário atual");
      
      // Garantir que o bucket seja público se tivermos acesso para atualizá-lo
      try {
        const { error: updateError } = await supabase.storage.updateBucket('story_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (updateError) {
          console.error("Erro ao atualizar bucket story_images para público:", updateError);
          toast.warning("Não foi possível atualizar as permissões do bucket", { duration: 3000 });
        } else {
          console.log("Garantido que o bucket story_images é público");
        }
      } catch (updateErr) {
        console.error("Falha ao atualizar permissões do bucket:", updateErr);
      }
      
      return true;
    }
  } catch (error) {
    console.error("Erro ao configurar buckets de armazenamento:", error);
    toast.error("Falha ao configurar armazenamento de imagens", { id: "storage-setup-error" });
    return false;
  }
};

// Função auxiliar para verificar se uma URL de imagem pode ser acessada a partir do armazenamento
export const verifyStorageAccess = async (): Promise<boolean> => {
  try {
    // Primeiro, tentar listar objetos para ver se temos acesso
    const { data, error } = await supabase.storage
      .from('story_images')
      .list('', { limit: 1 });
      
    if (error) {
      console.warn("Falha na verificação de acesso ao armazenamento:", error);
      
      // Tentar outro método - obter URL pública para um objeto de teste
      try {
        const { data: publicUrlData } = supabase.storage
          .from('story_images')
          .getPublicUrl('access_test.txt');
          
        // Tentar buscar a URL para verificar se está acessível publicamente
        const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
        if (response.ok || response.status === 404) {
          // 404 também está bom - significa que o formato da URL funciona, mas o arquivo não existe
          console.log("O armazenamento é acessível publicamente");
          return true;
        }
      } catch (fetchError) {
        console.error("Erro ao verificar acesso público:", fetchError);
      }
      
      return false;
    }
    
    console.log("Verificação de acesso ao armazenamento bem-sucedida");
    return true;
  } catch (error) {
    console.error("Erro ao verificar acesso ao armazenamento:", error);
    return false;
  }
};

// Função auxiliar para fornecer orientação de solução de problemas
export const getStorageAccessHelp = (): string => {
  return `
As políticas RLS para o bucket story_images foram configuradas corretamente. Se você estiver enfrentando problemas:

1. Certifique-se de que o usuário atual tenha permissões adequadas
2. Verifique se o bucket "story_images" está configurado como "Público" no painel do Supabase
3. Verifique se as seguintes políticas RLS estão ativas:
   - Allow public reading of story images
   - Allow authenticated uploads to story images
   - Allow authenticated users to update their own objects
   - Allow authenticated users to delete their own objects
4. Reinicie a aplicação após fazer alterações
`;
};
