import { z } from "zod"

// Validation schemas
export const personalSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  phone: z.string().min(14, "Telefone inválido"),
  cpf: z.string().min(14, "CPF inválido"),
})

export const addressSchema = z.object({
  cep: z.string().min(9, "CEP inválido"),
  street: z.string().min(3, "Rua deve ter pelo menos 3 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
})

export const cardPaymentSchema = z.object({
  paymentMethod: z.literal("card"),
  cardNumber: z.string().min(19, "Número do cartão inválido"),
  cardName: z.string().min(3, "Nome no cartão é obrigatório"),
  cardExpiry: z.string().min(5, "Data de validade inválida"),
  cardCvv: z.string().min(3, "CVV inválido"),
})

export const pixPaymentSchema = z.object({
  paymentMethod: z.literal("pix"),
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
})

export const paymentSchema = z.discriminatedUnion("paymentMethod", [cardPaymentSchema, pixPaymentSchema])

export const formSchema = personalSchema.merge(addressSchema).and(paymentSchema)

export type FormData = z.infer<typeof formSchema>
export type PersonalData = z.infer<typeof personalSchema>
export type AddressData = z.infer<typeof addressSchema>
export type PaymentData = z.infer<typeof paymentSchema>

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown"

export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}
