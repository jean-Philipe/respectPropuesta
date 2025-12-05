'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { getCurrentUser, User } from '@/lib/auth';

interface Event {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  dynamicFields: any;
  attributes: EventAttribute[];
  providers: Array<{ provider: any }>;
}

interface EventAttribute {
  id: string;
  name: string;
  dataType: string;
  allowImage: boolean;
  description: string | null;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'attributes' | 'providers' | 'data'>('info');

  useEffect(() => {
    fetchEvent();
    fetchUser();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar evento');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const isAdmin = user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card">
        <div className="error-message">
          {error || 'Evento no encontrado'}
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.push('/dashboard')}
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
        }}>{event.name}</h2>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: 'white',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <button
          onClick={() => setActiveTab('info')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'info' ? '#00a896' : 'transparent',
            color: activeTab === 'info' ? 'white' : '#636e72',
            border: 'none',
          }}
        >
          Información
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'attributes' ? '#00a896' : 'transparent',
            color: activeTab === 'attributes' ? 'white' : '#636e72',
            border: 'none',
          }}
        >
          Atributos
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'providers' ? '#00a896' : 'transparent',
            color: activeTab === 'providers' ? 'white' : '#636e72',
            border: 'none',
          }}
        >
          Proveedores
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'data' ? '#00a896' : 'transparent',
            color: activeTab === 'data' ? 'white' : '#636e72',
            border: 'none',
          }}
        >
          Datos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="card">
          <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700' }}>
            Información del Evento
          </h3>

          {event.description && (
            <div style={{ marginBottom: '20px' }}>
              <strong>Descripción:</strong>
              <p style={{ marginTop: '8px', color: '#636e72' }}>{event.description}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {event.startDate && (
              <div>
                <strong>Fecha de Inicio:</strong>
                <p style={{ marginTop: '8px', color: '#636e72' }}>
                  {new Date(event.startDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {event.endDate && (
              <div>
                <strong>Fecha de Fin:</strong>
                <p style={{ marginTop: '8px', color: '#636e72' }}>
                  {new Date(event.endDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {Object.keys(event.dynamicFields || {}).length > 0 && (
            <div>
              <strong>Campos Personalizados:</strong>
              <div style={{ marginTop: '12px' }}>
                {Object.entries(event.dynamicFields).map(([key, value]) => (
                  <div key={key} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #dfe6e9' }}>
              <button
                onClick={() => router.push(`/dashboard/events/${eventId}/edit`)}
                className="btn btn-primary"
              >
                Editar Evento
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attributes' && (
        <AttributesTab eventId={eventId} attributes={event.attributes} isAdmin={isAdmin} onRefresh={fetchEvent} />
      )}

      {activeTab === 'providers' && (
        <ProvidersTab eventId={eventId} providers={event.providers} isAdmin={isAdmin} onRefresh={fetchEvent} />
      )}

      {activeTab === 'data' && (
        <DataTab eventId={eventId} attributes={event.attributes} />
      )}

      {isAdmin && (
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => router.push(`/dashboard/events/${eventId}/permissions`)}
            className="btn btn-primary"
          >
            Gestionar Permisos
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para la pestaña de atributos
function AttributesTab({ eventId, attributes, isAdmin, onRefresh }: any) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('TEXT');
  const [allowImage, setAllowImage] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/events/${eventId}/attributes`, {
        name,
        dataType,
        allowImage,
        description: description || null,
      });
      setShowModal(false);
      setName('');
      setDataType('TEXT');
      setAllowImage(false);
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear atributo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attributeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este atributo? Se eliminarán todos los datos asociados.')) {
      return;
    }

    try {
      await api.delete(`/events/attributes/${attributeId}`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar atributo');
    }
  };

  return (
    <div>
      {isAdmin && (
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Agregar Atributo
          </button>
        </div>
      )}

      {attributes.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#636e72' }}>
            No hay atributos definidos. {isAdmin && 'Agrega atributos para comenzar a recopilar datos.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {attributes.map((attr: EventAttribute) => (
            <div key={attr.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                    {attr.name}
                  </h4>
                  {attr.description && (
                    <p style={{ color: '#636e72', marginBottom: '12px' }}>{attr.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      color: '#636e72',
                    }}>
                      Tipo: {attr.dataType}
                    </span>
                    {attr.allowImage && (
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: '#e8f5e9',
                        borderRadius: '4px',
                        color: '#00b894',
                      }}>
                        Permite imágenes
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(attr.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Atributo</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="attr-name">
                  Nombre del Atributo *
                </label>
                <input
                  id="attr-name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: generadores, camiones, baños"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="data-type">
                  Tipo de Dato *
                </label>
                <select
                  id="data-type"
                  className="form-select"
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  required
                >
                  <option value="TEXT">Texto</option>
                  <option value="NUMBER">Número</option>
                  <option value="DATE">Fecha</option>
                  <option value="BOOLEAN">Booleano</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Descripción
                </label>
                <textarea
                  id="description"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descripción del atributo..."
                />
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    id="allow-image"
                    type="checkbox"
                    className="checkbox"
                    checked={allowImage}
                    onChange={(e) => setAllowImage(e.target.checked)}
                  />
                  <label htmlFor="allow-image" className="form-label" style={{ margin: 0 }}>
                    Permitir subir imágenes
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Atributo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la pestaña de proveedores
function ProvidersTab({ eventId, providers, isAdmin, onRefresh }: any) {
  const [showModal, setShowModal] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await api.get('/providers');
      setAllProviders(response.data);
    } catch (err: any) {
      console.error('Error cargando proveedores:', err);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/events/${eventId}/providers`, { providerId });
      setShowModal(false);
      setProviderId('');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al agregar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor del evento?')) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}/providers/${providerId}`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar proveedor');
    }
  };

  return (
    <div>
      {isAdmin && (
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Agregar Proveedor
          </button>
        </div>
      )}

      {providers.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#636e72' }}>
            No hay proveedores asociados. {isAdmin && 'Agrega proveedores al evento.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {providers.map((ep: any) => (
            <div key={ep.provider.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                    {ep.provider.name}
                  </h4>
                  {ep.provider.email && (
                    <p style={{ color: '#636e72', marginBottom: '4px' }}>
                      📧 {ep.provider.email}
                    </p>
                  )}
                  {ep.provider.phone && (
                    <p style={{ color: '#636e72', marginBottom: '4px' }}>
                      📞 {ep.provider.phone}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveProvider(ep.provider.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Proveedor</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleAddProvider}>
              <div className="form-group">
                <label className="form-label" htmlFor="provider">
                  Seleccionar Proveedor *
                </label>
                <select
                  id="provider"
                  className="form-select"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {allProviders.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Agregando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la pestaña de datos
function DataTab({ eventId, attributes }: any) {
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAttribute) {
      fetchData();
    }
  }, [selectedAttribute]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/event-data/attribute/${selectedAttribute}`);
      setData(response.data);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (attributes.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#636e72' }}>
          No hay atributos definidos. Define atributos para comenzar a ingresar datos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="form-label" htmlFor="attribute-select">
          Seleccionar Atributo
        </label>
        <select
          id="attribute-select"
          className="form-select"
          value={selectedAttribute}
          onChange={(e) => setSelectedAttribute(e.target.value)}
        >
          <option value="">Selecciona un atributo</option>
          {attributes.map((attr: any) => (
            <option key={attr.id} value={attr.id}>
              {attr.name}
            </option>
          ))}
        </select>
      </div>

      {selectedAttribute && (
        <DataList
          eventId={eventId}
          attributeId={selectedAttribute}
          data={data}
          loading={loading}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

// Componente para listar datos
function DataList({ eventId, attributeId, data, loading, onRefresh }: any) {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    fetchUser();
    fetchPermissions();
  }, []);

  const fetchUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const fetchPermissions = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;
    try {
      const response = await api.get(`/permissions/user/${currentUser.id}`);
      setPermissions(response.data);
    } catch (err) {
      console.error('Error cargando permisos:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const canCreate = user?.role === 'ADMIN' || permissions.some(
    (p) => p.eventAttributeId === attributeId && p.canCreate
  );

  const canUpdate = (itemUserId: string) => {
    return user?.role === 'ADMIN' || 
           (user?.id === itemUserId && permissions.some(
             (p) => p.eventAttributeId === attributeId && p.canUpdate
           ));
  };

  const canDelete = (itemUserId: string) => {
    return user?.role === 'ADMIN' || 
           (user?.id === itemUserId && permissions.some(
             (p) => p.eventAttributeId === attributeId && p.canDelete
           ));
  };

  const handleDelete = async (dataId: string) => {
    if (!confirm('¿Estás seguro de eliminar este dato?')) {
      return;
    }

    try {
      await api.delete(`/event-data/${dataId}`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar dato');
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
      {canCreate && (
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Ingresar Dato
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#636e72' }}>
            No hay datos ingresados. {canCreate && 'Ingresa el primer dato.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {data.map((item: any) => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '12px' }}>
                    {Object.entries(item.data).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '8px' }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                  {item.comment && (
                    <p style={{ color: '#636e72', marginBottom: '12px', fontStyle: 'italic' }}>
                      {item.comment}
                    </p>
                  )}
                  {item.imageUrl && (
                    <div style={{ marginTop: '12px' }}>
                      <img
                        src={item.imageUrl?.startsWith('http') ? item.imageUrl : item.imageUrl}
                        alt="Dato"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          border: '1px solid #dfe6e9',
                        }}
                      />
                    </div>
                  )}
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #dfe6e9',
                    fontSize: '12px',
                    color: '#636e72',
                  }}>
                    Ingresado por {item.user.name} el {new Date(item.createdAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
                {(canUpdate(item.userId) || canDelete(item.userId)) && (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    {canDelete(item.userId) && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <DataFormModal
          eventId={eventId}
          attributeId={attributeId}
          onClose={() => {
            setShowModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Componente para el formulario de datos
function DataFormModal({ eventId, attributeId, onClose }: any) {
  const [attribute, setAttribute] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttribute();
  }, []);

  const fetchAttribute = async () => {
    try {
      // Obtener el evento completo para encontrar el atributo
      const eventRes = await api.get(`/events/${eventId}`);
      const attr = eventRes.data.attributes.find((a: any) => a.id === attributeId);
      if (attr) {
        setAttribute(attr);
        // Inicializar formData con un campo "valor" por defecto
        setFormData({ valor: '' });
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Para Netlify Functions, usamos JSON en lugar de FormData
      // Las imágenes deben ser URLs, no archivos subidos
      const payload: any = {
        eventId,
        eventAttributeId: attributeId,
        data: formData,
      };
      if (comment) payload.comment = comment;
      // Si hay una imagen, debe ser una URL
      if (image && (image as any).url) {
        payload.imageUrl = (image as any).url;
      }

      await api.post('/event-data', payload);

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear dato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Ingresar Dato</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="data-value">
              Valor *
            </label>
            <input
              id="data-value"
              type="text"
              className="input"
              value={formData.valor || ''}
              onChange={(e) => setFormData({ valor: e.target.value })}
              required
              placeholder="Ingresa el valor"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comment">
              Comentario
            </label>
            <textarea
              id="comment"
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Comentario opcional..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="image">
              URL de Imagen (opcional)
            </label>
            <input
              id="image"
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              onChange={(e) => setImage(e.target.value ? { url: e.target.value } as any : null)}
              className="input"
            />
            <p style={{ fontSize: '12px', color: '#636e72', marginTop: '4px' }}>
              Ingresa la URL de una imagen externa
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
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

