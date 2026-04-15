"use client"

import Link from "next/link"

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/img/logo.png" alt="UNAMAD" className="h-12 w-12 object-contain brightness-0 invert" />
              <div>
                <p className="font-bold text-base">UNAMAD</p>
                <p className="text-gray-400 text-xs leading-tight">Universidad Nacional<br />Amazonica de Madre de Dios</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Formando profesionales con excelencia academica al servicio de la Amazonia y el Peru.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Cursos disponibles</Link></li>
              <li><Link href="/certificados" className="text-gray-400 hover:text-white text-sm transition-colors">Generador de certificados</Link></li>
              <li><Link href="/herramientas" className="text-gray-400 hover:text-white text-sm transition-colors">Herramientas</Link></li>
            </ul>
          </div>

          {/* Access */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Acceso</h4>
            <ul className="space-y-2.5">
              <li><Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition-colors">Iniciar sesion</Link></li>
              <li><Link href="/auth/register" className="text-gray-400 hover:text-white text-sm transition-colors">Registrarse</Link></li>
              <li><Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">Panel administrativo</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Contacto</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 shrink-0 text-unamad" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Av. Jorge Chavez 1160, Puerto Maldonado
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-unamad" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                capacitacion@unamad.edu.pe
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-unamad" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                (082) 571-046
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Universidad Nacional Amazonica de Madre de Dios. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/UNAMAD" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="Facebook">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.youtube.com/@unamadoficial" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="YouTube">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@unamad_oficial" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="TikTok">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
