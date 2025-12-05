'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

interface EventAttribute {
  id: string;
  name: string;
}

interface Permission {
  id: string;
  userId: string;
  eventAttributeId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  user: User;
  eventAttribute: EventAttribute & { event: { id: string; name: string } };
}

export default function PermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [attributes, setAttributes] = useState<EventAttribute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, usersRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get('/users'),
      ]);

      setAttributes(eventRes.data.attributes);
      setUsers(usersRes.data.filter((u: User) => u.role === 'EMPLOYEE'));

      // Cargar permisos para cada atributo
      const perms: Permission[] = [];
      for (const attr of eventRes.data.attributes) {
        try {
          const permRes = await api.get(`/permissions/attribute/${attr.id}`);
          perms.push(...permRes.data);
        } catch (err) {
          // No hay permisos para este atributo
        }
      }
      setPermissions(perms);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermission = async () => {
    if (!selectedAttribute || !selectedUser) {
      alert('Selecciona un atributo y un usuario');
      return;
    }

    try {
      await api.post('/permissions', {
        userId: selectedUser,
        eventAttributeId: selectedAttribute,
        canCreate: true,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      });

      setSelectedAttribute('');
      setSelectedUser('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear permiso');
    }
  };

  const handleUpdatePermission = async (permissionId: string, field: string, value: boolean) => {
    try {
      const perm = permissions.find((p) => p.id === permissionId);
      if (!perm) return;

      await api.put(`/permissions/${permissionId}`, {
        [field]: value,
      });

      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar permiso');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('¿Estás seguro de eliminar este permiso?')) {
      return;
    }

    try {
      await api.delete(`/permissions/${permissionId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar permiso');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
          style={{ marginBottom: '16px' }}
        >
          ← Volver
        </button>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'white',
          margin: 0,
        }}>Gestionar Permisos</h2>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
          Asignar Nuevo Permiso
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="attribute-select">
              Atributo
            </label>
            <select
              id="attribute-select"
              className="form-select"
              value={selectedAttribute}
              onChange={(e) => setSelectedAttribute(e.target.value)}
            >
              <option value="">Selecciona un atributo</option>
              {attributes.map((attr) => (
                <option key={attr.id} value={attr.id}>
                  {attr.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="user-select">
              Usuario
            </label>
            <select
              id="user-select"
              className="form-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Selecciona un usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleSavePermission} className="btn btn-primary">
            Asignar
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
          Permisos Existentes
        </h3>

        {permissions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#636e72' }}>
            No hay permisos asignados. Asigna permisos para que los empleados puedan ingresar datos.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dfe6e9' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Usuario</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Atributo</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Crear</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Leer</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actualizar</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Eliminar</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.id} style={{ borderBottom: '1px solid #dfe6e9' }}>
                    <td style={{ padding: '12px' }}>{perm.user?.name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{perm.eventAttribute?.name || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perm.canCreate}
                        onChange={(e) => handleUpdatePermission(perm.id, 'canCreate', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perm.canRead}
                        onChange={(e) => handleUpdatePermission(perm.id, 'canRead', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perm.canUpdate}
                        onChange={(e) => handleUpdatePermission(perm.id, 'canUpdate', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perm.canDelete}
                        onChange={(e) => handleUpdatePermission(perm.id, 'canDelete', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeletePermission(perm.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

