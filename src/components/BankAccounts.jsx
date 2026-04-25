import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { T } from '../tokens';

function fmt(amount, currency = 'EUR') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

export default function BankAccounts() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      try {
        const token = await getToken();
        const r = await fetch(
          `${import.meta.env.VITE_API_URL}/api/xero/bank-accounts/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!r.ok) throw new Error(await r.text());
        setAccounts(await r.json());
      } catch (err) {
        setError('Unable to load bank accounts.');
        console.error('[CFO] bank-accounts error:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke={T.border1} strokeWidth="2" />
        <path d="M12 2 A10 10 0 0 1 22 12" stroke={T.greenBright} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <p style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555', textAlign: 'center' }}>{error}</p>
  );

  if (accounts.length === 0) return (
    <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg2, textAlign: 'center' }}>
      No bank accounts found in Xero.
    </p>
  );

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      <p style={{ fontFamily: T.sans, fontSize: 11, color: T.greenText, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        Bank accounts
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accounts.map(account => (
          <div key={account.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: T.bg1, border: `1px solid ${T.border0}`, borderRadius: 10,
            padding: '16px 20px',
          }}>
            <div>
              <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg0, margin: 0 }}>{account.name}</p>
              {account.code && (
                <p style={{ fontFamily: T.mono, fontSize: 11, color: T.fg2, margin: '3px 0 0' }}>{account.code}</p>
              )}
            </div>
            <p style={{
              fontFamily: T.mono, fontSize: 16, fontWeight: 500,
              color: account.balance >= 0 ? T.fg0 : '#e05555',
              margin: 0,
            }}>
              {fmt(account.balance, account.currencyCode || 'EUR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
