import { motion } from "framer-motion"

type SkeletonVariant = "card" | "list-item" | "text" | "image" | "circular" | "analysis-card"

interface SkeletonLoaderProps {
  variant: SkeletonVariant | SkeletonVariant[]
  count?: number
  className?: string
}

const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear",
  },
}

const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <motion.div
    variants={shimmer}
    animate="animate"
    className={`bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] rounded-xl h-64 ${className}`}
  />
)

const SkeletonListItem = ({ className = "" }: { className?: string }) => (
  <motion.div variants={shimmer} animate="animate" className={`space-y-3 p-4 ${className}`}>
    <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-4 rounded w-3/4" />
    <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-4 rounded w-1/2" />
  </motion.div>
)

const SkeletonText = ({ className = "" }: { className?: string }) => (
  <motion.div
    variants={shimmer}
    animate="animate"
    className={`bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-4 rounded ${className}`}
  />
)

const SkeletonImage = ({ className = "" }: { className?: string }) => (
  <motion.div
    variants={shimmer}
    animate="animate"
    className={`bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] rounded-lg aspect-video ${className}`}
  />
)

const SkeletonCircular = ({ size = 40, className = "" }: { size?: number; className?: string }) => (
  <motion.div
    variants={shimmer}
    animate="animate"
    className={`bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] rounded-full ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
  />
)

const SkeletonAnalysisCard = ({ className = "" }: { className?: string }) => (
  <motion.div
    variants={shimmer}
    animate="animate"
    className={`border border-gray-700/50 rounded-xl p-6 space-y-4 ${className}`}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-5 rounded w-1/3" />
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-4 rounded w-2/3" />
      </div>
      <SkeletonCircular size={50} />
    </div>
    <div className="space-y-2">
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-2 rounded w-full" />
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] h-2 rounded w-3/4" />
    </div>
  </motion.div>
)

const variantComponents: Record<SkeletonVariant, (props?: any) => React.ReactElement> = {
  card: SkeletonCard,
  "list-item": SkeletonListItem,
  text: SkeletonText,
  image: SkeletonImage,
  circular: SkeletonCircular,
  "analysis-card": SkeletonAnalysisCard,
}

export default function SkeletonLoader({ variant, count = 1, className = "" }: SkeletonLoaderProps) {
  const variants = Array.isArray(variant) ? variant : [variant]

  return (
    <div className={className}>
      {variants.map((v, idx) => {
        const Component = variantComponents[v]
        return (
          <div key={idx}>
            {[...Array(count)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                <Component />
              </motion.div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// Export individual skeleton components for granular use
export { SkeletonCard, SkeletonListItem, SkeletonText, SkeletonImage, SkeletonCircular, SkeletonAnalysisCard }
