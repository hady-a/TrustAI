import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "../components/UI/IconRenderer"
import { useState, useEffect } from "react"
import { useTheme } from "../contexts/ThemeContext"

export default function Help() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [easterEggClicks, setEasterEggClicks] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const [userStats] = useState({ analyses: 1243, users: 15000, accuracy: 99.2 })

  const features = [
    {
      icon: "🔍",
      title: "Criminal Investigation Analysis",
      description: "Analyze criminal investigations, legal documents, and case files with advanced AI to extract key evidence and patterns.",
    },
    {
      icon: "🎙️",
      title: "Interview Processing",
      description: "Process and analyze interview transcripts, extract insights, and identify critical information with intelligent text analysis.",
    },
    {
      icon: "📊",
      title: "Business Document Review",
      description: "Review business documents, contracts, and reports to identify risks, opportunities, and key metrics.",
    },
  ]

  // Generate particles on mount
  useEffect(() => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.05,
    }))
    setFloatingParticles(particles)
  }, [])

  // Easter egg handler
  useEffect(() => {
    if (easterEggClicks >= 5) {
      setShowEasterEgg(true)
      setTimeout(() => {
        setEasterEggClicks(0)
        setShowEasterEgg(false)
      }, 3000)
    }
  }, [easterEggClicks])

  const contactMethods = [
    { icon: "📧", label: "Email", value: "support@trustai.com", href: "mailto:support@trustai.com" },
    { icon: "📱", label: "Phone", value: "+1 (555) 123-4567", href: "tel:+15551234567" },
    { icon: "💬", label: "Live Chat", value: "Available 24/7", href: "#" },
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-slate-950 via-purple-950 to-slate-950' : 'from-slate-50 via-blue-50 to-slate-50'} relative overflow-hidden`}>
      {/* Floating Particles (Easter Egg) */}
      <AnimatePresence>
        {floatingParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="fixed w-2 h-2 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full pointer-events-none"
            animate={{
              x: [particle.x + "%", particle.x + Math.random() * 20 - 10 + "%"],
              y: [particle.y + "%", particle.y + Math.random() * 30 - 15 + "%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: particle.delay,
            }}
            style={{
              left: particle.x + "%",
              top: particle.y + "%",
            }}
          />
        ))}
      </AnimatePresence>

      {/* Premium animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-cyan-600/20 to-blue-600/10 rounded-full blur-3xl" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tl from-purple-600/25 to-pink-600/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl ${theme === 'dark' ? 'bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent border-b border-purple-500/20' : 'bg-gradient-to-b from-white/80 via-white/40 to-transparent border-b border-indigo-500/20'}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/40 hover:border-purple-500/80 text-purple-200 hover:text-purple-100' : 'bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border border-indigo-500/40 hover:border-indigo-500/80 text-indigo-700 hover:text-indigo-600'} transition-all font-semibold backdrop-blur-xl`}
          >
            <motion.span animate={{ x: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>←</motion.span> Back
          </motion.button>
          <h1 className={`text-2xl font-black bg-gradient-to-r ${theme === 'dark' ? 'from-cyan-400 via-purple-400 to-pink-400' : 'from-indigo-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent`}><Icon emoji="📙" inline={true} />Help & Support</h1>
          <div className="w-24"></div>
        </div>
      </motion.div>

      <div className="relative z-10 pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-6 inline-block"
            >
              <Icon emoji="🤖" size="lg" inline={false} />
            </motion.div>
            <h2 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-4">
              Welcome to TrustAI
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your intelligent analysis platform powered by advanced AI technology
            </p>
          </motion.div>

          {/* Live Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="grid grid-cols-3 gap-4 mb-12"
          >
            {[
              { label: "Documents Analyzed", value: userStats.analyses, suffix: "+", icon: "📄" },
              { label: "Happy Users", value: userStats.users, suffix: "+", icon: "👥" },
              { label: "AI Accuracy", value: userStats.accuracy, suffix: "%", icon: "🎯" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.16 + idx * 0.05 }}
                className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-indigo-500/40 hover:border-indigo-500/70' : 'bg-gradient-to-br from-indigo-100/60 to-blue-100/40 border border-indigo-300/40 hover:border-indigo-400/70'} rounded-xl p-6 text-center transition-all group cursor-pointer`}
                onClick={() => setEasterEggClicks(easterEggClicks + 1)}
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.1 }}
                  className="text-3xl mb-2 group-hover:scale-125 transition-transform"
                >
                  {stat.icon}
                </motion.div>
                <div className={`text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent`}>
                  {stat.value}
                  {stat.suffix}
                </div>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.13 }}
            className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/30 to-blue-900/20 border border-indigo-500/30 hover:border-indigo-500/60' : 'bg-gradient-to-br from-indigo-100/50 to-blue-100/40 border border-indigo-300/40 hover:border-indigo-400/60'} rounded-2xl p-10 mb-12 transition-all`}
          >
            <h3 className={`text-3xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>About TrustAI</h3>
            <div className={`space-y-6 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>
                TrustAI is a cutting-edge artificial intelligence platform designed to revolutionize how professionals analyze, process, and extract insights from complex documents and data. Whether you're working in law enforcement, business, or personnel management, TrustAI provides intelligent solutions that save time and increase accuracy.
              </p>
              <p>
                Built with state-of-the-art machine learning algorithms and natural language processing, TrustAI can understand context, identify patterns, and highlight critical information that might otherwise be missed. Our platform is trusted by organizations worldwide for its reliability, security, and effectiveness.
              </p>
              <p>
                Our mission is to empower professionals with the tools they need to make better, faster decisions. We combine advanced AI technology with intuitive user interfaces to create a platform that's both powerful and easy to use. From analyzing criminal investigations to processing business documents, TrustAI adapts to your needs.
              </p>
              <p>
                With TrustAI, you get:
              </p>
              <ul className="space-y-3 ml-6 list-disc">
                <li><strong>Intelligent Analysis:</strong> Advanced AI algorithms that understand context and meaning</li>
                <li><strong>Fast Processing:</strong> Analyze documents in minutes instead of hours</li>
                <li><strong>High Accuracy:</strong> Reliable results with minimal human error</li>
                <li><strong>Enterprise-Grade Security:</strong> Your data is protected with military-grade encryption</li>
                <li><strong>24/7 Support:</strong> Our expert team is always available to help</li>
                <li><strong>Continuous Updates:</strong> Regular improvements and new features based on user feedback</li>
              </ul>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }} className="mb-12">
            <h3 className={`text-3xl font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 + index * 0.05 }}
                  whileHover={{ y: -15, scale: 1.03 }}
                  className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 hover:border-purple-500/60' : 'bg-gradient-to-br from-purple-100/50 to-pink-100/40 border border-purple-300/40 hover:border-purple-400/60'} rounded-2xl p-8 transition-all group relative overflow-hidden cursor-pointer`}
                >
                  {/* Hover Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  />
                  
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                    className="text-5xl mb-4 relative z-10"
                  >
                    <Icon emoji={feature.icon} size="lg" inline={false} />
                  </motion.div>
                  <h4 className={`text-xl font-bold mb-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h4>
                  <p className={`text-sm leading-relaxed relative z-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
                  
                  {/* Interactive Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-purple-500/30 relative z-10"
                  >
                    <span className="text-xs font-bold text-purple-300">✨ Click to Learn More</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-cyan-900/40 to-emerald-900/20 border border-cyan-500/30 hover:border-cyan-500/60' : 'bg-gradient-to-br from-cyan-100/50 to-emerald-100/40 border border-cyan-300/40 hover:border-cyan-400/60'} rounded-2xl p-10 mb-12 transition-all`}
          >
            <h3 className={`text-3xl font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Get In Touch</h3>
            <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Have questions or need assistance? Our dedicated support team is here to help you succeed with TrustAI.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.label}
                  href={method.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  whileHover={{ scale: 1.08, y: -8 }}
                  whileTap={{ scale: 0.95 }}
                  className={`backdrop-blur-lg ${theme === 'dark' ? 'bg-white/5 border border-cyan-500/30 hover:bg-white/15 hover:border-cyan-500/60' : 'bg-white/40 border border-cyan-300/40 hover:bg-white/60 hover:border-cyan-400/60'} rounded-xl p-6 transition-all text-center group`}
                >
                  {/* Hover Ring Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl border border-cyan-400/0 group-hover:border-cyan-400/30"
                    style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                    className="text-4xl mb-3 relative z-10"
                  >
                    <Icon emoji={method.icon} size="lg" inline={false} />
                  </motion.div>
                  <h4 className={`font-bold mb-2 transition-colors relative z-10 ${theme === 'dark' ? 'text-white group-hover:text-cyan-300' : 'text-gray-900 group-hover:text-cyan-600'}`}>{method.label}</h4>
                  <p className={`font-semibold text-lg relative z-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{method.value}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.33 }}
            className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 hover:border-emerald-500/60' : 'bg-gradient-to-br from-emerald-100/50 to-teal-100/40 border border-emerald-300/40 hover:border-emerald-400/60'} rounded-2xl p-10 transition-all`}
          >
            <h3 className={`text-3xl font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                {
                  q: "What file formats does TrustAI support?",
                  a: "TrustAI supports PDF, DOCX, TXT, images (JPG, PNG), and video files. We're constantly adding support for more formats.",
                },
                {
                  q: "How long does analysis typically take?",
                  a: "Most analyses complete within minutes. Large documents may take longer depending on complexity and file size.",
                },
                {
                  q: "Is my data secure?",
                  a: "Absolutely. TrustAI uses enterprise-grade encryption and complies with all major security standards including GDPR and HIPAA.",
                },
                {
                  q: "Can I use TrustAI offline?",
                  a: "TrustAI requires an internet connection, but we're developing offline capabilities for enterprise customers.",
                },
                {
                  q: "How do I export results from TrustAI?",
                  a: "You can export analysis results in multiple formats including PDF, JSON, and CSV directly from the dashboard.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ x: 5 }}
                  className={`group border-l-4 ${theme === 'dark' ? 'border-emerald-500 hover:border-emerald-400 hover:bg-white/[0.02]' : 'border-emerald-400 hover:border-emerald-600 hover:bg-white/[0.3]'} pl-6 py-4 cursor-pointer px-4 rounded-r-lg transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                      className={`mt-1 text-lg ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}
                    >
                      💡
                    </motion.div>
                    <div className="flex-1">
                      <h4 className={`font-bold mb-2 text-lg transition-colors ${theme === 'dark' ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-700'}`}>{faq.q}</h4>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.63 }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/modes")}
              className={`px-10 py-4 rounded-xl font-bold  text-white shadow-lg hover:shadow-xl transition-all ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'}`}
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Easter Egg Celebration */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="text-9xl"
            >
              🎉
            </motion.div>
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 500,
                  y: (Math.random() - 0.5) * 500,
                  opacity: 0,
                }}
                transition={{ duration: 2 }}
                className="fixed text-5xl pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  marginLeft: "-20px",
                  marginTop: "-20px",
                }}
              >
                {["🚀", "⭐", "💎", "🔥", "✨"][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-4xl font-black text-center text-white"
              >
                <div className="mb-2">You Found the Secret! 🎊</div>
                <div className="text-lg text-cyan-300">You're a TrustAI Pro! 🏆</div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
