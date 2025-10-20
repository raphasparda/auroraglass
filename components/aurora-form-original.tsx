"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import QRCode from "react-qr-code"

// =============================
// Background literal (leve blur)
// =============================
const BG_URL = "https://raw.githubusercontent.com/raphasparda/LiquiTrack/main/plano%20de%20fundo.svg"

// =============================
// Toast system (leve, sem libs)
// =============================
type ToastType = "info" | "success" | "error"
type ToastItem = { id: number; message: string; type: ToastType }
// default avisa quando usado fora do provider (evita estado inválido)
const ToastContext = React.createContext<(message: string, type?: ToastType) => void>(
  (message: string, type?: ToastType) => {
    console.warn("ToastContext não está provido ainda. Chamado com:", { message, type })
  },
)
const useToast = () => React.useContext(ToastContext)

function Toasts({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  const prefersReduced = useReducedMotion()
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
            className={
              "pointer-events-auto rounded-2xl px-4 py-2 shadow-lg backdrop-blur bg-white/85 border " +
              (t.type === "success"
                ? "border-emerald-300"
                : t.type === "error"
                  ? "border-rose-300"
                  : "border-slate-300")
            }
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-900">{t.message}</span>
              <button onClick={() => onClose(t.id)} className="text-xs underline text-neutral-700 hover:bg-transparent">
                Fechar
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(1)
  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = idRef.current++
    setItems((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2400)
  }, [])
  return (
    <ToastContext.Provider value={add}>
      {children}
      <Toasts items={items} onClose={(id) => setItems((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

// =============================
// Utils (máscaras/validações)
// =============================
const onlyDigits = (v: string) =>
  (v || "")
    .split("")
    .filter((c) => c >= "0" && c <= "9")
    .join("")
const maskCEP = (v: string) => {
  const d = onlyDigits(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}
const maskPhoneBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 10) {
    const p1 = d.slice(0, 2)
    const p2 = d.slice(2, 6)
    const p3 = d.slice(6, 10)
    return [p1 && `(${p1})`, p2, p3 && `-${p3}`].filter(Boolean).join(" ")
  }
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 7)
  const p3 = d.slice(7, 11)
  return [p1 && `(${p1})`, p2, p3 && `-${p3}`].filter(Boolean).join(" ")
}
const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11)
  const a = d.slice(0, 3)
  const b = d.slice(3, 6)
  const c = d.slice(6, 9)
  const e = d.slice(9, 11)
  return [a, b && `.${b}`, c && `.${c}`, e && `-${e}`].filter(Boolean).join("")
}

// CPF check-digit
const isValidCPF = (cpfRaw: string) => {
  const s = onlyDigits(cpfRaw)
  if (s.length !== 11) return false
  if (new Set(s).size === 1) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number.parseInt(s[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  const d1 = calc(9)
  const d2 = calc(10)
  return d1 === Number.parseInt(s[9]) && d2 === Number.parseInt(s[10])
}

// Luhn
const luhn = (num: string) => {
  const s = onlyDigits(num)
  if (s.length < 13 || s.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = s.length - 1; i >= 0; i--) {
    let n = s.charCodeAt(i) - 48
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

// Força de senha
const passwordScore = (pwd: string) => {
  let score = 0
  if (pwd.length >= 8) score += 1
  if (/[A-Z]/.test(pwd)) score += 1
  if (/[a-z]/.test(pwd)) score += 1
  if (/[0-9]/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1
  return Math.min(score, 5)
}
const passwordLabel = (s: number) => (s <= 2 ? "fraca" : s === 3 ? "média" : "forte")

// Pagamento helpers
export type CardBrand = "Visa" | "Mastercard" | "Amex" | "Desconhecida"
export const detectBrand = (digits: string): CardBrand => {
  const d = digits || ""
  if (d.startsWith("4")) return "Visa"
  const prefix2 = d.slice(0, 2)
  const prefix4 = Number(d.slice(0, 4))
  if (["51", "52", "53", "54", "55"].includes(prefix2)) return "Mastercard"
  if (prefix4 >= 2221 && prefix4 <= 2720) return "Mastercard"
  if (d.startsWith("34") || d.startsWith("37")) return "Amex"
  return "Desconhecida"
}
export const formatCardNumber = (value: string, brand?: CardBrand): string => {
  const d = onlyDigits(value).slice(0, 19)
  const b = brand ?? detectBrand(d)
  if (b === "Amex") {
    const g1 = d.slice(0, 4)
    const g2 = d.slice(4, 10)
    const g3 = d.slice(10, 15)
    return [g1, g2, g3].filter(Boolean).join(" ")
  }
  let out = ""
  for (let i = 0; i < d.length; i++) {
    out += d[i]
    if (i % 4 === 3 && i < d.length - 1) out += " "
  }
  return out
}
export const formatExpiry = (value: string) => {
  const d = onlyDigits(value).slice(0, 4)
  if (d.length <= 2) return d
  return d.slice(0, 2) + "/" + d.slice(2)
}
export const formatCVV = (value: string) => onlyDigits(value).slice(0, 4)
const isExpiryValid = (v: string) => {
  if (typeof v !== "string" || v.length !== 5 || v[2] !== "/") return false
  const mm = Number(v.slice(0, 2))
  const yy = Number(v.slice(3))
  if (!Number.isFinite(mm) || !Number.isFinite(yy) || mm < 1 || mm > 12) return false
  const exp = new Date(2000 + yy, mm - 1, 1)
  const now = new Date()
  const cur = new Date(now.getFullYear(), now.getMonth(), 1)
  return exp >= cur
}

// ViaCEP helper (única definição)
async function fetchViaCEP(
  cepMasked: string,
): Promise<Partial<Record<"street" | "district" | "city" | "state", string>>> {
  const cep = onlyDigits(cepMasked)
  if (cep.length !== 8) return {}
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (!data || data.erro) return {}
    return {
      street: data.logradouro || "",
      district: data.bairro || "",
      city: data.localidade || "",
      state: (data.uf || "").toUpperCase(),
    }
  } catch {
    return {}
  }
}

// =============================
// Schemas Zod (compatível com versões sem .merge após intersection)
// =============================
const personalSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "Mínimo de 8 caracteres."),
  phone: z.string().refine((v) => {
    const d = onlyDigits(v)
    return d.length === 10 || d.length === 11
  }, "Telefone inválido."),
})
const addressSchema = z.object({
  cep: z.string().regex(/^[0-9]{5}-[0-9]{3}$/, "CEP inválido (formato 00000-000)."),
  street: z.string().min(3, "Logradouro obrigatório."),
  number: z.string().min(1, "Número obrigatório."),
  city: z.string().min(2, "Cidade obrigatória."),
  state: z.string().min(2, "UF obrigatória."),
  complement: z.string().optional(),
  district: z.string().optional(),
})

// Combine pessoais + endereço numa base
const personalAddress = personalSchema.merge(addressSchema)

// Branch Cartão (inclui base + discriminador)
const cardBranch = personalAddress.merge(
  z.object({
    paymentMethod: z.literal("card"),
    cardName: z.string().min(3, "Nome no cartão obrigatório."),
    cardNumber: z.string().refine(luhn, "Número de cartão inválido."),
    expiry: z.string().refine(isExpiryValid, "Validade inválida ou expirada."),
    cvv: z.string().regex(/^[0-9]{3,4}$/, "CVV inválido."),
    // Campos PIX ausentes na branch cartão
    pixType: z.never().optional(),
    pixKey: z.never().optional(),
  }),
)

// Branch PIX (inclui base + discriminador)
const pixBranch = personalAddress.merge(
  z
    .object({
      paymentMethod: z.literal("pix"),
      pixType: z.enum(["email", "cpf", "telefone", "aleatoria"]),
      pixKey: z.string().min(1, "Informe a chave PIX."),
      // Campos Cartão ausentes na branch pix
      cardName: z.never().optional(),
      cardNumber: z.never().optional(),
      expiry: z.never().optional(),
      cvv: z.never().optional(),
    })
    .superRefine((data, ctx) => {
      const key = data.pixKey.trim()
      if (data.pixType === "email") {
        const ok = /.+@.+\..+/.test(key)
        if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "E-mail inválido", path: ["pixKey"] })
      } else if (data.pixType === "telefone") {
        const d = onlyDigits(key)
        const ok = d.length === 10 || d.length === 11
        if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefone inválido", path: ["pixKey"] })
      } else if (data.pixType === "cpf") {
        if (!isValidCPF(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF inválido", path: ["pixKey"] })
      } else if (data.pixType === "aleatoria") {
        if (key.length < 8)
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chave aleatória curta", path: ["pixKey"] })
      }
    }),
)

// Discriminated Union final
const formSchema = z.discriminatedUnion("paymentMethod", [cardBranch, pixBranch])

// =============================
// Tipos e constantes (interface ampla para o form)
// =============================
export interface FormValues {
  // pessoais
  fullName: string
  email: string
  password: string
  phone: string
  // endereço
  cep: string
  street: string
  number: string
  city: string
  state: string
  complement?: string
  district?: string
  // pagamento comum
  paymentMethod: "card" | "pix"
  // cartão
  cardName?: string
  cardNumber?: string
  expiry?: string
  cvv?: string
  // pix
  pixType?: "email" | "cpf" | "telefone" | "aleatoria"
  pixKey?: string
}

type StepKey = "personal" | "address" | "payment" | "summary"
const STEPS: StepKey[] = ["personal", "address", "payment", "summary"]
const STEP_FIELDS: Record<Exclude<StepKey, "summary">, (keyof FormValues)[]> = {
  personal: ["fullName", "email", "password", "phone"],
  address: ["cep", "street", "number", "city", "state", "complement", "district"],
  payment: ["paymentMethod", "cardName", "cardNumber", "expiry", "cvv", "pixType", "pixKey"],
}
const STEP_LABELS: Record<StepKey, string> = {
  personal: "Dados pessoais",
  address: "Endereço",
  payment: "Pagamento",
  summary: "Resumo",
}
const LABELS: Record<keyof FormValues, string> = {
  fullName: "Nome completo",
  email: "E-mail",
  password: "Senha",
  phone: "Telefone",
  cep: "CEP",
  street: "Logradouro",
  number: "Número",
  city: "Cidade",
  state: "UF",
  complement: "Complemento",
  district: "Bairro",
  paymentMethod: "Forma de pagamento",
  cardName: "Nome no cartão",
  cardNumber: "Número do cartão",
  expiry: "Validade",
  cvv: "CVV",
  pixType: "Tipo da chave PIX",
  pixKey: "Chave PIX",
}
const SUMMARY_ORDER_BASE: (keyof FormValues)[] = [
  "fullName",
  "email",
  "phone",
  "cep",
  "street",
  "number",
  "city",
  "state",
  "complement",
  "district",
]
const displayValue = (k: keyof FormValues, v: unknown) => {
  if (k === "password") return "••••••••"
  if (k === "cardNumber") {
    const d = onlyDigits(String(v ?? ""))
    return d ? `•••• •••• •••• ${d.slice(-4)}` : ""
  }
  if (k === "cvv") return "•".repeat(Math.min(Math.max(String(v ?? "").length || 3, 3), 4))
  if (k === "paymentMethod") return v === "card" ? "Cartão de crédito" : "PIX"
  if (k === "pixType") {
    const t: any = { email: "E-mail", cpf: "CPF", telefone: "Telefone", aleatoria: "Chave aleatória" }
    return t[String(v) as keyof typeof t] ?? String(v ?? "")
  }
  return String(v ?? "")
}
const DRAFT_KEY = "wizard-draft-v1"

// =============================
// Self-tests (executam no console)
// =============================
;(function runSelfTests() {
  try {
    console.assert(typeof motion?.div === "function", "motion.div disponível")
    console.assert(typeof AnimatePresence === "function", "AnimatePresence disponível")
    console.assert(typeof useReducedMotion === "function", "useReducedMotion disponível")
    console.assert(typeof QRCode === "function", "QRCode componente disponível")
    console.assert(luhn("4111111111111111") === true, "Teste Luhn VISA")
    console.assert(luhn("4111111111111112") === false, "Luhn deve falhar")
    console.assert(detectBrand("4") === "Visa", "Detect brand Visa")
    console.assert(detectBrand("5100") === "Mastercard", "Detect brand MC")
    console.assert(detectBrand("3714") === "Amex", "Detect brand Amex")
    console.assert(formatExpiry("1228") === "12/28", "Format expiry")
    console.assert(maskCEP("12345678") === "12345-678", "Mask CEP")
    console.assert(isValidCPF("529.982.247-25") === true, "CPF válido exemplo")
    console.assert(isValidCPF("00000000000") === false, "CPF inválido repetido")
    console.assert(formatCardNumber("4111111111111111") === "4111 1111 1111 1111", "Fmt card number")
    console.assert(formatCardNumber("371449635398431") === "3714 496353 98431", "Fmt Amex 4-6-5")
    console.assert(formatCVV("12a45") === "1245", "Fmt CVV apenas dígitos")
    console.assert(isExpiryValid("12/50") === true, "Validade futura ok")
    console.assert(isExpiryValid("00/50") === false, "Mês inválido rejeitado")
    console.assert(passwordScore("Aa1!aaaa") >= 4, "Senha forte passa no score")
  } catch {}
})()

// =============================
// Stepper clicável (animação de escala por seleção)
// =============================
function Stepper({ current, onStepClick }: { current: number; onStepClick: (i: number) => void }) {
  const prefersReduced = useReducedMotion()
  return (
    <ol className="mb-4 flex items-center justify-between gap-2" aria-label="Passos do formulário">
      {STEPS.map((key, i) => {
        const active = i === current
        const completed = i < current
        const cls =
          "group w-full flex items-center justify-center gap-2 rounded-2xl px-3 py-2 border " +
          (completed || active
            ? "border-violet-400/60 bg-white/30 text-neutral-900 dark:text-neutral-100"
            : "border-white/40 bg-white/20 text-neutral-700/80 dark:text-neutral-200/80")
        const scale = prefersReduced ? 1 : active ? 1.06 : 0.94
        const bubbleScale = prefersReduced ? 1 : active ? 1.12 : 1
        return (
          <li key={key} className="flex-1">
            <motion.button
              type="button"
              onClick={() => onStepClick(i)}
              aria-current={active ? "step" : undefined}
              className={cls}
              initial={false}
              animate={{ scale, opacity: active ? 1 : 0.95 }}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
              whileHover={prefersReduced ? {} : { scale: active ? 1.08 : 0.97 }}
              whileTap={prefersReduced ? {} : { scale: active ? 1.03 : 0.92 }}
            >
              <motion.span
                className="h-6 w-6 grid place-items-center rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs"
                animate={{ scale: bubbleScale }}
                transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
              >
                {i + 1}
              </motion.span>
              <motion.span
                className="text-xs sm:text-sm capitalize"
                animate={{ fontWeight: active ? 800 : 500 }}
                transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
              >
                {STEP_LABELS[key]}
              </motion.span>
            </motion.button>
          </li>
        )
      })}
    </ol>
  )
}

// =============================
// Field genérico (label + erros)
// =============================
function Field({
  label,
  name,
  input,
  error,
  hint,
}: {
  label: string
  name: string
  input: React.ReactNode
  error?: string
  hint?: string
}) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-800/90 dark:text-neutral-100/90">
        {label}
      </label>
      {React.isValidElement(input)
        ? React.cloneElement(input as any, {
            id: name,
            "aria-invalid": Boolean(error) || undefined,
            "aria-describedby": describedBy,
          })
        : input}
      <AnimatePresence initial={false}>
        {hint ? (
          <motion.p
            id={hintId}
            className="text-xs text-blue-700/80 dark:text-blue-300/80"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            id={errorId}
            className="text-xs text-pink-600 mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

// =============================
// Campos especializados (ícone alinhado)
// =============================
function PasswordField({
  register,
  error,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"]
  error?: string
}) {
  const [show, setShow] = useState(false)
  const [val, setVal] = useState("")
  const s = passwordScore(val)
  const pct = (s / 5) * 100
  const r = register("password")

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="password" className="text-sm font-medium text-neutral-800/90 dark:text-neutral-100/90">
        Senha
      </label>
      <div className="relative">
        <input
          {...r}
          id="password"
          type={show ? "text" : "password"}
          onChange={(e) => {
            r.onChange(e)
            setVal(e.target.value)
          }}
          className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 pr-10 py-2 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-600/80 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all"
          autoComplete="new-password"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "password-error" : undefined}
        />
        <button
          type="button"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={show}
          onClick={() => setShow((p) => !p)}
          className="absolute inset-y-0 right-2 flex items-center justify-center text-neutral-700/70 hover:bg-transparent dark:text-neutral-200/80"
        >
          {show ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
        </button>
      </div>
      <div className="mt-2">
        <div className="h-1 w-full rounded bg-white/40 dark:bg-white/10" />
        <motion.div
          className="h-1 -mt-1 rounded bg-gradient-to-r from-amber-300 via-blue-400 to-violet-500"
          style={{ width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
        <p id="password-error" className="mt-1 text-xs text-neutral-700/80 dark:text-neutral-200/90">
          Força: {passwordLabel(s)} {error ? `• ${error}` : ""}
        </p>
      </div>
    </div>
  )
}

function CVVField({
  register,
  error,
  setValue,
  show,
  setShow,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"]
  error?: string
  setValue: (name: keyof FormValues, value: any, opts?: any) => void
  show: boolean
  setShow: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const r = register("cvv")
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="cvv" className="text-sm font-medium text-neutral-800/90 dark:text-neutral-100/90">
        CVV
      </label>
      <div className="relative">
        <input
          {...r}
          id="cvv"
          type={show ? "text" : "password"}
          inputMode="numeric"
          autoComplete="cc-csc"
          pattern="[0-9]{3,4}"
          onChange={(e) => {
            r.onChange(e)
            const v = onlyDigits(e.target.value).slice(0, 4)
            setValue("cvv", v, { shouldValidate: true })
          }}
          className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 pr-10 py-2 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-600/80 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "cvv-error" : undefined}
        />
        <button
          type="button"
          aria-label={show ? "Ocultar CVV" : "Mostrar CVV"}
          aria-pressed={show}
          onClick={() => setShow((p) => !p)}
          className="absolute inset-y-0 right-2 flex items-center justify-center text-neutral-700/70 hover:bg-transparent dark:text-neutral-200/80"
        >
          {show ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
        </button>
      </div>
      {error ? (
        <p id="cvv-error" className="text-xs text-pink-600 mt-1">
          {error}
        </p>
      ) : null}
    </div>
  )
}

// =============================
// Form principal
// =============================
function WizardForm() {
  const toast = useToast();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [emailCheck, setEmailCheck] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [announce, setAnnounce] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const saveSnapshotRef = useRef("");

  const {
    control,
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<FormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema as unknown as z.ZodType<any>),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      cep: "",
      street: "",
      number: "",
      city: "",
      state: "",
      complement: "",
      district: "",
      paymentMethod: "card",
      // cartão
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
      // pix
      pixType: "email",
      pixKey: "",
    },
  });

  // carregar rascunho
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { values: Partial<FormValues>; step?: number };
        Object.entries(parsed.values).forEach(([k, v]) =>
          setValue(k as keyof FormValues, v as any)
        );
        if (typeof parsed.step === "number") setStep(Math.min(parsed.step, STEPS.length - 1));
      }
    } catch {}
  }, [setValue]);

  // autosave inteligente (debounce + dedupe)
  const values = watch();
  useEffect(() => {
    const publicValues = { ...values } as FormValues;
    delete (publicValues as any).password;
    delete (publicValues as any).cardNumber;
    delete (publicValues as any).cvv;
    const payload = JSON.stringify({ values: publicValues, step });
    if (payload === saveSnapshotRef.current || !isDirty) return;
    const t = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, payload);
      saveSnapshotRef.current = payload;
    }, 500);
    return () => clearTimeout(t);
  }, [values, step, isDirty]);

  // e-mail fake-check
  const checkEmail = async (email: string) => {
    setEmailCheck("checking");
    toast("Verificando e-mail...", "info");
    await new Promise((r) => setTimeout(r, 700));
    if (email.trim().toLowerCase() === "taken@example.com") {
      setEmailCheck("taken");
      setError("email", { type: "manual", message: "E-mail já cadastrado." });
      toast("Este e-mail já está em uso.", "error");
    } else {
      setEmailCheck("ok");
      toast("E-mail disponível.", "success");
    }
  };

  // via CEP
  const handleCepBlur = async (cepMasked: string) => {
    const data = await fetchViaCEP(cepMasked);
    if (!data || Object.keys(data).length === 0) { toast("CEP não encontrado.", "error"); return; }
    if (data.street !== undefined) setValue("street", data.street, { shouldValidate: true });
    if (data.district !== undefined) setValue("district", data.district, { shouldValidate: true });
    if (data.city !== undefined) setValue("city", data.city, { shouldValidate: true });
    if (data.state !== undefined) setValue("state", data.state.toUpperCase(), { shouldValidate: true });
    toast("Endereço preenchido pelo CEP.", "success");
  };

  // foco no primeiro erro da etapa
  const focusFirstInStep = (targetStep: number) => {
    const key = STEPS[targetStep];
    if (key === "summary") return;
    const fields = key === "payment"
      ? (values.paymentMethod === "pix" ? ["paymentMethod","pixType","pixKey"] : ["paymentMethod","cardName","cardNumber","expiry","cvv"])
      : STEP_FIELDS[key];
    const firstErrorKey = fields.find((f) => (errors as any)[f]);
    const target = (firstErrorKey ?? fields[0]) as string;
    const el = document.getElementById(target);
    if (el) (el as HTMLElement).focus();
  };

  const goNext = async () => {
    const key = STEPS[step];
    if (key === "summary") return;
    const fields = key === "payment"
      ? (values.paymentMethod === "pix" ? ["paymentMethod","pixType","pixKey"] : ["paymentMethod","cardName","cardNumber","expiry","cvv"])
      : STEP_FIELDS[key];
    const ok = await trigger(fields as any);
    if (!ok) { focusFirstInStep(step); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  useEffect(() => {
    setAnnounce(`Etapa ${step + 1} de ${STEPS.length}: ${STEP_LABELS[STEPS[step]]}`);
    focusFirstInStep(step);
  }, [step, errors]);

  const progress = useMemo(() => (step / (STEPS.length - 1)) * 100, [step]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === "TEXTAREA") return;
    if ((target as HTMLInputElement).type === "submit") return;
    e.preventDefault();
    if (e.shiftKey) {
      goPrev();
    } else {
      if (STEPS[step] === "summary") {
        handleSubmit(onSubmit)();
      } else {
        goNext();
      }
    }
  };

  const goToStep = async (target: number) => {
    if (target === step) return;
    if (target > step) {
      for (let i = 0; i < target && i < STEPS.length - 1; i++) {
        const key = STEPS[i];
        const fields = key === "payment"
          ? (values.paymentMethod === "pix" ? ["paymentMethod","pixType","pixKey"] : ["paymentMethod","cardName","cardNumber","expiry","cvv"])
          : STEP_FIELDS[key];
        const ok = await trigger(fields as any);
        if (!ok) { setStep(i); focusFirstInStep(i); toast("Preencha os campos pendentes antes de avançar.", "error"); return; }
      }
    }
    setStep(target);
  };

  // envio
  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, 900));
    toast("Cadastro confirmado!", "success");
    console.log("Submitted:", data);
    localStorage.removeItem(DRAFT_KEY);
  };

  // formatações dinâmicas
  const cardDigits = onlyDigits(values.cardNumber ?? "");
  const cardBrand = useMemo(() => detectBrand(cardDigits), [cardDigits]);
  const cardBrandText = useMemo(() => (cardBrand && cardBrand !== "Desconhecida" ? `Bandeira: ${cardBrand}` : undefined), [cardBrand]);

  // PIX payload fake (copia e cola)
  const pixPayload = useMemo(() => {
    if (values.paymentMethod !== "pix") return "";
    const key = values.pixKey || "";
    return `000201BR.GOV.BCB.PIX|CHAVE=${key}|VALOR=0.00|MSG=AuroraFlow`;
  }, [values.paymentMethod, values.pixKey]);

  // chaves do resumo (evita sintaxe complexa inline)
  const summaryKeys = useMemo(() => {
    const base = [...SUMMARY_ORDER_BASE];
    if (values.paymentMethod === "card") {
      return [...base, "paymentMethod", "cardName", "cardNumber", "expiry", "cvv"] as (keyof FormValues)[];
    }
    return [...base, "paymentMethod", "pixType", "pixKey"] as (keyof FormValues)[];
  }, [values.paymentMethod]);

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={handleKeyDown}
      aria-labelledby="wizard-title"
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
      className="mx-auto max-w-2xl rounded-3xl border border-white/40 dark:border-white/20 p-8 shadow-2xl backdrop-blur-xl bg-white/30 dark:bg-white/10 ring-1 ring-white/40"
    >
      <motion.h1
        id="wizard-title"
        className="text-3xl font-extrabold mb-5 text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-blue-600 to-amber-500"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
      >
        Aurora Flow
      </motion.h1>

      <Stepper current={step} onStepClick={goToStep} />

      {/* Progresso */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-white/40 dark:bg-white/10" aria-hidden />
        <motion.div
          className="h-2 -mt-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: prefersReduced ? 0 : 0.3, ease: "easeOut" }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Progresso do formulário"
        />
        <p className="mt-2 text-sm text-neutral-800/90 dark:text-neutral-100/90">
          Etapa {step + 1} de {STEPS.length}
        </p>
      </div>

      <div className="sr-only" aria-live="polite">{announce}</div>

      {/* Erros da etapa (resumo clicável) */}
      {(() => {
        const key = STEPS[step];
        const fields = key === "summary" ? [] : key === "payment"
          ? (values.paymentMethod === "pix" ? ["paymentMethod","pixType","pixKey"] : ["paymentMethod","cardName","cardNumber","expiry","cvv"]) : STEP_FIELDS[key];
        const errs = fields.filter((f) => (errors as any)[f]);
        if (!errs.length) return null;
        return (
          <div className="mb-4 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3 text-sm text-rose-800" role="alert" aria-live="polite">
            <p className="font-medium mb-1">
              Encontramos {errs.length} {errs.length > 1 ? "erros" : "erro"} nesta etapa:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {errs.map((f) => (
                <li key={String(f)}>
                  <button type="button" className="underline" onClick={() => document.getElementById(String(f))?.focus()}>
                    {LABELS[f as keyof FormValues]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <AnimatePresence mode="wait" initial={false}>
        {STEPS[step] === "personal" && (
          <motion.section
            key="personal"
            className="space-y-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
          >
            <Field
              label="Nome completo"
              name="fullName"
              error={errors.fullName?.message}
              input={
                <input
                  {...register("fullName")}
                  type="text"
                  className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-600/80 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all"
                  autoComplete="name"
                />
              }
            />
            <Field
              label="E-mail"
              name="email"
              error={errors.email?.message}
              hint={
                emailCheck === "checking"
                  ? "Verificando e-mail..."
                  : emailCheck === "ok"
                  ? "E-mail disponível."
                  : emailCheck === "taken"
                  ? "Este e-mail já está em uso."
                  : undefined
              }
              input={
                <input
                  {...register("email", { onBlur: (e) => checkEmail(e.target.value) })}
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-600/80 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all"
                  aria-busy={emailCheck === "checking"}
                />
              }
            />
            <PasswordField register={register} error={errors.password?.message} />
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Field
                  label="Telefone"
                  name="phone"
                  error={errors.phone?.message}
                  input={
                    <input
                      type="tel"
                      inputMode="tel"
                      className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-600/80 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(maskPhoneBR(e.target.value))}
                      onBlur={field.onBlur}
                    />
                  }
                />
              )}
            />
          </motion.section>
        )}

        {STEPS[step] === "address" && (
          <motion.section
            key="address"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
          >
            <Controller
              control={control}
              name="cep"
              render={({ field }) => (
                <Field
                  label="CEP"
                  name="cep"
                  error={errors.cep?.message}
                  input={
                    <input
                      inputMode="numeric"
                      pattern="[0-9]{5}-[0-9]{3}"
                      className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(maskCEP(e.target.value))}
                      onBlur={(e) => { field.onBlur(); handleCepBlur(e.target.value); }}
                    />
                  }
                />
              )}
            />
            <Field
              label="Logradouro"
              name="street"
              error={errors.street?.message}
              input={<input {...register("street")} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all" />}
            />
            <Field
              label="Número"
              name="number"
              error={errors.number?.message}
              input={<input {...register("number")} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all" />}
            />
            <Field
              label="Complemento"
              name="complement"
              error={errors.complement?.message}
              input={<input {...register("complement")} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all" />}
            />
            <Field
              label="Bairro"
              name="district"
              error={errors.district?.message}
              input={<input {...register("district")} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all" />}
            />
            <Field
              label="Cidade"
              name="city"
              error={errors.city?.message}
              input={<input {...register("city")} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-white/20 px-4 py-2 outline-none text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all" />}
            />
            <Field
              label="UF"
              name="state"
              error={errors.state?.message}
              input={<input {...register("state")} maxLength={2} onChange={(e) => setValue("state", e.target.value.toUpperCase(), { shouldValidate: true })} className="w-full uppercase rounded-2xl border border-white\
