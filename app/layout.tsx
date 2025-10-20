import type React from "react"
import type { Metadata } from "next"
import { Raleway } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Aurora Glass - Formulário de Cadastro",
  description: "Formulário elegante com tema liquid glass e aurora boreal",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${raleway.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
