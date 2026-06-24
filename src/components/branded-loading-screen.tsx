"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function BrandedLoadingScreen({ fixed = false }: { fixed?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`${fixed ? "fixed" : "min-h-screen"} inset-0 z-[100] grid place-items-center overflow-hidden bg-[#f4f1e9] text-[#22354a]`}
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(210,171,91,0.22),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(0,128,145,0.16),transparent_32%)]" />
      <div className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(35,53,74,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(35,53,74,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />

      <motion.div
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -10, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="grid w-[min(92vw,440px)] place-items-center rounded-[1.75rem] border border-white/70 bg-white/88 px-7 py-8 text-center shadow-[0_32px_90px_-40px_rgba(35,53,74,0.65)] backdrop-blur-xl sm:px-10 sm:py-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.035, 1] }}
          transition={{ duration: 1.45, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid h-28 w-28 place-items-center rounded-3xl bg-white p-3 shadow-[0_18px_35px_-20px_rgba(35,53,74,0.55)]"
        >
          <span className="absolute inset-[-14px] -z-10 rounded-[2rem] bg-[radial-gradient(circle,rgba(210,171,91,0.36),transparent_68%)] blur-md" />
          <Image
            src="/iraq-takaful-logo.svg"
            alt="Iraq Takaful Insurance Company logo"
            width={104}
            height={104}
            priority
            className="h-full w-full object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.28 }}
          className="mt-6"
        >
          <p className="text-3xl font-black tracking-tight text-[#22354a]">TRINSU</p>
          <p className="mt-2 text-sm font-semibold text-[#0b7f91]">Travel Insurance Management System</p>
          <p className="mt-4 text-base font-bold text-[#a77d30]">جاري التحميل...</p>
        </motion.div>

        <div className="mt-5 flex items-center gap-1.5">
          <span className="route-loader-dot" />
          <span className="route-loader-dot" />
          <span className="route-loader-dot" />
        </div>
      </motion.div>
    </motion.div>
  );
}
