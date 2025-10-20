"use client"

import type { UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { MapPin, Home, Hash } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "@/lib/form-types"
import { maskCEP, fetchAddressByCEP } from "@/lib/form-utils"

interface AddressStepProps {
  form: UseFormReturn<FormData>
  onAddToast: (message: string, type: "success" | "error" | "info") => void
}

export function AddressStep({ form, onAddToast }: AddressStepProps) {
  const [loadingCEP, setLoadingCEP] = useState(false)

  const handleCEPBlur = async () => {
    const cep = form.getValues("cep")
    if (cep && cep.length === 9) {
      setLoadingCEP(true)
      const address = await fetchAddressByCEP(cep)
      setLoadingCEP(false)

      if (address) {
        form.setValue("street", address.logradouro)
        form.setValue("neighborhood", address.bairro)
        form.setValue("city", address.localidade)
        form.setValue("state", address.uf)
        onAddToast("Endereço encontrado!", "success")
      } else {
        onAddToast("CEP não encontrado", "error")
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="cep" className="text-gray-700 font-medium">
          CEP
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          <Input
            id="cep"
            {...form.register("cep")}
            placeholder="12345-678"
            className="pl-10 bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            onChange={(e) => {
              const masked = maskCEP(e.target.value)
              form.setValue("cep", masked)
            }}
            onBlur={handleCEPBlur}
            aria-invalid={!!form.formState.errors.cep}
            aria-describedby={form.formState.errors.cep ? "cep-error" : undefined}
          />
          {loadingCEP && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {form.formState.errors.cep && (
          <p id="cep-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.cep.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="street" className="text-gray-700 font-medium">
          Rua
        </Label>
        <div className="relative">
          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
          <Input
            id="street"
            {...form.register("street")}
            placeholder="Rua das Flores"
            className="pl-10 bg-white border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            aria-invalid={!!form.formState.errors.street}
            aria-describedby={form.formState.errors.street ? "street-error" : undefined}
          />
        </div>
        {form.formState.errors.street && (
          <p id="street-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.street.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number" className="text-gray-700 font-medium">
            Número
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
            <Input
              id="number"
              {...form.register("number")}
              placeholder="123"
              className="pl-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
              aria-invalid={!!form.formState.errors.number}
              aria-describedby={form.formState.errors.number ? "number-error" : undefined}
            />
          </div>
          {form.formState.errors.number && (
            <p id="number-error" className="text-sm text-red-500 mt-1">
              {form.formState.errors.number.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="complement" className="text-gray-700 font-medium">
            Complemento
          </Label>
          <Input
            id="complement"
            {...form.register("complement")}
            placeholder="Apto 45"
            className="bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="neighborhood" className="text-gray-700 font-medium">
          Bairro
        </Label>
        <Input
          id="neighborhood"
          {...form.register("neighborhood")}
          placeholder="Centro"
          className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
          aria-invalid={!!form.formState.errors.neighborhood}
          aria-describedby={form.formState.errors.neighborhood ? "neighborhood-error" : undefined}
        />
        {form.formState.errors.neighborhood && (
          <p id="neighborhood-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.neighborhood.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="text-gray-700 font-medium">
            Cidade
          </Label>
          <Input
            id="city"
            {...form.register("city")}
            placeholder="São Paulo"
            className="bg-white border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            aria-invalid={!!form.formState.errors.city}
            aria-describedby={form.formState.errors.city ? "city-error" : undefined}
          />
          {form.formState.errors.city && (
            <p id="city-error" className="text-sm text-red-500 mt-1">
              {form.formState.errors.city.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="state" className="text-gray-700 font-medium">
            Estado
          </Label>
          <Input
            id="state"
            {...form.register("state")}
            placeholder="SP"
            maxLength={2}
            className="uppercase bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            onChange={(e) => {
              form.setValue("state", e.target.value.toUpperCase())
            }}
            aria-invalid={!!form.formState.errors.state}
            aria-describedby={form.formState.errors.state ? "state-error" : undefined}
          />
          {form.formState.errors.state && (
            <p id="state-error" className="text-sm text-red-500 mt-1">
              {form.formState.errors.state.message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
