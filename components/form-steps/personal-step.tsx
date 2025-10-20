"use client"

import type { UseFormReturn } from "react-hook-form"
import { motion } from "framer-motion"
import { User, Mail, Lock, Phone, CreditCard, Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "@/lib/form-types"
import {
  maskCPF,
  maskPhone,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  checkEmailAvailability,
} from "@/lib/form-utils"

interface PersonalStepProps {
  form: UseFormReturn<FormData>
  onAddToast: (message: string, type: "success" | "error" | "info") => void
}

export function PersonalStep({ form, onAddToast }: PersonalStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const password = form.watch("password") || ""
  const passwordStrength = calculatePasswordStrength(password)

  useEffect(() => {
    const email = form.watch("email")
    if (email && email.includes("@")) {
      const timer = setTimeout(async () => {
        setEmailChecking(true)
        const isAvailable = await checkEmailAvailability(email)
        setEmailChecking(false)

        if (!isAvailable) {
          form.setError("email", { message: "Este email já está em uso" })
          onAddToast("Email já está em uso", "error")
        } else {
          form.clearErrors("email")
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [form.watch("email")])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="name" className="text-gray-700 font-medium mb-2 block">
          Nome completo
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          <Input
            id="name"
            {...form.register("name")}
            placeholder="João Silva"
            className="pl-10 pr-4 py-3 bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            aria-invalid={!!form.formState.errors.name}
            aria-describedby={form.formState.errors.name ? "name-error" : undefined}
          />
        </div>
        {form.formState.errors.name && (
          <p id="name-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="joao@exemplo.com"
            className="pl-10 pr-4 py-3 bg-white border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? "email-error" : undefined}
          />
          {emailChecking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {form.formState.errors.email && (
          <p id="email-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
          Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
            placeholder="••••••••"
            className="pl-10 pr-10 py-3 bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            aria-invalid={!!form.formState.errors.password}
            aria-describedby="password-strength password-error"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {password && (
          <div id="password-strength" className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= passwordStrength ? getPasswordStrengthColor(passwordStrength) : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600">Força: {getPasswordStrengthLabel(passwordStrength)}</p>
          </div>
        )}
        {form.formState.errors.password && (
          <p id="password-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-gray-700 font-medium mb-2 block">
          Telefone
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="(11) 98765-4321"
            className="pl-10 pr-4 py-3 bg-white border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            onChange={(e) => {
              const masked = maskPhone(e.target.value)
              form.setValue("phone", masked)
            }}
            aria-invalid={!!form.formState.errors.phone}
            aria-describedby={form.formState.errors.phone ? "phone-error" : undefined}
          />
        </div>
        {form.formState.errors.phone && (
          <p id="phone-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="cpf" className="text-gray-700 font-medium mb-2 block">
          CPF
        </Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          <Input
            id="cpf"
            {...form.register("cpf")}
            placeholder="123.456.789-00"
            className="pl-10 pr-4 py-3 bg-white border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
            onChange={(e) => {
              const masked = maskCPF(e.target.value)
              form.setValue("cpf", masked)
            }}
            aria-invalid={!!form.formState.errors.cpf}
            aria-describedby={form.formState.errors.cpf ? "cpf-error" : undefined}
          />
        </div>
        {form.formState.errors.cpf && (
          <p id="cpf-error" className="text-sm text-red-500 mt-1">
            {form.formState.errors.cpf.message}
          </p>
        )}
      </div>
    </motion.div>
  )
}
