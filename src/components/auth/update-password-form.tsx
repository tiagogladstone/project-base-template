"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>

export default function UpdatePasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
     const checkSessionState = async () => {
         const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
             console.log("Auth Event (UpdatePasswordForm):", event);
             if (event === "PASSWORD_RECOVERY") {
                 console.log("Password recovery event received. User can now update password.");
                 setError(null);
             } else if (event === "SIGNED_IN" && session) {
                 console.warn("User already signed in on update-password page.");
             }
         });

         const params = new URLSearchParams(window.location.hash.substring(1));
         const error_description = params.get('error_description');
         if (error_description) {
             const decodedError = decodeURIComponent(error_description);
             setError(decodedError);
             toast.error("Erro no Link", { description: decodedError });
         }

         return () => {
             subscription?.unsubscribe();
         };
     };
     checkSessionState();
   }, [supabase, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
       const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (updateError) throw updateError

      toast.success("Senha atualizada!", { description: "Sua senha foi alterada com sucesso. Faça login agora." })
      router.push("/login")

    } catch (err: unknown) {
      console.error("Erro ao atualizar senha:", err)
      
      let errorMessage = "Não foi possível atualizar a senha. O link pode ter expirado, ser inválido ou já ter sido usado. Tente solicitar a recuperação novamente.";
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      
      setError(errorMessage)
      toast.error("Erro ao atualizar senha", {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Definir Nova Senha</CardTitle>
        <CardDescription>
          Digite sua nova senha abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Input
                         type={showPassword ? "text" : "password"}
                         placeholder="••••••••"
                         {...field}
                         className="pr-10"
                       />
                       <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                     <div className="relative">
                       <Input
                         type={showConfirmPassword ? "text" : "password"}
                         placeholder="••••••••"
                         {...field}
                         className="pr-10"
                       />
                       <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowConfirmPassword(p => !p)} aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </Button>
                     </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 