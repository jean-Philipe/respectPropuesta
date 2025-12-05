'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser, logout, User } from '@/lib/auth';
import Link from 'next/link';
import '../globals.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Image
              src="/logo_respect.png"
              alt="RESPECT"
              width={200}
              height={50}
              style={{
                height: '50px',
                width: 'auto',
              }}
            />
          </div>

          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link
              href="/dashboard"
              style={{
                textDecoration: 'none',
                color: pathname === '/dashboard' ? '#00a896' : '#636e72',
                fontWeight: pathname === '/dashboard' ? '600' : '400',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
              }}
            >
              Eventos
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/dashboard/providers"
                  style={{
                    textDecoration: 'none',
                    color: pathname === '/dashboard/providers' ? '#00a896' : '#636e72',
                    fontWeight: pathname === '/dashboard/providers' ? '600' : '400',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Proveedores
                </Link>
                <Link
                  href="/dashboard/users"
                  style={{
                    textDecoration: 'none',
                    color: pathname === '/dashboard/users' ? '#00a896' : '#636e72',
                    fontWeight: pathname === '/dashboard/users' ? '600' : '400',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Usuarios
                </Link>
              </>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginLeft: '24px',
              paddingLeft: '24px',
              borderLeft: '1px solid #dfe6e9',
            }}>
              <span style={{ color: '#636e72' }}>{user.name}</span>
              <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-employee'}`}>
                {isAdmin ? 'Admin' : 'Empleado'}
              </span>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
              >
                Salir
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '32px 0',
        background: 'linear-gradient(135deg, #00a896 0%, #008b7a 100%)',
      }}>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}

