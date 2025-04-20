"use client" // Indica que este é um Client Component

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Hook para navegação
import { z } from "zod" // Biblioteca para validação de schema
import { useForm } from "react-hook-form" // Hook para gerenciamento de formulários
import { zodResolver } from "@hookform/resolvers/zod" // Integração Zod com react-hook-form

import { createClient } from "@/lib/supabase/client" // Função para criar cliente Supabase no browser
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, // Para exibir erros de validação
} from "@/components/ui/form"
// Atenção: useToast precisa ser importado corretamente. O shadcn add pode ter criado um hook
// diferente. Verifique se o import abaixo funciona. Se der erro, pode ser que precise
// importar de "@/components/ui/toast" ou outro local, dependendo da versão do shadcn/ui.
// Vamos assumir que o hook está em "@/components/ui/use-toast" por enquanto.
// Se não funcionar no teste, precisaremos ajustar este import.
import { toast } from "sonner" // Hook para exibir notificações
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card" // Componentes visuais
import { Loader2 } from "lucide-react" // Ícone de loading
import Link from "next/link" // Adicionar import
import { Eye, EyeOff } from "lucide-react" // Adicionar imports (serão usados na Fase 3.5.2)
import { FcGoogle } from "react-icons/fc" // Adicionar import para ícone do Google

// Schema de validação para o formulário
const formSchema = z.object({
  email: z.string().email({ message: "Informe um email válido." }),
  password: z.string().optional(), // Senha opcional para Magic Link
})

type FormValues = z.infer<typeof formSchema> // Tipo inferido do schema Zod

