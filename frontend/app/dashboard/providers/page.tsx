'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Provider {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dynamicFields: any;
  _count: {
    events: number;
  };
}

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await api.get('/providers');
      setProviders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) {
      return;
    }

    try {
      await api.delete(`/providers/${id}`);
      fetchProviders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar proveedor');
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'white',
          margin: 0,
        }}>Proveedores</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Nuevo Proveedor
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#636e72' }}>
            No hay proveedores creados. Crea tu primer proveedor para comenzar.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }}>
          {providers.map((provider) => (
            <div key={provider.id} className="card">
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '12px',
                color: '#00a896',
              }}>
                {provider.name}
              </h3>
              {provider.email && (
                <p style={{ color: '#636e72', marginBottom: '8px' }}>
                  📧 {provider.email}
                </p>
              )}
              {provider.phone && (
                <p style={{ color: '#636e72', marginBottom: '16px' }}>
                  📞 {provider.phone}
                </p>
              )}
              {Object.keys(provider.dynamicFields || {}).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  {Object.entries(provider.dynamicFields).map(([key, value]) => (
                    <div key={key} style={{
                      fontSize: '14px',
                      color: '#636e72',
                      marginBottom: '4px',
                    }}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #dfe6e9',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: '#636e72',
                }}>
                  {provider._count.events} evento(s)
                </span>
                <button
                  onClick={() => handleDelete(provider.id)}
                  className="btn btn-danger btn-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProviderModal
          onClose={() => {
            setShowModal(false);
            fetchProviders();
          }}
        />
      )}
    </div>
  );
}

function ProviderModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Array<{ key: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { key: '', value: '' }]);
  };

  const removeDynamicField = (index: number) => {
    setDynamicFields(dynamicFields.filter((_, i) => i !== index));
  };

  const updateDynamicField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...dynamicFields];
    updated[index][field] = value;
    setDynamicFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fieldsObj: any = {};
      dynamicFields.forEach((field) => {
        if (field.key) {
          fieldsObj[field.key] = field.value;
        }
      });

      await api.post('/providers', {
        name,
        email: email || null,
        phone: phone || null,
        dynamicFields: fieldsObj,
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Nuevo Proveedor</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Nombre del Proveedor *
            </label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Proveedor de Energía Sostenible"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="proveedor@email.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 123 456 789"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Campos Dinámicos
              </label>
              <button
                type="button"
                onClick={addDynamicField}
                className="btn btn-secondary btn-sm"
              >
                + Agregar Campo
              </button>
            </div>

            {dynamicFields.map((field, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '12px',
                marginBottom: '12px',
                alignItems: 'end',
              }}>
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nombre del campo"
                    value={field.key}
                    onChange={(e) => updateDynamicField(index, 'key', e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Valor"
                    value={field.value}
                    onChange={(e) => updateDynamicField(index, 'value', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDynamicField(index)}
                  className="btn btn-danger btn-sm"
                >
                  ✕
                </button>
              </div>
            ))}

            {dynamicFields.length === 0 && (
              <p style={{ color: '#636e72', fontSize: '14px', fontStyle: 'italic' }}>
                Agrega campos personalizados para este proveedor (ej: especialidad, certificaciones, etc.)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Proveedor'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

