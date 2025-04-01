
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
import { toast } from "sonner";

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
  suggestions?: {
    theme?: string;
    setting?: string;
    moral?: string;
  } | null;
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, initialData, disabled = false, suggestions = null }) => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [suggestedSettings, setSuggestedSettings] = useState<Record<string, string>>({
    adventure: "forest",
    fantasy: "castle",
    space: "space",
    ocean: "underwater",
    dinosaurs: "dinosaurland"
  });

  // Use suggestions or initialData, with suggestions taking precedence
  const defaultValues = {
    childName: "",
    childAge: "",
    theme: suggestions?.theme || "adventure",
    setting: suggestions?.setting || "forest",
    style: "papercraft",
    length: "medium",
    readingLevel: "intermediate",
    language: "portuguese",
    moral: suggestions?.moral || "friendship",
    voiceType: "female"
  };

  const form = useForm<StoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || defaultValues,
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

  // Apply AI suggestions when they arrive
  useEffect(() => {
    if (suggestions) {
      if (suggestions.theme) {
        form.setValue('theme', suggestions.theme);
      }
      if (suggestions.setting) {
        form.setValue('setting', suggestions.setting);
      }
      if (suggestions.moral) {
        form.setValue('moral', suggestions.moral);
      }
    }
  }, [suggestions, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'theme' && value.theme) {
        const suggestedSetting = suggestedSettings[value.theme as string] || "forest";
        form.setValue('setting', suggestedSetting);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, suggestedSettings]);

  const handleFormSubmit = (data: StoryFormData) => {
    if (disabled || formSubmitted) {
      return;
    }
    
    try {
      setFormSubmitted(true);
      onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Erro ao enviar o formulário. Tente novamente.");
      setFormSubmitted(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  const suggestedSetting = suggestedSettings[value] || "forest";
                  form.setValue('setting', suggestedSetting);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="adventure">Aventura</SelectItem>
                  <SelectItem value="fantasy">Fantasia</SelectItem>
                  <SelectItem value="space">Espaço</SelectItem>
                  <SelectItem value="ocean">Oceano</SelectItem>
                  <SelectItem value="dinosaurs">Dinossauros</SelectItem>
                </SelectContent>
              </Select>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cenário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="forest">Floresta Encantada</SelectItem>
                  <SelectItem value="castle">Castelo Mágico</SelectItem>
                  <SelectItem value="space">Espaço Sideral</SelectItem>
                  <SelectItem value="underwater">Mundo Submarino</SelectItem>
                  <SelectItem value="dinosaurland">Terra dos Dinossauros</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="advanced">Avançado</SelectItem>
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
            disabled={disabled || formSubmitted}
          >
            {disabled || formSubmitted ? (
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
