import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useTheme } from "../contexts/ThemeContext"

export default function Help() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const features = [
    {
      icon: "🔍",
      title: "Criminal Investigation Analysis",
      description: "Analyze case files and suspect interviews to surface evidence, contradictions, and risk signals.",
    },
    {
      icon: "🎙️",
      title: "Interview Processing",
      description: "Process interview transcripts with AI summaries, key-point extraction, and behavioral indicators.",
    },
    {
      icon: "📊",
      title: "Business Document Review",
      description: "Review contracts, reports, and business records to highlight risks and decision-ready insights.",
    },
  ]

  const faqs = [
    {
      q: "What file formats does TrustAI support?",
      a: "PDF, DOCX, TXT, common image formats, and supported media files for analysis workflows.",
    },
    {
      q: "How long does analysis take?",
      a: "Most analyses complete in a few minutes. Large files may take longer depending on complexity.",
    },
    {
      q: "Is data secure?",
      a: "Yes. TrustAI uses encrypted transport and secure processing practices for user data.",
    },
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gradient-to-br dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-center justify-between"
          >
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-indigo-300 bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-white dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              Back
            </button>
            <h1 className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
              Help & Support
            </h1>
            <div className="w-16 sm:w-20" />
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 rounded-2xl border border-indigo-200 bg-white/80 p-6 backdrop-blur sm:p-8 dark:border-indigo-500/20 dark:bg-slate-900/60"
          >
            <h2 className={`mb-3 text-3xl font-extrabold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
              Welcome to TrustAI
            </h2>
            <p className={`max-w-3xl ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Find quick guidance for analysis modes, supported workflows, and support channels.
            </p>
          </motion.section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm transition dark:border-indigo-500/20 dark:bg-slate-900/60"
              >
                <div className="mb-2 text-2xl">{feature.icon}</div>
                <h3 className={`mb-2 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>{feature.description}</p>
              </motion.article>
            ))}
          </section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-8 rounded-2xl border border-indigo-200 bg-white/80 p-6 backdrop-blur sm:p-8 dark:border-indigo-500/20 dark:bg-slate-900/60"
          >
            <h3 className={`mb-5 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className={`mb-1 font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{faq.q}</p>
                  <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-indigo-200 bg-white/80 p-6 text-center backdrop-blur sm:p-8 dark:border-indigo-500/20 dark:bg-slate-900/60"
          >
            <h3 className={`mb-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Need More Help?</h3>
            <p className={`mb-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Contact support at support@trustai.com or continue to mode selection.
            </p>
            <button
              onClick={() => navigate("/selectmodes")}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:shadow-indigo-500/40"
            >
              Go To Mode Selection
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
