import { useState } from 'react';
import { useSignUp } from '@clerk/react';
import { useNavigate, Link } from 'react-router-dom';
import { T } from '../tokens';

const COUNTRIES = [
  { code: '+1',   flag: '🇺🇸' }, { code: '+1',   flag: '🇨🇦' },
  { code: '+33',  flag: '🇫🇷' }, { code: '+44',  flag: '🇬🇧' },
  { code: '+49',  flag: '🇩🇪' }, { code: '+41',  flag: '🇨🇭' },
  { code: '+352', flag: '🇱🇺' }, { code: '+32',  flag: '🇧🇪' },
  { code: '+31',  flag: '🇳🇱' }, { code: '+34',  flag: '🇪🇸' },
  { code: '+39',  flag: '🇮🇹' }, { code: '+971', flag: '🇦🇪' },
  { code: '+65',  flag: '🇸🇬' }, { code: '+852', flag: '🇭🇰' },
  { code: '+61',  flag: '🇦🇺' }, { code: '+55',  flag: '🇧🇷' },
  { code: '+91',  flag: '🇮🇳' },
];

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: T.sans, fontSize: 12, color: T.fg2, marginBottom: 7 }}>{label}</label>
      {children}
      {error && <p style={{ fontFamily: T.sans, fontSize: 12, color: '#e05555', marginTop: 5 }}>{error}</p>}
    </div>
  );
}

const inputCss = (focused, error) => ({
  width: '100%', background: T.bg2, borderRadius: 8, padding: '12px 14px',
  fontFamily: T.sans, fontSize: 14, color: T.fg0, outline: 'none',
  border: `1px solid ${error ? '#e05555' : focused ? T.greenBright : T.border1}`,
  boxShadow: focused ? `0 0 0 3px ${T.greenBright}28` : 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
});

function TextInput({ label, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} error={error}>
      <input {...props} style={inputCss(focused, error)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </Field>
  );
}

