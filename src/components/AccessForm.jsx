import { useContext, useState } from 'react';
import { TweaksCtx } from '../context';
import { T, getAccentTokens } from '../tokens';
import { Wrap, BtnPrimary } from './shared';
import { useMedia } from '../hooks/useMedia';

const API = import.meta.env.VITE_API_URL;

export default function AccessForm() {
  const { accent } = useContext(TweaksCtx);
  const A = getAccentTokens(accent);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', tools: '' });
  const isMobile = useMedia('(max-width: 767px)');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const inputStyle = {
    width: '100%', background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 8,
    padding: '12px 14px', fontFamily: T.sans, fontSize: 14, color: T.fg0, outline: 'none',
    transition: 'border-color 150ms, box-shadow 150ms',
  };

  const onFocus = e => {
    e.target.style.borderColor = A.bright;
    e.target.style.boxShadow = `0 0 0 3px ${A.bright}28`;
  };
  const onBlur = e => {
    e.target.style.borderColor = T.border1;
    e.target.style.boxShadow = 'none';
  };

  return (
    <section id="access-form" style={{ padding: isMobile ? '80px 0' : '140px 0', background: T.bg1, borderTop: `1px solid ${T.border0}` }}>
      <Wrap style={{ maxWidth: 580 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: T.serif, fontSize: 'clamp(28px,4vw,54px)', fontWeight: 600,
            lineHeight: 1.05, letterSpacing: '-1.5px', color: T.fg0, marginBottom: 18,
          }}>
            If your wealth has outgrown your tools, let's talk.
          </h2>
          <p style={{ fontFamily: T.sans, fontSize: 16, color: T.fg1, lineHeight: 1.6, fontWeight: 300 }}>
            We onboard a small number of members at a time. Tell us about your situation.
          </p>
        </div>

        {submitted ? (
          <div style={{
            textAlign: 'center', padding: '48px 40px', background: T.bg2,
            borderRadius: 12, border: `1px solid ${A.bright}33`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: A.pale, border: `1px solid ${A.bright}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
                <path d="M1 6L7 12L17 1" stroke={A.bright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 26, color: T.fg0, marginBottom: 10, letterSpacing: '-0.5px' }}>
              Application received.
            </div>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.fg1, lineHeight: 1.65, fontWeight: 300 }}>
              We review every application personally. If there's a fit, you'll hear from us within a few business days.
            </p>
          </div>
        ) : (
          <form onSubmit={async e => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              const r = await fetch(`${API}/api/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
              });
              const json = await r.json();
              if (!r.ok) throw new Error(json.error || 'Something went wrong.');
              setSubmitted(true);
            } catch (err) {
              setError(err.message);
            } finally {
              setSubmitting(false);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontFamily: T.sans, fontSize: 12, color: T.fg2, marginBottom: 7 }}>Name</label>
                <input
                  style={inputStyle}
                  placeholder="Alexander Chen"
                  value={form.name}
                  onChange={set('name')}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: T.sans, fontSize: 12, color: T.fg2, marginBottom: 7 }}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="alex@holdco.com"
                  value={form.email}
                  onChange={set('email')}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: T.sans, fontSize: 12, color: T.fg2, marginBottom: 7 }}>
                What tools are you using today?
              </label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 88 }}
                placeholder="Kubera, Excel, Addepar, Sharesight…"
                value={form.tools}
                onChange={set('tools')}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            {error && (
              <p style={{ fontFamily: T.sans, fontSize: 13, color: '#ef5350', textAlign: 'center', margin: '4px 0 0' }}>
                {error}
              </p>
            )}
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
              <BtnPrimary size="lg" disabled={submitting}>
                {submitting ? 'Sending…' : 'Request early access →'}
              </BtnPrimary>
            </div>
            <p style={{ textAlign: 'center', fontFamily: T.sans, fontSize: 12, color: T.fg2, marginTop: 4 }}>
              Early access. We review every application personally.
            </p>
          </form>
        )}
      </Wrap>
    </section>
  );
}
