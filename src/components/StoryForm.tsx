import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StoryStyle } from '@/services/BookGenerationService';

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
}

const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, initialData }) => {
  const form = useForm<StoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childName: initialData?.childName || "",
      childAge: initialData?.childAge || "",
      theme: initialData?.theme || "",
      setting: initialData?.setting || "",
      characterId: initialData?.characterId || "",
      characterName: initialData?.characterName || "",
      style: initialData?.style || "papercraft",
      length: initialData?.length || "medium",
      readingLevel: initialData?.readingLevel || "intermediate",
      language: initialData?.language || "portuguese",
      moral: initialData?.moral || "friendship",
      voiceType: initialData?.voiceType || "female"
    },
    mode: "onChange"
  })

  function handleSubmit(values: StoryFormData) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
        <Button type="submit">Gerar História</Button>
      </form>
    </Form>
  );
};

export default StoryForm;