export default function SignUpPage() {
  const { signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  const [firstName, setFirstName]   = useState('');
  const [lastName,  setLastName]    = useState('');
  const [email,     setEmail]       = useState('');
  const [password,  setPassword]    = useState('');
  const [dialCode,  setDialCode]    = useState('+33');
  const [phone,     setPhone]       = useState('');
  const [terms,     setTerms]       = useState(false);
  const [errs,      setErrs]        = useState({});

  function validate() {
    const e = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim())  e.lastName  = 'Required';
    if (!email.trim())     e.email     = 'Required';
    if (!phone.trim())     e.phone     = 'Required';
    if (password.length < 8) e.password = 'At least 8 characters';
    if (!terms) e.terms = 'You must accept the terms to continue';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      const attempt = await signUp.create({ emailAddress: email, password });
      await attempt.prepareEmailAddressVerification({ strategy: 'email_code' });

      localStorage.setItem('pending_profile', JSON.stringify({
        firstName, lastName,
        phone: `${dialCode} ${phone}`.trim(),
        acceptedTerms: true,
      }));

      setStep('verify');
    } catch (err) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (loading || code.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/home');
      }
    } catch (err) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  const [focused, setFocused] = useState({});
  const focusProps = (k) => ({
    onFocus: () => setFocused(f => ({ ...f, [k]: true })),
    onBlur:  () => setFocused(f => ({ ...f, [k]: false })),
  });

  return (
    <div style={{
      minHeight: '100svh', background: T.bg0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 48 }}>
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
          <rect x="0" y="0" width="2.5" height="20" rx="1.25" fill={T.greenBright} />
          <rect x="0" y="0" width="8" height="2.5" rx="1.25" fill={T.greenBright} />
          <rect x="0" y="17.5" width="8" height="2.5" rx="1.25" fill={T.greenBright} />
        </svg>
        <span style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 500, color: T.fg0, letterSpacing: '-0.2px' }}>CFO Black</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 500, background: T.bg1, border: `1px solid ${T.border1}`, borderRadius: 16, padding: '40px' }}>

        {step === 'form' ? (
          <>
            <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 600, letterSpacing: '-1px', color: T.fg0, marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg2, marginBottom: 32, fontWeight: 300 }}>
              Invite only · Early access.
            </p>

            {error && (
              <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextInput label="First name" placeholder="Alexander" value={firstName} onChange={e => setFirstName(e.target.value)} error={errs.firstName} />
                <TextInput label="Last name"  placeholder="Chen"      value={lastName}  onChange={e => setLastName(e.target.value)}  error={errs.lastName}  />
              </div>

              <TextInput label="Email" type="email" placeholder="alex@holdco.com" value={email} onChange={e => setEmail(e.target.value)} error={errs.email} />

              {/* Phone */}
              <Field label="Phone number" error={errs.phone}>
                <div style={{
                  display: 'flex', borderRadius: 8, overflow: 'hidden',
                  border: `1px solid ${errs.phone ? '#e05555' : focused.phone ? T.greenBright : T.border1}`,
                  boxShadow: focused.phone ? `0 0 0 3px ${T.greenBright}28` : 'none',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}>
                  <select value={dialCode} onChange={e => setDialCode(e.target.value)}
                    style={{ background: T.bg3, border: 'none', borderRight: `1px solid ${T.border1}`, padding: '12px 10px', fontFamily: T.sans, fontSize: 13, color: T.fg0, cursor: 'pointer', outline: 'none', flexShrink: 0 }}>
                    {COUNTRIES.map((c, i) => <option key={i} value={c.code}>{c.flag} {c.code}</option>)}
                  </select>
                  <input type="tel" placeholder="6 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)}
                    {...focusProps('phone')}
                    style={{ flex: 1, background: T.bg2, border: 'none', padding: '12px 14px', fontFamily: T.sans, fontSize: 14, color: T.fg0, outline: 'none' }} />
                </div>
              </Field>

              <TextInput label="Password" type="password" placeholder="8 characters minimum" value={password} onChange={e => setPassword(e.target.value)} error={errs.password} />

              {/* Terms */}
              <Field error={errs.terms}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
                    style={{ marginTop: 2, accentColor: T.greenBright, width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }} />
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: T.fg2, lineHeight: 1.55 }}>
                    I agree to the <a href="#" style={{ color: T.greenText, textDecoration: 'none' }}>terms of use</a> and <a href="#" style={{ color: T.greenText, textDecoration: 'none' }}>privacy policy</a>
                  </span>
                </label>
              </Field>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 8, border: 'none',
                  background: loading ? T.green : T.greenMid, color: T.fg0,
                  fontFamily: T.sans, fontSize: 15, fontWeight: 400,
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: 'rgba(255,255,255,0.12) 0px 0.5px 0 0 inset, rgba(0,0,0,0.3) 0 0 0 0.5px inset',
                  transition: 'background 150ms',
                }}>
                {loading ? 'Creating account…' : 'Create my account →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontFamily: T.sans, fontSize: 13, color: T.fg2, marginTop: 24 }}>
              Already have an account?{' '}
              <Link to="/sign-in" style={{ color: T.greenText, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 600, letterSpacing: '-1px', color: T.fg0, marginBottom: 8 }}>
              Check your email
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg2, marginBottom: 32, fontWeight: 300 }}>
              A 6-digit code was sent to <span style={{ color: T.fg0 }}>{email}</span>.
            </p>

            {error && (
              <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: '#e05555' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextInput label="Verification code" placeholder="123456" value={code}
                onChange={e => setCode(e.target.value)} maxLength={6} inputMode="numeric" autoFocus />
              <button type="submit" disabled={loading || code.length < 6}
                style={{
                  width: '100%', padding: '13px', borderRadius: 8, border: 'none',
                  background: loading || code.length < 6 ? T.green : T.greenMid, color: T.fg0,
                  fontFamily: T.sans, fontSize: 15, fontWeight: 400,
                  cursor: loading || code.length < 6 ? 'default' : 'pointer',
                  boxShadow: 'rgba(255,255,255,0.12) 0px 0.5px 0 0 inset, rgba(0,0,0,0.3) 0 0 0 0.5px inset',
                }}>
                {loading ? 'Verifying…' : 'Confirm →'}
              </button>
            </form>

            <button onClick={() => { setStep('form'); setError(''); setCode(''); }}
              style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', fontFamily: T.sans, fontSize: 13, color: T.fg2, cursor: 'pointer' }}>
              ← Edit my information
            </button>
          </>
        )}
      </div>
    </div>
  );
}
