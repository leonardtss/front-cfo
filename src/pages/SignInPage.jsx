import { SignIn } from '@clerk/react';
import { Link } from 'react-router-dom';
import { T } from '../tokens';

const clerkAppearance = {
  variables: {
    colorBackground: T.bg1,
    colorInputBackground: T.bg2,
    colorPrimary: T.greenBright,
    colorText: T.fg0,
    colorTextSecondary: T.fg1,
    colorTextOnPrimaryBackground: T.fg0,
    colorNeutral: T.fg0,
    colorInputText: T.fg0,
    colorDanger: '#e05555',
    borderRadius: '8px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '14px',
  },
  elements: {
    rootBox: {
      width: '100%',
    },
    card: {
      background: T.bg1,
      border: `1px solid ${T.border1}`,
      borderRadius: '16px',
      boxShadow: 'none',
      padding: '40px',
    },
    headerTitle: {
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: '32px',
      fontWeight: '600',
      letterSpacing: '-1px',
      color: T.fg0,
    },
    headerSubtitle: {
      color: T.fg2,
      fontWeight: '300',
    },
    socialButtonsBlockButton: {
      background: T.bg2,
      border: `1px solid ${T.border1}`,
      color: T.fg0,
      borderRadius: '8px',
    },
    socialButtonsBlockButtonText: {
      color: T.fg0,
    },
    dividerLine: {
      background: T.border0,
    },
    dividerText: {
      color: T.fg2,
    },
    formFieldLabel: {
      color: T.fg2,
      fontSize: '12px',
    },
    formFieldInput: {
      background: T.bg2,
      border: `1px solid ${T.border1}`,
      borderRadius: '8px',
      color: T.fg0,
      fontSize: '14px',
    },
    formButtonPrimary: {
      background: T.greenMid,
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '400',
      boxShadow: 'rgba(255,255,255,0.12) 0px 0.5px 0 0 inset, rgba(0,0,0,0.3) 0 0 0 0.5px inset',
    },
    footerActionLink: {
      color: T.greenText,
    },
    footerActionText: {
      color: T.fg2,
    },
    identityPreviewText: {
      color: T.fg0,
    },
    identityPreviewEditButton: {
      color: T.greenText,
    },
    formResendCodeLink: {
      color: T.greenText,
    },
    otpCodeFieldInput: {
      background: T.bg2,
      border: `1px solid ${T.border1}`,
      color: T.fg0,
      borderRadius: '8px',
    },
  },
};

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100svh',
      background: T.bg0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
          <rect x="0" y="0" width="2.5" height="20" rx="1.25" fill={T.greenBright} />
          <rect x="0" y="0" width="8" height="2.5" rx="1.25" fill={T.greenBright} />
          <rect x="0" y="17.5" width="8" height="2.5" rx="1.25" fill={T.greenBright} />
        </svg>
        <span style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 500, color: T.fg0, letterSpacing: '-0.2px' }}>
          CFO Black
        </span>
      </Link>

      <SignIn
        forceRedirectUrl="/home"
        signUpUrl="/sign-up"
        appearance={clerkAppearance}
      />
    </div>
  );
}
