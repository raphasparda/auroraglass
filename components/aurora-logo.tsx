"use client"

import { motion } from "framer-motion"

export function AuroraLogo() {
  return (
    <div className="flex justify-center items-center py-6 md:py-8 px-4">
      <motion.h1
        className="text-5xl sm:text-6xl md:text-7xl font-bold relative inline-block text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="relative inline-block bg-gradient-to-r from-emerald-400 via-cyan-400 via-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-aurora-flow bg-[length:200%_100%] [text-shadow:0_0_30px_rgba(167,243,208,0.3),0_0_60px_rgba(207,250,254,0.2)]">
          Aurora Glass
        </span>
      </motion.h1>
    </div>
  )
}
