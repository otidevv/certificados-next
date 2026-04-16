'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { UserPlus, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  // Extract courseId from redirect like /cursos/abc123
  const courseId = redirectUrl.match(/^\/cursos\/([^/]+)$/)?.[1] || '';
  const [documentType, setDocumentType] = useState('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [paternalSurname, setPaternalSurname] = useState('');
  const [maternalSurname, setMaternalSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-lookup DNI via UNAMAD API
  const lookupDni = useCallback(async (dni) => {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) return;
    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/consulta-dni?dni=${dni}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      if (data.firstName) {
        setFirstName(data.firstName);
        setPaternalSurname(data.paternalSurname);
        setMaternalSurname(data.maternalSurname);
        setLookupDone(true);
      }
    } catch {
      // Silently fail - user fills manually
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  // Trigger lookup when DNI has 8 digits
  useEffect(() => {
    if (documentType !== 'DNI' || documentNumber.length !== 8) {
      setLookupDone(false);
      return;
    }
    const timer = setTimeout(() => lookupDni(documentNumber), 400);
    return () => clearTimeout(timer);
  }, [documentNumber, documentType, lookupDni]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, documentNumber, firstName, paternalSurname, maternalSurname, email, password, courseId: courseId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar usuario');
        return;
      }

      // Auto-login after registration
      const loginResult = await signIn('credentials', { email, password, redirect: false });
      if (loginResult?.error) {
        // Login failed but account was created - send to login page
        router.push('/auth/login?registered=true');
        return;
      }

      // Redirect to course (already enrolled) or home
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/img/logo.png" alt="UNAMAD" className="h-16 w-16 mx-auto mb-3 object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {courseId ? 'Crea tu cuenta y te inscribiremos automáticamente al curso' : 'Regístrate para inscribirte en cursos y capacitaciones'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Tipo y numero de documento */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Tipo documento</Label>
                  <Select value={documentType} onValueChange={(v) => { setDocumentType(v); setDocumentNumber(''); setFirstName(''); setPaternalSurname(''); setMaternalSurname(''); setLookupDone(false); }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="documentNumber">N de documento</Label>
                  <div className="relative">
                    <Input
                      id="documentNumber"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder={documentType === 'DNI' ? '12345678' : 'Numero'}
                      required
                      className={documentType === 'DNI' ? 'pr-8' : ''}
                    />
                    {documentType === 'DNI' && isLookingUp && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {documentType === 'DNI' && lookupDone && !isLookingUp && (
                      <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Nombres */}
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombres</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombres completos" required />
              </div>

              {/* Apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="paternalSurname">Apellido paterno</Label>
                  <Input id="paternalSurname" value={paternalSurname} onChange={(e) => setPaternalSurname(e.target.value)} placeholder="Apellido paterno" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maternalSurname">Apellido materno</Label>
                  <Input id="maternalSurname" value={maternalSurname} onChange={(e) => setMaternalSurname(e.target.value)} placeholder="Apellido materno" required />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caracteres" required className="pr-9" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetir" required className="pr-9" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-unamad hover:bg-unamad-dark cursor-pointer">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrando...</>
                ) : (
                  <><UserPlus className="mr-2 h-4 w-4" />Crear Cuenta</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Ya tienes cuenta? </span>
              <Link href={redirectUrl ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/login'} className="text-unamad font-semibold hover:text-unamad-dark">
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
