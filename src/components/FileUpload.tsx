
import { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  imagePreview?: string | null;
  uploadType?: "image" | "file";
}

const FileUpload = ({ onFileSelect, onUploadComplete, imagePreview, uploadType = "image" }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      
      // Skip bucket creation since it requires admin privileges
      // Instead, try to upload directly to the 'public' bucket
      // which should already exist and be configured in Supabase
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        
        // If the error is because the bucket doesn't exist
        if (uploadError.message.includes("not found") || uploadError.message.includes("does not exist")) {
          toast({
            title: "Erro de configuração",
            description: "O bucket de armazenamento 'public' não existe. Contate o administrador do sistema.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao fazer upload",
            description: "Não foi possível carregar o arquivo. Erro: " + uploadError.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      // Get the public URL
      const { data } = await supabase.storage
        .from('public')
        .getPublicUrl(filePath);
        
      let publicUrl = data?.publicUrl;
      
      // If for some reason we couldn't get the public URL, fallback to a relative path
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
      toast({
        title: "Erro ao fazer upload",
        description: `Não foi possível carregar o arquivo. ${error?.message || 'Erro desconhecido'}`,
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
