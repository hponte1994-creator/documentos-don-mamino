'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar sesión');
        setCargando(false);
        return;
      }
      router.push(data.rol === 'ADMIN' ? '/facturas' : '/subir');
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-marca-claro px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-marca-oscuro">Don Mamino</h1>
          <p className="text-sm text-gray-500">Registro de documentos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Usuario</label>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-marca focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-marca focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-marca py-3 font-semibold text-white active:bg-marca-oscuro disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
