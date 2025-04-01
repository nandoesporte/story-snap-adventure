import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  BookOpenText, 
  Clock3, 
  Globe2, 
  Heart, 
  HelpCircle, 
  Palette,
  Sparkles,  
  Star,
  Volume2
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { voiceTypes } from "@/lib/tts";
import { StoryStyle } from "@/services/BookGenerationService";

const formSchema = z.object({
  childName: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  childAge: z.string().min(1, {
    message: "A idade deve ser preenchida.",
  }),
  theme: z.string().min(4, {
    message: "O tema deve ter pelo menos 4 caracteres.",
  }),
  setting: z.string().min(4, {
    message: "O cenário deve ter pelo menos 4 caracteres.",
  }),
  characterId: z.string().optional(),
  characterName: z.string().optional(),
  style: z.string(),
  length: z.string(),
  readingLevel: z.string(),
  language: z.string(),
  moral: z.string(),
  voiceType: z.enum(['male', 'female'])
})

export interface StoryFormData {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterId?: string;
  characterName?: string;
  style: StoryStyle;
  length: string;
  readingLevel: string;
  language: string;
  moral: string;
  voiceType: 'male' | 'female';
}

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  initialData?: StoryFormData | null;
  disabled?: boolean;
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, initialData, disabled = false }) => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  const form = useForm<StoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      childName: "",
      childAge: "",
      theme: "adventure",
      setting: "forest",
      style: "papercraft",
      length: "medium",
      readingLevel: "intermediate",
      language: "portuguese",
      moral: "friendship",
      voiceType: "female"
    },
  });

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as any, value);
        }
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="childName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Criança</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome da criança" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="childAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idade da Criança</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Digite a idade da criança" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tema da História</FormLabel>
              <FormControl>
                <Input placeholder="Digite o tema da história" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="setting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cenário da História</FormLabel>
              <FormControl>
                <Input placeholder="Digite o cenário da história" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="moral"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moral da História</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moral" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="friendship">Amizade</SelectItem>
                  <SelectItem value="courage">Coragem</SelectItem>
                  <SelectItem value="honesty">Honestidade</SelectItem>
                  <SelectItem value="kindness">Gentileza</SelectItem>
                  <SelectItem value="perseverance">Perseverança</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="length"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tamanho da História</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="short">Curta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="long">Longa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="readingLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nível de Leitura</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avan��ado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma da História</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="portuguese">Português</SelectItem>
                  <SelectItem value="english">Inglês</SelectItem>
                  <SelectItem value="spanish">Espanhol</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="voiceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Voz</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de voz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Masculina</SelectItem>
                  <SelectItem value="female">Feminina</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end mt-8">
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium px-8 py-6 rounded-xl shadow-md"
            disabled={disabled}
          >
            {disabled ? (
              <div className="flex items-center gap-2">
                <span className="animate-pulse">Gerando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>Gerar História</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StoryForm;
