import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 relative overflow-hidden bg-gray-50">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top wave */}
          <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: "200px" }}>
            <path d="M0,0 L1440,0 L1440,80 C1200,150 960,40 720,100 C480,160 240,60 0,120 Z" fill="#db0455" opacity="0.06" />
          </svg>
          <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: "160px" }}>
            <path d="M0,0 L1440,0 L1440,60 C1100,120 800,20 500,80 C200,140 100,40 0,90 Z" fill="#db0455" opacity="0.04" />
          </svg>

          {/* Bottom wave */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: "200px" }}>
            <path d="M0,200 L1440,200 L1440,100 C1200,30 960,160 720,80 C480,0 240,130 0,60 Z" fill="#db0455" opacity="0.06" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: "160px" }}>
            <path d="M0,200 L1440,200 L1440,120 C1100,60 800,180 500,100 C200,20 100,150 0,80 Z" fill="#db0455" opacity="0.04" />
          </svg>

          {/* Floating circles */}
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-unamad/[0.03] blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-unamad/[0.04] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-unamad/[0.02] blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
