
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Volume2, VolumeX, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const apiKeySchema = z.object({
  elevenlabsApiKey: z.string().min(1, 'A chave da API é obrigatória')
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const STORAGE_KEY = 'elevenlabs_api_key';

const ElevenLabsSettings = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [keyValidity, setKeyValidity] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      elevenlabsApiKey: ''
    }
  });

  // Load saved API key on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      form.setValue('elevenlabsApiKey', savedKey);
      setKeyValidity('valid'); // Assuming saved key is valid
    }
  }, [form]);

  const validateApiKey = async (apiKey: string) => {
    try {
      setIsValidating(true);
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (response.ok) {
        setKeyValidity('valid');
        return true;
      } else {
        setKeyValidity('invalid');
        return false;
      }
    } catch (error) {
      console.error('Error validating ElevenLabs API key:', error);
      setKeyValidity('invalid');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: ApiKeyFormValues) => {
    const isValid = await validateApiKey(data.elevenlabsApiKey);
    
    if (isValid) {
      localStorage.setItem(STORAGE_KEY, data.elevenlabsApiKey);
      toast.success('Chave da API ElevenLabs salva com sucesso');
    } else {
      toast.error('A chave da API ElevenLabs é inválida');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-violet-600" />
          Configurações de Narração por Voz
        </CardTitle>
        <CardDescription>
          Configure sua chave da API do ElevenLabs para habilitar a narração por voz das histórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="elevenlabsApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Chave da API ElevenLabs
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-md">
                        <p>Você pode obter sua chave da API no site do ElevenLabs em: <a href="https://elevenlabs.io/app" target="_blank" rel="noopener noreferrer" className="underline">elevenlabs.io</a></p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Insira sua chave da API ElevenLabs"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  {keyValidity === 'valid' && !isValidating && (
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <Volume2 className="h-3 w-3" /> Chave API válida
                    </p>
                  )}
                  {keyValidity === 'invalid' && !isValidating && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <VolumeX className="h-3 w-3" /> Chave API inválida
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isValidating}>
              {isValidating ? 'Validando...' : 'Salvar Configurações'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
        <p>
          A narração por voz usa o ElevenLabs para criar narrações em português de alta qualidade 
          para as histórias infantis. Sua chave API é armazenada apenas no seu navegador.
        </p>
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsSettings;
