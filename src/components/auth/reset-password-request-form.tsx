"use client"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({ message: "Informe um email válido." }),
})

type FormValues = z.infer<typeof formSchema>

export default function ResetPasswordRequestForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false) // Para mostrar mensagem de sucesso
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setSubmitted(false)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          // URL para onde o usuário será redirecionado APÓS clicar no link do email.
          // Supabase anexa o token de recuperação a esta URL.
          redirectTo: `${window.location.origin}/update-password`,
        }
      )
      if (error) throw error
      toast.success("Link enviado!", { description: "Verifique seu email para redefinir sua senha." })
      setSubmitted(true) // Mostra mensagem de sucesso no card
      form.reset() // Limpa o formulário
    } catch (error: unknown) {
      console.error("Erro ao solicitar recuperação de senha:", error);

      let description = "Não foi possível enviar o link de recuperação. Verifique o email ou tente novamente.";
      if (error instanceof Error) {
          description = error.message;
      } else if (typeof error === 'string') {
          description = error;
      }

      toast.error("Erro", {
        description: description,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
        <CardDescription>
          {submitted
            ? "Se uma conta existir para este email, você receberá um link de recuperação em breve."
            : "Digite seu email e enviaremos um link para você redefinir sua senha."}
        </CardDescription>
      </CardHeader>
      {!submitted && ( // Só mostra o formulário se ainda não foi submetido com sucesso
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  )
} 