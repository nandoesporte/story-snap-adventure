
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || '',
      bio: user?.user_metadata?.bio || '',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        form.reset({
          name: user.user_metadata?.name || user.email || '',
          bio: user.user_metadata?.bio || '',
        });
      } catch (error: any) {
        toast.error('Erro ao carregar perfil: ' + error.message);
      }
    };

    fetchUserProfile();
  }, [user, navigate, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: values.name,
          bio: values.bio,
        },
      });

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <motion.div 
        className="flex-grow py-10 px-4 bg-gradient-to-b from-violet-50 to-indigo-50 pt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-violet-800 mb-8">Seu Perfil</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sobre você</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Conte um pouco sobre você..." 
                                className="resize-none min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        variant="default"
                        disabled={isUpdating}
                        className="w-full md:w-auto"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : 'Salvar Alterações'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <SubscriptionStatus />
              
              <Card>
                <CardHeader>
                  <CardTitle>Email</CardTitle>
                  <CardDescription>
                    Seu endereço de email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{user.email}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Minhas Histórias</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full"
                  >
                    <Link to="/my-stories">
                      Ver minhas histórias
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default Profile;
