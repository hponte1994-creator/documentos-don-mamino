'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ENLACES = [
  { href: '/facturas', etiqueta: 'Facturas' },
  { href: '/notas-credito', etiqueta: 'Notas de Crédito' },
  { href: '/guias', etiqueta: 'Guías' },
  { href: '/ordenes-compra', etiqueta: 'Órdenes de Compra' },
  { href: '/homologacion', etiqueta: 'Por Homologar' },
  { href: '/productos', etiqueta: 'Maestro Productos' },
  { href: '/usuarios', etiqueta: 'Usuarios' },
  { href: '/exportar', etiqueta: 'Exportar' },
];

export default function BarraAdmin({ nombreUsuario }: { nombreUsuario: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-marca text-white shadow">
      <div className="flex items-center justify-between px-4 py-2">
        <div>
          <p className="text-sm font-bold">Don Mamino</p>
          <p className="text-xs text-marca-claro">{nombreUsuario}</p>
        </div>
        <button onClick={salir} className="rounded-lg bg-marca-oscuro px-3 py-1.5 text-xs font-semibold">
          Salir
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-marca-oscuro/40 px-2 pb-1">
        {ENLACES.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium ${
              pathname.startsWith(enlace.href) ? 'bg-white text-marca-oscuro' : 'text-marca-claro'
            }`}
          >
            {enlace.etiqueta}
          </Link>
        ))}
      </nav>
    </header>
  );
}
