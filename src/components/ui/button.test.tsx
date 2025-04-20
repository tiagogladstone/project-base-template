// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest' // Importa funções de teste do Vitest
import { Button } from './button' // Importa o componente Button

// Descreve o conjunto de testes para o componente Button
describe('Button Component', () => {

  // Teste 1: Verifica se o botão renderiza com o texto filho corretamente
  it('should render the button with children', () => {
    render(<Button>Click Me</Button>) // Renderiza o componente

    // Procura o botão pelo seu role e nome acessível (case-insensitive)
    const buttonElement = screen.getByRole('button', { name: /click me/i })
    // Afirma que o elemento está presente no DOM virtual
    expect(buttonElement).toBeInTheDocument()
  })

  // Teste 2: Verifica se as classes CSS da variante são aplicadas
  it('should apply variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    const buttonElement = screen.getByRole('button', { name: /delete/i })
    // Verifica se a classe CSS esperada está presente (seja flexível com classes exatas)
    // Verifique uma classe chave da variante, não a string completa que pode mudar.
    expect(buttonElement).toHaveClass('bg-destructive')
  })

  // Teste 3: Verifica se o botão está desabilitado quando a prop 'disabled' é passada
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>)
    const buttonElement = screen.getByRole('button', { name: /submit/i })
    // Afirma que o botão está desabilitado
    expect(buttonElement).toBeDisabled()
  })

  // Teste 4: Verifica se a função onClick é chamada quando o botão é clicado
  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn() // Cria uma função mock (espiã)
    render(<Button onClick={handleClick}>Click Handler Test</Button>)
    const buttonElement = screen.getByRole('button', { name: /click handler test/i })

    // Não simule clique se o botão estiver desabilitado (teste de sanidade)
    if (!buttonElement.hasAttribute('disabled')) {
        fireEvent.click(buttonElement) // Simula um clique no botão
         // Afirma que a função mock foi chamada exatamente uma vez
        expect(handleClick).toHaveBeenCalledTimes(1)
    } else {
         fireEvent.click(buttonElement)
         expect(handleClick).not.toHaveBeenCalled(); // Não deve ser chamado se disabled
    }
  })

   // Teste 5: Verifica se renderiza como um link quando 'asChild' é usado com um <a>
   // Nota: Este teste é mais simples com <a> do que com <Link> do Next.js
   it('should render as a link when asChild is used with an anchor tag', () => {
     render(<Button asChild><a href="/test">Link Button</a></Button>)
     // Procura pelo role 'link' em vez de 'button'
     const linkElement = screen.getByRole('link', { name: /link button/i })
     expect(linkElement).toBeInTheDocument()
     expect(linkElement).toHaveAttribute('href', '/test')
     // Verifica se NÃO tem role 'button'
     expect(screen.queryByRole('button')).not.toBeInTheDocument()
   })
}) 