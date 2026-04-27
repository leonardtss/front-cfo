import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { T } from '../tokens';

const API = import.meta.env.VITE_API_URL;

export default function XeroOrgs({ clerkUserId, onTenantsLoaded, hidden }) {
  const { getToken } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!clerkUserId) return;
    async function fetchTenants() {
      try {
        const token = await getToken();
        const r = await fetch(`${API}/api/xero/tenants/${clerkUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          const list = data.tenants || [];
          setTenants(list);
          onTenantsLoaded?.(list);
        }
      } catch (err) {
        console.error('[XeroOrgs] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, [clerkUserId]);

  const startOAuth = () => {
    window.location.href = `${API}/api/xero/login?clerkUserId=${clerkUserId}`;
  };

  if (loading) return null;
  if (hidden) return null;

  const hasOrgs = tenants.length > 0;

  return (
    <div style={{
      textAlign: 'left',
      background: T.bg1,
      border: `1px solid ${T.border1}`,
      borderRadius: 12,
      padding: '20px 24px',
      maxWidth: 420,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#13B5EA" />
            <path d="M11 20l5.5 5.5L22 20l-5.5-5.5L11 20z" fill="white" />
            <path d="M29 20l-5.5-5.5L18 20l5.5 5.5L29 20z" fill="white" />
          </svg>
          <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.fg0 }}>
            Xero organisations
          </span>
        </div>
        {hasOrgs && (
          <span style={{
            fontFamily: T.sans, fontSize: 11, color: T.greenText,
            background: `${T.greenBright}12`, border: `1px solid ${T.greenBright}30`,
            padding: '2px 8px', borderRadius: 99,
          }}>
            {tenants.length} connectée{tenants.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tenant list */}
      {hasOrgs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {tenants.map(t => (
            <div key={t.tenantId} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              background: T.bg2, borderRadius: 8,
              border: `1px solid ${T.border0}`,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: `${T.greenBright}15`,
                border: `1px solid ${T.greenBright}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke={T.greenBright} strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: T.sans, fontSize: 13, color: T.fg0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {t.tenantName || t.tenantId}
                </div>
                {t.tenantType && (
                  <div style={{ fontFamily: T.sans, fontSize: 10, color: T.fg2, textTransform: 'lowercase' }}>
                    {t.tenantType}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions (collapsible si orgs déjà connectées) */}
      {(!hasOrgs || showInstructions) && (
        <div style={{
          background: T.bg2, border: `1px solid ${T.border0}`,
          borderRadius: 8, padding: '12px 14px', marginBottom: 14,
        }}>
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, marginBottom: 8, fontWeight: 500 }}>
            Comment connecter plusieurs organisations
          </div>
          {[
            'Cliquez sur "Connect Xero" ci-dessous',
            'Sur la page Xero, sélectionnez une organisation dans le menu déroulant',
            'Cliquez à nouveau sur le menu pour en sélectionner une autre — répétez pour chaque entité',
            'Une fois toutes vos entités ajoutées, cliquez "Allow access"',
            'Répétez ce process si vous avez raté des entités',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 4 ? 7 : 0, alignItems: 'flex-start' }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: T.bg0, border: `1px solid ${T.border1}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.mono, fontSize: 9, color: T.fg2, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <p style={{ fontFamily: T.sans, fontSize: 12, color: T.fg1, lineHeight: 1.5, margin: 0 }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Toggle instructions si orgs déjà là */}
      {hasOrgs && !showInstructions && (
        <button
          onClick={() => setShowInstructions(true)}
          style={{
            display: 'block', fontFamily: T.sans, fontSize: 11, color: T.fg2,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, marginBottom: 12, textDecoration: 'underline',
            textDecorationColor: T.border1,
          }}
        >
          Comment ajouter d'autres organisations ?
        </button>
      )}

      {/* Connect button */}
      <button
        onClick={startOAuth}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 0', borderRadius: 8,
          border: `1px solid ${T.border1}`, background: T.bg2,
          fontFamily: T.sans, fontSize: 13, color: T.fg1,
          cursor: 'pointer', transition: 'border-color 150ms, color 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.fg0; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border1; e.currentTarget.style.color = T.fg1; }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {hasOrgs ? 'Connecter une autre organisation' : 'Connect Xero'}
      </button>
    </div>
  );
}
