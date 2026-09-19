'use client';

import { useState } from 'react';

type Tienda = { id: string; nombre: string };
type Usuario = {
  id: string;
  username: string;
  nombre: string;
  rol: 'ADMIN' | 'COLABORADOR';
  activo: boolean;
  tiendaId: string | null;
};

export default function UsuariosClient({ usuariosIniciales, tiendasIniciales }: { usuariosIniciales: Usuario[]; tiendasIniciales: Tienda[] }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [tiendas, setTiendas] = useState(tiendasIniciales);

  const [nuevoUsername, setNuevoUsername] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'ADMIN' | 'COLABORADOR'>('COLABORADOR');
  const [nuevaTienda, setNuevaTienda] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  const [nombreTienda, setNombreTienda] = useState('');

  async function recargarUsuarios() {
    const res = await fetch('/api/usuarios');
    if (res.ok) setUsuarios(await res.json());
  }

  async function crearUsuario() {
    setCreando(true);
    setError('');
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: nuevoUsername, nombre: nuevoNombre, password: nuevaPassword, rol: nuevoRol, tiendaId: nuevaTienda || null }),
    });
    setCreando(false);
    if (res.ok) {
      setNuevoUsername('');
      setNuevoNombre('');
      setNuevaPassword('');
      setNuevoRol('COLABORADOR');
      setNuevaTienda('');
      await recargarUsuarios();
    } else {
      setError((await res.json()).error || 'No se pudo crear el usuario');
    }
  }

  async function toggleActivo(u: Usuario) {
    await fetch(`/api/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: u.nombre, rol: u.rol, tiendaId: u.tiendaId, activo: !u.activo }),
    });
    await recargarUsuarios();
  }

  async function crearTienda() {
    if (!nombreTienda.trim()) return;
    const res = await fetch('/api/tiendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombreTienda }),
    });
    if (res.ok) {
      setNombreTienda('');
      const listado = await fetch('/api/tiendas');
      setTiendas(await listado.json());
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-marca-oscuro">Usuarios</h1>

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-600">Nuevo usuario</p>
        <div className="flex flex-wrap gap-2">
          <input placeholder="usuario" value={nuevoUsername} onChange={(e) => setNuevoUsername(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input placeholder="Nombre completo" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input type="password" placeholder="Contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as any)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="COLABORADOR">Colaborador</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <select value={nuevaTienda} onChange={(e) => setNuevaTienda(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Sin tienda</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <button onClick={crearUsuario} disabled={creando || !nuevoUsername || !nuevoNombre || !nuevaPassword} className="rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            Crear
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-600">Tiendas</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {tiendas.map((t) => (
            <span key={t.id} className="rounded-full bg-marca-claro px-3 py-1 text-xs text-marca-oscuro">{t.nombre}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input placeholder="Nombre de tienda nueva" value={nombreTienda} onChange={(e) => setNombreTienda(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button onClick={crearTienda} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white">Agregar tienda</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-marca-claro text-left text-marca-oscuro">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Tienda</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2">{u.nombre}</td>
                <td className="px-3 py-2">{u.rol === 'ADMIN' ? 'Administrador' : 'Colaborador'}</td>
                <td className="px-3 py-2">{tiendas.find((t) => t.id === u.tiendaId)?.nombre || '-'}</td>
                <td className="px-3 py-2">{u.activo ? <span className="text-green-700">Activo</span> : <span className="text-gray-400">Inactivo</span>}</td>
                <td className="px-3 py-2">
                  <button onClick={() => toggleActivo(u)} className="text-xs font-semibold text-marca underline">
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
