'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Array<{ key: string; value: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      const event = response.data;
      
      setName(event.name);
      setDescription(event.description || '');
      setStartDate(event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '');
      setEndDate(event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '');
      
      // Convertir dynamicFields de objeto a array
      const fieldsArray: Array<{ key: string; value: string }> = [];
      if (event.dynamicFields) {
        Object.entries(event.dynamicFields).forEach(([key, value]) => {
          fieldsArray.push({ key, value: String(value) });
        });
      }
      setDynamicFields(fieldsArray);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar evento');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    try {
      const fieldsObj: any = {};
      dynamicFields.forEach((field) => {
        if (field.key) {
          fieldsObj[field.key] = field.value;
        }
      });

      await api.put(`/events/${eventId}`, {
        name,
        description: description || null,
        startDate: startDate || null,
        endDate: endDate || null,
        dynamicFields: fieldsObj,
      });

      router.push(`/dashboard/events/${eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar evento');
    } finally {
      setSaving(false);
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
        }}>Editar Evento</h2>
      </div>

      <div className="card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Nombre del Evento *
            </label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: EtMday"
            />
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
              rows={4}
              placeholder="Descripción del evento..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Fecha de Inicio
              </label>
              <input
                id="startDate"
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endDate">
                Fecha de Fin
              </label>
              <input
                id="endDate"
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
                Agrega campos personalizados para este evento (ej: ubicación, capacidad, tipo, etc.)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

