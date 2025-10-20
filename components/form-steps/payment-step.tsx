"use client"

import type { UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { CreditCardIcon, Smartphone, Copy, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import type { FormData, CardBrand } from "@/lib/form-types"
import {
  maskCardNumber,
  maskCardExpiry,
  maskCVV,
  detectCardBrand,
  validateLuhn,
  generatePixQRCode,
  generateFakePixCode,
} from "@/lib/form-utils"

interface PaymentStepProps {
  form: UseFormReturn<FormData>
  onAddToast: (message: string, type: "success" | "error" | "info") => void
}

export function PaymentStep({ form, onAddToast }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card")
  const [cardBrand, setCardBrand] = useState<CardBrand>("unknown")
  const [pixQRCode, setPixQRCode] = useState<string>("")
  const [pixPaymentCode, setPixPaymentCode] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const cardNumber = form.watch("cardNumber") || ""

  useEffect(() => {
    form.setValue("paymentMethod", paymentMethod)
    if (paymentMethod === "pix") {
      const qrCode = generatePixQRCode("pagamento@auroraglass.com")
      const paymentCode = generateFakePixCode()
      setPixQRCode(qrCode)
      setPixPaymentCode(paymentCode)
    }
  }, [paymentMethod, form])

  useEffect(() => {
    if (cardNumber) {
      const brand = detectCardBrand(cardNumber)
      setCardBrand(brand)

      if (cardNumber.replace(/\s/g, "").length >= 13) {
        const isValid = validateLuhn(cardNumber)
        if (!isValid) {
          form.setError("cardNumber", { message: "Número de cartão inválido" })
        } else {
          form.clearErrors("cardNumber")
        }
      }
    }
  }, [cardNumber, form])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pixPaymentCode)
      setCopied(true)
      onAddToast("Código PIX copiado!", "success")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      onAddToast("Erro ao copiar código", "error")
    }
  }

  const cardBrandLogos: Record<CardBrand, string> = {
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    amex: "💳 Amex",
    unknown: "💳",
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <Label className="text-gray-700 font-medium">Método de pagamento</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as "card" | "pix")}
          className="grid grid-cols-2 gap-4 mt-2"
        >
          <div>
            <RadioGroupItem value="card" id="card" className="peer sr-only" />
            <Label
              htmlFor="card"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 bg-white border-gray-300 p-4 hover:bg-gray-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-emerald-500/20 cursor-pointer transition-all text-gray-700 peer-data-[state=checked]:text-emerald-700"
            >
              <CreditCardIcon className="w-6 h-6" />
              <span className="text-sm font-medium">Cartão</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
            <Label
              htmlFor="pix"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 bg-white border-gray-300 p-4 hover:bg-gray-50 peer-data-[state=checked]:border-violet-500 peer-data-[state=checked]:bg-violet-50 peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-violet-500/20 cursor-pointer transition-all text-gray-700 peer-data-[state=checked]:text-violet-700"
            >
              <Smartphone className="w-6 h-6" />
              <span className="text-sm font-medium">PIX</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {paymentMethod === "card" ? (
        <>
          <div>
            <Label htmlFor="cardNumber" className="text-gray-700 font-medium">
              Número do cartão
            </Label>
            <div className="relative">
              <Input
                id="cardNumber"
                {...form.register("cardNumber")}
                placeholder="1234 5678 9012 3456"
                className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
                onChange={(e) => {
                  const masked = maskCardNumber(e.target.value)
                  form.setValue("cardNumber", masked)
                }}
                aria-invalid={!!form.formState.errors.cardNumber}
                aria-describedby={form.formState.errors.cardNumber ? "cardNumber-error" : undefined}
              />
              {cardBrand !== "unknown" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">{cardBrandLogos[cardBrand]}</div>
              )}
            </div>
            {form.formState.errors.cardNumber && (
              <p id="cardNumber-error" className="text-sm text-red-500 mt-1">
                {form.formState.errors.cardNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cardName" className="text-gray-700 font-medium">
              Nome no cartão
            </Label>
            <Input
              id="cardName"
              {...form.register("cardName")}
              placeholder="JOÃO SILVA"
              className="uppercase bg-white border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
              onChange={(e) => {
                form.setValue("cardName", e.target.value.toUpperCase())
              }}
              aria-invalid={!!form.formState.errors.cardName}
              aria-describedby={form.formState.errors.cardName ? "cardName-error" : undefined}
            />
            {form.formState.errors.cardName && (
              <p id="cardName-error" className="text-sm text-red-500 mt-1">
                {form.formState.errors.cardName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExpiry" className="text-gray-700 font-medium">
                Validade
              </Label>
              <Input
                id="cardExpiry"
                {...form.register("cardExpiry")}
                placeholder="MM/AA"
                className="bg-white border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
                onChange={(e) => {
                  const masked = maskCardExpiry(e.target.value)
                  form.setValue("cardExpiry", masked)
                }}
                aria-invalid={!!form.formState.errors.cardExpiry}
                aria-describedby={form.formState.errors.cardExpiry ? "cardExpiry-error" : undefined}
              />
              {form.formState.errors.cardExpiry && (
                <p id="cardExpiry-error" className="text-sm text-red-500 mt-1">
                  {form.formState.errors.cardExpiry.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cardCvv" className="text-gray-700 font-medium">
                CVV
              </Label>
              <Input
                id="cardCvv"
                type="password"
                {...form.register("cardCvv")}
                placeholder="123"
                className="bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
                onChange={(e) => {
                  const masked = maskCVV(e.target.value)
                  form.setValue("cardCvv", masked)
                }}
                aria-invalid={!!form.formState.errors.cardCvv}
                aria-describedby={form.formState.errors.cardCvv ? "cardCvv-error" : undefined}
              />
              {form.formState.errors.cardCvv && (
                <p id="cardCvv-error" className="text-sm text-red-500 mt-1">
                  {form.formState.errors.cardCvv.message}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 rounded-lg p-6 space-y-4 border border-violet-200"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img src={pixQRCode || "/placeholder.svg"} alt="QR Code PIX" className="w-48 h-48" />
            </div>
            <p className="text-sm text-gray-600 text-center">Escaneie o QR Code com seu app de pagamento</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Ou copie o código PIX</Label>
            <div className="flex gap-2">
              <Input
                value={pixPaymentCode}
                readOnly
                className="bg-white border-gray-300 text-gray-900 font-mono text-sm"
              />
              <Button
                type="button"
                onClick={copyToClipboard}
                className="bg-violet-500 hover:bg-violet-600 text-white shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
