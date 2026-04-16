"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LogIn, BookOpen, KeyRound, LogOut, ChevronDown, Shield, Menu, X,
} from "lucide-react"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/#cursos", label: "Capacitacion", isAnchor: true },
  { href: "/cursos", label: "Cursos" },
  { href: "/certificados", label: "Certificados" },
]

export function PublicHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const profileRef = useRef(null)

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const userName = session?.user?.name || session?.user?.email || ""
  const userEmail = session?.user?.email || ""
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin"

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/img/logo.png" alt="UNAMAD" className="h-10 w-10 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">Universidad Nacional Amazonica</p>
              <p className="text-xs text-gray-500">de Madre de Dios</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) =>
              link.isAnchor ? (
                <a key={link.href} href={link.href} className="text-sm font-medium text-gray-700 hover:text-unamad transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors ${pathname === link.href ? "text-unamad" : "text-gray-700 hover:text-unamad"}`}>
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Profile / Login */}
            {session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-unamad text-white text-xs font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-800 leading-tight max-w-[140px] truncate">{userName}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{isAdmin ? "Administrador" : "Usuario"}</p>
                  </div>
                  <ChevronDown className={`hidden sm:block h-4 w-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/mis-cursos" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <BookOpen className="h-4 w-4 text-gray-400" />Mis Cursos
                      </Link>
                      <Link href="/auth/cambiar-contrasena" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <KeyRound className="h-4 w-4 text-gray-400" />Cambiar contrasena
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Shield className="h-4 w-4 text-gray-400" />Panel administrativo
                        </Link>
                      )}
                    </div>
                    <div className="border-t py-1">
                      <button onClick={() => { setProfileOpen(false); signOut({ callbackUrl: "/" }) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full cursor-pointer">
                        <LogOut className="h-4 w-4" />Cerrar sesion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-2 bg-unamad text-white px-4 py-2 rounded-lg font-medium hover:bg-unamad-dark transition-all text-sm">
                <LogIn className="h-4 w-4" />Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) =>
              link.isAnchor ? (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-unamad transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === link.href ? "bg-unamad-light text-unamad" : "text-gray-700 hover:bg-gray-50 hover:text-unamad"}`}>
                  {link.label}
                </Link>
              )
            )}
            {session && (
              <>
                <div className="border-t my-2" />
                <Link href="/mis-cursos" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <BookOpen className="h-4 w-4 text-gray-400" />Mis Cursos
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
