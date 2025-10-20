"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ToastContainer, type Toast } from "@/components/toast"
import { AuroraLogo } from "@/components/aurora-logo"
import { PersonalStep } from "@/components/form-steps/personal-step"
import { AddressStep } from "@/components/form-steps/address-step"
import { PaymentStep } from "@/components/form-steps/payment-step"
import { SummaryStep } from "@/components/form-steps/summary-step"
import { formSchema, personalSchema, addressSchema, paymentSchema, type FormData } from "@/lib/form-types"
import { clearFormData } from "@/lib/form-utils"

const steps = [
  { title: "Dados Pessoais", description: "Informações básicas", schema: personalSchema },
  { title: "Endereço", description: "Localização", schema: addressSchema },
  { title: "Pagamento", description: "Método de pagamento", schema: paymentSchema },
  { title: "Resumo", description: "Confirme seus dados", schema: formSchema },
]

export function AuroraForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(steps[currentStep].schema),
    mode: "onChange",
    defaultValues: {
      paymentMethod: "card",
    },
  })

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleNext = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
      addToast("Etapa concluída com sucesso!", "success")
    } else {
      addToast("Por favor, corrija os erros antes de continuar", "error")
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Form submitted:", data)
    addToast("Cadastro realizado com sucesso!", "success")
    clearFormData()
    setIsSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (currentStep < steps.length - 1) {
        handleNext()
      } else {
        form.handleSubmit(handleSubmit)()
      }
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      handlePrevious()
    }
  }

  return (
    <>
      <Card
        className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-3xl border-0"
        onKeyDown={handleKeyDown}
      >
        <CardHeader className="relative">
          <AuroraLogo />
        </CardHeader>
        <CardContent className="space-y-6 pt-6 relative">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      index <= currentStep
                        ? "bg-gradient-to-br from-emerald-300/50 via-cyan-300/50 via-violet-300/50 to-pink-300/50 backdrop-blur-sm text-emerald-700 shadow-lg"
                        : "bg-gray-100/60 backdrop-blur-sm text-gray-400"
                    }`}
                    initial={false}
                    animate={{
                      scale: index === currentStep ? 1.1 : 1,
                    }}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </motion.div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p className="text-xs font-medium text-gray-700">{step.title}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-all rounded-full ${
                      index < currentStep
                        ? "bg-gradient-to-r from-emerald-300/50 via-cyan-300/50 via-violet-300/50 to-pink-300/50"
                        : "bg-gray-200/60"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form steps */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {currentStep === 0 && <PersonalStep key="personal" form={form} onAddToast={addToast} />}
              {currentStep === 1 && <AddressStep key="address" form={form} onAddToast={addToast} />}
              {currentStep === 2 && <PaymentStep key="payment" form={form} onAddToast={addToast} />}
              {currentStep === 3 && <SummaryStep key="summary" form={form} />}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="water-button rounded-full px-6 transition-all disabled:opacity-30 text-gray-700 font-medium border-0"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="water-button rounded-full px-6 text-emerald-700 font-medium transition-all border-0"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="water-button rounded-full px-6 text-emerald-700 font-medium transition-all disabled:opacity-50 border-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
