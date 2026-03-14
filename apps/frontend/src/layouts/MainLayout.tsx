import type { ReactNode } from "react"
import Navbar from "../components/Navbar"

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-stone-50 dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] dark:bg-gradient-to-br pt-20">
        {children}
      </div>
    </>
  )
}
