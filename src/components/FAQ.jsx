import { useState } from 'react';
import { T } from '../tokens';
import { Wrap } from './shared';

const ITEMS = [
  {
    q: 'How is this different from Kubera or Addepar?',
    a: 'Kubera is an excellent aggregation tool for individuals with straightforward net worth. Addepar is built for institutional family offices with full-time staff. CFO Black sits between them: built for individuals with genuine structural complexity who want active intelligence, not just tracking. The AI layer is purpose-built for your specific situation — not a generic chatbot bolted on.',
  },
  {
    q: 'How does the AI work without compromising my privacy?',
    a: "The AI is configured to your structure during onboarding — you tell it your entities, your goals, your tax situation once. It then reasons over your live, encrypted data. Your information never leaves your environment to train a model or feed a third party. We can walk through the architecture in detail during your intake call.",
  },
  {
    q: 'What asset classes are supported at launch?',
    a: "Public equity, private equity (with capital calls, K-1s, and LP interests), real estate, crypto and DeFi, SAFE notes, carried interest, trusts, multi-jurisdiction holdcos, debt and liabilities. Art, collectibles, and private credit are in active development. If you have a specific structure, ask us — we've likely seen it.",
  },
  {
    q: 'What does it cost?',
    a: "CFO Black is priced as a premium subscription. Exact pricing is discussed during the intake conversation — it varies by complexity, entity count, and team access requirements. What we can say: it's priced to be meaningfully cheaper than a fractional CFO. The value comparison is to the decisions you'll make better, not the software you'll replace.",
  },
  {
    q: 'How does early access work?',
    a: "We're onboarding a limited number of founding members. If your application is a fit, you'll get an intro call with the team — we want to understand your situation before you commit. Founding members get locked pricing, direct access to the product team, and the ability to shape the roadmap.",
  },
  {
    q: 'Is my financial data secure?',
    a: 'Yes. SOC 2 Type II compliance, end-to-end encryption, read-only connections to financial institutions. We have no ability to move money on your behalf. Your data is never sold, never used for advertising, never shared with financial product providers.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" style={{ padding: '128px 0', borderTop: `1px solid ${T.border0}` }}>
      <Wrap style={{ maxWidth: 780 }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.fg2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
          FAQ
        </div>
        <h2 style={{
          fontFamily: T.serif, fontSize: 'clamp(28px,3.5vw,50px)', fontWeight: 600,
          lineHeight: 1.05, letterSpacing: '-1.2px', color: T.fg0, marginBottom: 52,
        }}>
          Answers.
        </h2>

        {ITEMS.map((item, i) => (
          <div key={i} style={{ borderTop: `1px solid ${T.border0}` }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '22px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
              }}
            >
              <span style={{ fontFamily: T.sans, fontSize: 16, color: T.fg0, fontWeight: 400 }}>{item.q}</span>
              <span style={{
                color: T.fg2, fontSize: 22, flexShrink: 0, transition: 'transform 220ms',
                transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                display: 'inline-block',
              }}>
                +
              </span>
            </button>
            {open === i && (
              <div style={{ paddingBottom: 24, animation: 'fadeUp 0.2s ease both' }}>
                <p style={{ fontFamily: T.sans, fontSize: 15, color: T.fg1, lineHeight: 1.75, fontWeight: 300 }}>
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${T.border0}` }} />
      </Wrap>
    </section>
  );
}