type AuthMode = "sign-in" | "sign-up" | "magic-link" // Modos possíveis do formulário

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("sign-in") // Estado para controlar o modo
  const [loading, setLoading] = useState(false) // Estado para indicar loading
  const [showPassword, setShowPassword] = useState(false) // Adicionar estado para visibilidade da senha (usado na Fase 3.5.2)
  const [oauthLoading, setOauthLoading] = useState(false) // <<< Estado de loading específico para OAuth
  const router = useRouter() // Hook para redirecionamento
  const supabase = createClient() // Cria instância do cliente Supabase

  // Configuração do react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema), // Usa Zod para validação (DESCOMENTADO)
    defaultValues: {
      email: "",
      password: "",
    },
    // Revalidar ao mudar de modo para limpar erros de senha (se aplicável)
    shouldUnregister: false,
  })

  // Limpar senha e erros relacionados quando mudar para magic link
  useEffect(() => {
    if (mode === 'magic-link') {
      form.resetField('password');
      form.clearErrors('password');
    }
    // Resetar o estado de loading ao mudar de modo
    setLoading(false);
    // Resetar visibilidade da senha
    setShowPassword(false);
    // Resetar loading OAuth também
    setOauthLoading(false);
  }, [mode, form]);

  // Função executada ao submeter o formulário válido
  const onSubmit = async (values: FormValues) => {
    console.log("onSubmit iniciado. Modo:", mode); // Log 1
    console.log("Definindo loading para true..."); // Log 2
    setLoading(true); // Ativa o loading
    console.log("Loading definido como true."); // Log 3

    try {
      let responseError = null; // Variável para armazenar erro da Supabase

      if (mode === "magic-link") {
        console.log("Tentando Magic Link para:", values.email); // Log 4
        // Lógica para Magic Link (OTP por email)
        const { error } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: {
            // URL para onde o usuário será redirecionado após clicar no link do email
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        responseError = error;
        if (!error) {
             toast.success("Link enviado!", { description: "Verifique seu email para continuar." });
        }

      } else if (mode === "sign-in") {
        // Lógica para Login com Email/Senha
        // **** VALIDAÇÃO MANUAL DA SENHA AQUI ****
        if (!values.password || values.password.length < 6) {
             form.setError("password", { type: "manual", message: "Senha inválida (mínimo 6 caracteres)." });
             // Não prossegue se a senha for inválida
             setLoading(false); // Reseta o loading
             return; // Interrompe a função onSubmit aqui
        }
        // **** FIM DA VALIDAÇÃO MANUAL ****
        console.log("Tentando Sign In para:", values.email); // Mantenha o log
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password, // Passa a senha validada
        })
         responseError = error;
         if (!error) {
             toast.success("Login bem-sucedido!", { description: "Você está conectado." });
             router.refresh() // Atualiza a página para refletir o estado de login (Server Components)
             router.push("/dashboard") // Redireciona para o dashboard
         }

      } else if (mode === "sign-up") {
        // Lógica para Cadastro com Email/Senha
        // **** VALIDAÇÃO MANUAL DA SENHA AQUI ****
        if (!values.password || values.password.length < 6) {
             form.setError("password", { type: "manual", message: "Senha inválida (mínimo 6 caracteres)." });
             // Não prossegue se a senha for inválida
             setLoading(false); // Reseta o loading
             return; // Interrompe a função onSubmit aqui
        }
         // **** FIM DA VALIDAÇÃO MANUAL ****
        console.log("Tentando Sign Up para:", values.email); // Mantenha o log
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password, // Passa a senha validada
          options: {
            // URL para onde o usuário será redirecionado após clicar no link de confirmação
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        responseError = error;
        if (!error) {
             toast.success("Conta criada!", { description: "Verifique seu email para confirmar." });
        }
      }

      // Se houve erro na chamada da Supabase, lança-o para o catch tratar o toast
      if (responseError) throw responseError;

    } catch (error: unknown) {
      console.error("Erro capturado no CATCH:", error); // Log 7
      // Captura qualquer erro (incluindo os lançados manualmente ou pela Supabase) e exibe um toast
      console.error("Erro de autenticação:", error); // Log do erro no console

      // <<< Verificação de tipo para acessar a mensagem
      let errorMessage = "Ocorreu um erro inesperado ao tentar autenticar.";
      if (error instanceof Error) {
          errorMessage = error.message;
      } else if (typeof error === 'string') {
          errorMessage = error;
      }
      // Adiciona o modo ao log para contexto
      console.error(`Erro na autenticação (modo ${mode}):`, error);

      toast.error("Erro de autenticação", {
        description: errorMessage,
      });
    } finally {
      console.log("Bloco FINALLY executado."); // Log 8
      console.log("Definindo loading para false..."); // Log 9
      setLoading(false); // Desativa o loading
      console.log("Loading definido como false."); // Log 10
    }
  }

  // Adicione este log antes do return para ver o estado em cada renderização
  console.log("Renderizando AuthForm. Loading:", loading, "Mode:", mode); // Log 11

  // <<< Função para lidar com o login OAuth
  const handleOAuthSignIn = async (provider: 'google') => {
    setOauthLoading(true);
    try {
       const { error } = await supabase.auth.signInWithOAuth({
         provider,
         options: {
           redirectTo: `${window.location.origin}/auth/callback`, // Onde o Supabase redireciona após o Google
         },
       });
       if (error) throw error;
       // Redirecionamento para o Google acontece aqui. O loading não será desativado se for sucesso.
    } catch (error: unknown) {
       console.error(`Erro ao fazer login com ${provider}:`, error);

       // <<< Verificação de tipo para acessar a mensagem
       let errorMessage = `Não foi possível iniciar o login com ${provider}. Tente novamente.`;
       if (error instanceof Error) {
           errorMessage = error.message;
       } else if (typeof error === 'string') {
           errorMessage = error;
       }

       toast.error(`Erro com ${provider}`, { description: errorMessage }); // Usando sonner
       setOauthLoading(false); // Desativa loading específico se houver erro ANTES do redirect
    }
    // Não colocar setLoading(false) aqui fora do catch, pois o redirect pode ocorrer.
  };

  // Renderização do componente
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === "sign-in" ? "Bem-vindo de volta!" : mode === "sign-up" ? "Crie sua Conta" : "Acesso Rápido"}
        </CardTitle>
        <CardDescription>
          {mode === "sign-in" ? "Entre com seu email e senha" : mode === "sign-up" ? "Preencha os dados para se cadastrar" : "Receba um link de acesso no seu email"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Componente Form do react-hook-form */}
        <Form {...form}>
          {/* Passa o estado de 'disabled' para o form se a mutação estiver ocorrendo */}
          {/* Usamos form.handleSubmit para envolver nossa função onSubmit, ele cuida da validação */}
          <form
             onSubmit={form.handleSubmit(onSubmit)} // DESCOMENTADO
             className={`space-y-6 ${loading ? 'opacity-70 pointer-events-none' : ''}`} // Desabilita interação visualmente durante o envio
          >
            {/* Campo de Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage /> {/* Exibe erros de validação para este campo */}
                </FormItem>
              )}
            />

            {/* Campo de Senha (condicionalmente renderizado) */}
            {mode !== "magic-link" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage /> {/* Exibe erros de validação ou os erros manuais que setamos */}
                  </FormItem>
                )}
              />
            )}

            {/* <<< Link "Esqueci minha senha" (visível apenas no modo sign-in) */}
            {mode === "sign-in" && (
               <div className="text-right">
                 <Button variant="link" size="sm" asChild className="p-0 h-auto font-normal text-muted-foreground">
                   <Link href="/reset-password">Esqueci minha senha</Link>
                 </Button>
               </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || oauthLoading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {/* <<< Usar a variável buttonText definida acima */} 
                {loading ? (mode === "sign-in" ? "Entrando..." : mode === "sign-up" ? "Cadastrando..." : "Enviando Link...") : (mode === "sign-in" ? "Entrar" : mode === "sign-up" ? "Cadastrar" : "Enviar Link Mágico")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-6"> 
        {/* <<< Botão de Login com Google (visível em sign-in e sign-up) */} 
        { (mode === 'sign-in' || mode === 'sign-up') && (
            <>
               {/* Divisor "OU" */} 
               <div className="relative w-full my-2"> {/* Adicionado my-2 para espaçamento */} 
                  <div className="absolute inset-0 flex items-center"> <span className="w-full border-t" /> </div>
                  <div className="relative flex justify-center text-xs uppercase"> <span className="bg-card px-2 text-muted-foreground"> Ou continue com </span> </div>
               </div>
               <Button
                 variant="outline"
                 className="w-full flex items-center justify-center gap-2"
                 onClick={() => handleOAuthSignIn('google')}
                 disabled={loading || oauthLoading} // Desabilita durante qualquer loading
               >
                  {oauthLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <FcGoogle className="h-5 w-5 mr-2" /> )} 
                  Google
               </Button>
            </>
        )}

        {/* Links para alternar entre os modos */} 
        {mode === "sign-in" && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setMode("sign-up")} className="w-full font-normal" disabled={loading || oauthLoading}> Não tem conta? Cadastre-se </Button>
            <Button variant="link" size="sm" onClick={() => setMode("magic-link")} className="w-full text-muted-foreground font-normal text-sm" disabled={loading || oauthLoading}> Prefere um link mágico? </Button>
          </>
        )}
        {mode === "sign-up" && ( <Button variant="ghost" size="sm" onClick={() => setMode("sign-in")} className="w-full font-normal" disabled={loading || oauthLoading}> Já tem conta? Faça login </Button> )} 
        {mode === "magic-link" && ( <Button variant="ghost" size="sm" onClick={() => setMode("sign-in")} className="w-full font-normal" disabled={loading || oauthLoading}> Voltar para login com senha </Button> )} 
      </CardFooter>
    </Card>
  )
} 