import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type AuthMode = 'select' | 'email' | 'phone' | 'otp-verify';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithOtp, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const { t } = useTheme();

  const [mode, setMode] = useState<AuthMode>('select');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { alert('Please enter both email and password.'); return; }
    setSubmitting(true);
    const { error } = isSignUp ? await signUpWithEmail(email.trim(), password) : await signInWithEmail(email.trim(), password);
    setSubmitting(false);
    if (error) alert(error);
    else if (isSignUp) alert('Check your email for a confirmation link.');
  };

  const handleEmailOtp = async () => {
    if (!email.trim()) { alert('Please enter your email.'); return; }
    setSubmitting(true);
    const { error } = await signInWithOtp(email.trim());
    setSubmitting(false);
    if (error) alert(error);
    else alert('Check your email for a magic link.');
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) { alert('Please enter your phone number.'); return; }
    setSubmitting(true);
    const { error } = await sendPhoneOtp(phone.trim());
    setSubmitting(false);
    if (error) alert(error);
    else setMode('otp-verify');
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) { alert('Please enter the verification code.'); return; }
    setSubmitting(true);
    const { error } = await verifyPhoneOtp(phone.trim(), otpCode.trim());
    setSubmitting(false);
    if (error) alert(error);
  };

  const goBack = () => { setMode('select'); setEmail(''); setPassword(''); setPhone(''); setOtpCode(''); setIsSignUp(false); };

  const containerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: t.bg, padding: 32,
  };

  const formStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '100%', maxWidth: 380,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', maxWidth: 320, borderRadius: 3, border: `1px solid ${t.line}`,
    padding: '14px 16px', fontSize: 15, fontWeight: 600, marginBottom: 12,
    background: t.surface, color: t.ink, fontFamily: "'Archivo', sans-serif",
  };

  const primaryBtnStyle: React.CSSProperties = {
    borderRadius: 3, padding: '14px 24px', width: '100%', maxWidth: 320,
    textAlign: 'center', marginTop: 4, marginBottom: 16, border: 'none',
    background: t.accent, color: '#fff', fontWeight: 800, fontSize: 14,
    letterSpacing: '.08em', textTransform: 'uppercase',
    opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
  };

  const methodBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderRadius: 3, border: `1px solid ${t.line}`, padding: '14px 24px',
    width: '100%', maxWidth: 320, marginBottom: 12, background: t.surface, cursor: 'pointer',
  };

  const backBtn = (
    <button onClick={goBack} style={{
      alignSelf: 'flex-start', marginBottom: 24, background: 'none',
      color: t.accent, fontWeight: 800, fontSize: 12, letterSpacing: '.1em',
      textTransform: 'uppercase', cursor: 'pointer',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><path d="M9 2l-5 5 5 5" /></svg>
      Back
    </button>
  );

  if (mode === 'otp-verify') {
    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          {backBtn}
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 34, textTransform: 'uppercase', color: t.ink, marginBottom: 8 }}>Enter Code</h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginBottom: 48 }}>We sent a code to {phone}</p>
          <input style={inputStyle} placeholder="6-digit code" value={otpCode} onChange={e => setOtpCode(e.target.value)} autoFocus />
          <button style={primaryBtnStyle} onClick={handleVerifyOtp} disabled={submitting}>{submitting ? '...' : 'Verify'}</button>
          <button onClick={handleSendPhoneOtp} disabled={submitting} style={{ background: 'none', color: t.accent, fontWeight: 800, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Resend code</button>
        </div>
      </div>
    );
  }

  if (mode === 'phone') {
    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          {backBtn}
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 34, textTransform: 'uppercase', color: t.ink, marginBottom: 8 }}>Phone Sign In</h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginBottom: 48 }}>We'll send you a verification code</p>
          <input style={inputStyle} placeholder="+1 234 567 8900" value={phone} onChange={e => setPhone(e.target.value)} autoFocus />
          <button style={primaryBtnStyle} onClick={handleSendPhoneOtp} disabled={submitting}>{submitting ? '...' : 'Send Code'}</button>
        </div>
      </div>
    );
  }

  if (mode === 'email') {
    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          {backBtn}
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 34, textTransform: 'uppercase', color: t.ink, marginBottom: 8 }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginBottom: 48 }}>
            {isSignUp ? 'Sign up with your email' : 'Welcome back'}
          </p>
          <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button style={primaryBtnStyle} onClick={handleEmailAuth} disabled={submitting}>
            {submitting ? '...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', color: t.accent, fontWeight: 800, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, cursor: 'pointer' }}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 320, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: t.line }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, letterSpacing: '.1em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: t.line }} />
          </div>
          <button onClick={handleEmailOtp} disabled={submitting} style={{ background: 'none', color: t.accent, fontWeight: 800, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Send me a magic link instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <div style={{
          width: 46, height: 46, borderRadius: 3, background: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M4 17l4-8 4 4 4-6 4 10" /></svg>
        </div>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 36, textTransform: 'uppercase', color: t.ink, letterSpacing: '.02em' }}>FitnessPro</h1>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: t.sub, marginTop: 4, marginBottom: 48 }}>Boutique Strength Club</p>

        <button onClick={signInWithGoogle} style={{ ...methodBtnStyle, background: '#fff', border: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#4285F4' }}>G</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#333', letterSpacing: '.06em', textTransform: 'uppercase' }}>Continue with Google</span>
        </button>

        <button onClick={() => setMode('email')} style={methodBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={t.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="1" /><path d="M2 4l7 5 7-5" /></svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: t.ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Continue with Email</span>
        </button>

        <button onClick={() => setMode('phone')} style={methodBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={t.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="1" width="8" height="16" rx="1.5" /><path d="M8 14h2" /></svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: t.ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Continue with Phone</span>
        </button>
      </div>
    </div>
  );
}
