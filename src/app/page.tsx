import { ModeToggle } from "@/components/ui/mode-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  // Teste para disparar deploy automático Vercel

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-muted/50 dark:from-background dark:to-black/80">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>

      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">
          Atlas Cloud AI
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
          Desenvolvimento Full Stack 100% na nuvem com Next.js, Supabase, Codespaces e IA integrada.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/30 transition-shadow">
            <Link href="/dashboard">Acessar Dashboard</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/login">Login / Cadastro</Link>
          </Button>
        </div>
      </div>

      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        Criado com o Atlas Cloud AI Accelerator
      </footer>
    </div>
  )
}
