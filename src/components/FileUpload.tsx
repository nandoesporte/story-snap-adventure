
import { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  imagePreview?: string | null;
  uploadType?: "image" | "file";
}

const FileUpload = ({ onFileSelect, onUploadComplete, imagePreview, uploadType = "image" }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Possible bucket names to try (in order)
  const bucketOptions = ['public', 'profile-images', 'storage'];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (onFileSelect) {
        onFileSelect(e.dataTransfer.files[0]);
      }
      
      if (onUploadComplete) {
        await uploadFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (onFileSelect) {
        onFileSelect(e.target.files[0]);
      }
      
      if (onUploadComplete) {
        await uploadFile(e.target.files[0]);
      }
    }
  };

  const uploadFile = async (file: File) => {
    // Reset error state
    setError(null);
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro ao fazer upload",
        description: "O arquivo é muito grande. Tamanho máximo: 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
      const filePath = `lovable-uploads/${fileName}`;
      
      // Try each bucket until one works
      let uploadSuccess = false;
      let publicUrl = '';
      let lastError = null;
      
      for (const bucketName of bucketOptions) {
        try {
          // Upload the file to the current bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            lastError = uploadError;
            console.log(`Upload to bucket '${bucketName}' failed:`, uploadError.message);
            continue; // Try next bucket
          }
          
          // Get public URL from the successful bucket
          const { data } = await supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
            
          if (data?.publicUrl) {
            publicUrl = data.publicUrl;
            uploadSuccess = true;
            console.log(`Upload to bucket '${bucketName}' succeeded`);
            break; // Exit the loop since we succeeded
          }
        } catch (err) {
          console.error(`Error with bucket '${bucketName}':`, err);
        }
      }
      
      if (!uploadSuccess) {
        throw new Error(lastError?.message || 'Falha ao fazer upload para todos os buckets disponíveis');
      }
      
      // If we got here and don't have a URL, create a fallback
      if (!publicUrl) {
        publicUrl = `/lovable-uploads/${fileName}`;
      }
      
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
      
      toast({
        title: "Upload concluído",
        description: "Arquivo enviado com sucesso",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Set a more user-friendly error message
      const errorMessage = error?.message || 'Erro desconhecido';
      setError(
        "Não foi possível fazer upload da imagem. O bucket de armazenamento 'public' não existe no seu projeto Supabase. " +
        "Crie um bucket chamado 'public' no painel do Supabase em Storage → Buckets → New bucket."
      );
      
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível carregar o arquivo. Verifique o painel para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
          ${isDragging ? 'border-storysnap-blue bg-storysnap-blue/5' : 'border-slate-200 hover:border-storysnap-blue/50 hover:bg-slate-50'}
          ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={uploadType === "image" ? "image/*" : undefined}
        />
        
        {imagePreview ? (
          <div className="relative w-48 h-48 mb-4">
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={imagePreview} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-lg shadow-md" 
            />
            <div 
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onFileSelect) {
                  onFileSelect(null as unknown as File);
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
        )}
        
        <div className="text-center">
          <h3 className="text-lg font-medium mb-1">
            {imagePreview ? 'Alterar foto' : 'Adicionar foto da criança'}
          </h3>
          <p className="text-sm text-slate-500 mb-2">
            {imagePreview ? 'Clique para escolher outra imagem' : 'Arraste e solte ou clique para selecionar'}
          </p>
          <p className="text-xs text-slate-400">
            JPG, PNG ou GIF (máx. 5MB)
          </p>
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FileUpload;
