"use client"

import type { UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { FormData } from "@/lib/form-types"
import { generatePixQRCode } from "@/lib/form-utils"

interface SummaryStepProps {
  form: UseFormReturn<FormData>
}

export function SummaryStep({ form }: SummaryStepProps) {
  const data = form.getValues()
  const [qrCode, setQrCode] = useState<string>("")

  useEffect(() => {
    if (data.paymentMethod === "pix" && data.pixKey) {
      setQrCode(generatePixQRCode(data.pixKey))
    }
  }, [data.paymentMethod, data.pixKey])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        <div>
          <h3 className="font-semibold text-emerald-900">Tudo pronto!</h3>
          <p className="text-sm text-emerald-700">Revise suas informações antes de finalizar</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-900">Dados Pessoais</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Nome:</dt>
              <dd className="font-medium text-gray-900">{data.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Email:</dt>
              <dd className="font-medium text-gray-900">{data.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Telefone:</dt>
              <dd className="font-medium text-gray-900">{data.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">CPF:</dt>
              <dd className="font-medium text-gray-900">{data.cpf}</dd>
            </div>
          </dl>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-900">Endereço</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">CEP:</dt>
              <dd className="font-medium text-gray-900">{data.cep}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Rua:</dt>
              <dd className="font-medium text-gray-900">
                {data.street}, {data.number}
              </dd>
            </div>
            {data.complement && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Complemento:</dt>
                <dd className="font-medium text-gray-900">{data.complement}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600">Bairro:</dt>
              <dd className="font-medium text-gray-900">{data.neighborhood}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Cidade/Estado:</dt>
              <dd className="font-medium text-gray-900">
                {data.city} - {data.state}
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-900">Pagamento</h4>
          {data.paymentMethod === "card" ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Método:</dt>
                <dd className="font-medium text-gray-900">Cartão de Crédito</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Número:</dt>
                <dd className="font-medium text-gray-900">**** **** **** {data.cardNumber?.slice(-4)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Nome:</dt>
                <dd className="font-medium text-gray-900">{data.cardName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Validade:</dt>
                <dd className="font-medium text-gray-900">{data.cardExpiry}</dd>
              </div>
            </dl>
          ) : (
            <div className="space-y-2">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Método:</dt>
                  <dd className="font-medium text-gray-900">PIX</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Chave:</dt>
                  <dd className="font-medium text-gray-900">{data.pixKey}</dd>
                </div>
              </dl>
              {qrCode && (
                <div className="flex justify-center mt-4">
                  <img
                    src={qrCode || "/placeholder.svg"}
                    alt="QR Code PIX"
                    className="w-48 h-48 border-2 border-gray-300 rounded-lg bg-white p-2"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
