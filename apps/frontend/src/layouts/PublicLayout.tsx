import type { ReactNode } from "react"

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] from-slate-50 via-blue-50 to-slate-50">
      {children}
    </div>
  )
}
