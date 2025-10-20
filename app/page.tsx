import { AuroraForm } from "@/components/aurora-form"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden py-12 px-4 pb-20">
      <div className="fixed inset-0 -z-10 bg-gray-50">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/90 via-cyan-100/95 via-violet-100/90 to-pink-100/85" />

        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-300/70 rounded-full blur-[140px] animate-aurora-shimmer" />
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-cyan-300/70 rounded-full blur-[130px] animate-aurora-float [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 w-[480px] h-[480px] bg-violet-400/70 rounded-full blur-[135px] animate-aurora-shimmer [animation-delay:1.5s]" />
        <div className="absolute bottom-1/4 left-1/3 w-[420px] h-[420px] bg-purple-300/70 rounded-full blur-[125px] animate-aurora-float [animation-delay:2s]" />
        <div className="absolute bottom-0 right-1/3 w-[460px] h-[460px] bg-pink-300/70 rounded-full blur-[130px] animate-aurora-shimmer [animation-delay:3s]" />
        <div className="absolute top-1/3 right-1/2 w-[400px] h-[400px] bg-teal-300/60 rounded-full blur-[120px] animate-aurora-float [animation-delay:2.5s]" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(167,243,208,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(167,243,208,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="container mx-auto relative">
        <AuroraForm />
      </div>

      <footer className="relative mt-12 text-center">
        <p className="text-sm text-gray-600 font-medium">
          Todos os direitos reservados{" "}
          <a
            href="https://www.sparda.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-cyan-600 transition-colors font-semibold"
          >
            www.sparda.dev
          </a>
        </p>
      </footer>
    </main>
  )
}
