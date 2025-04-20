"use client"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme("light")}
        className="mr-2"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Set Light Theme</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Set Dark Theme</span>
      </Button>
    </>
  )
} 