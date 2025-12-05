'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Event {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  dynamicFields: any;
  attributes: any[];
  providers: any[];
  _count: {
    eventData: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar eventos');
    } finally {
      setLoading(false);
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
        }}>Eventos</h2>
        <Link href="/dashboard/events/new">
          <button className="btn btn-primary">
            + Nuevo Evento
          </button>
        </Link>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#636e72' }}>
            No hay eventos creados. Crea tu primer evento para comenzar.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }}>
          {events.map((event) => (
            <div key={event.id} className="card" style={{
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
            onClick={() => router.push(`/dashboard/events/${event.id}`)}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '12px',
                color: '#00a896',
              }}>
                {event.name}
              </h3>
              {event.description && (
                <p style={{
                  color: '#636e72',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  {event.description}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}>
                {event.startDate && (
                  <div style={{ fontSize: '14px', color: '#636e72' }}>
                    <strong>Inicio:</strong> {new Date(event.startDate).toLocaleDateString('es-ES')}
                  </div>
                )}
                {event.endDate && (
                  <div style={{ fontSize: '14px', color: '#636e72' }}>
                    <strong>Fin:</strong> {new Date(event.endDate).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #dfe6e9',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: '#636e72',
                  background: '#f8f9fa',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}>
                  {event.attributes.length} atributos
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#636e72',
                  background: '#f8f9fa',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}>
                  {event.providers.length} proveedores
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#636e72',
                  background: '#f8f9fa',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}>
                  {event._count.eventData} datos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

