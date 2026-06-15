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
    width: '100%', maxWidth: 320, borderRadius: 14, border: `1.5px solid ${t.line}`,
    padding: '14px 16px', fontSize: 15, fontWeight: 600, marginBottom: 12,
    background: t.surface, color: t.ink,
  };

  const primaryBtnStyle: React.CSSProperties = {
    borderRadius: 14, padding: '14px 24px', width: '100%', maxWidth: 320,
    textAlign: 'center', marginTop: 4, marginBottom: 16,
    background: t.accent, color: t.onAccent, fontWeight: 800, fontSize: 16,
    opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
  };

  const methodBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderRadius: 14, border: `1.5px solid ${t.line}`, padding: '14px 24px',
    width: '100%', maxWidth: 320, marginBottom: 12, background: t.surface, cursor: 'pointer',
  };

  if (mode === 'otp-verify') {
    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          <button onClick={goBack} style={{ alignSelf: 'flex-start', marginBottom: 24, background: 'none', color: t.accent, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            ← Back
          </button>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📱</div>
          <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 34, color: t.ink, marginBottom: 8 }}>Enter Code</h1>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.sub, marginBottom: 48 }}>We sent a code to {phone}</p>
          <input style={inputStyle} placeholder="6-digit code" value={otpCode} onChange={e => setOtpCode(e.target.value)} autoFocus />
          <button style={primaryBtnStyle} onClick={handleVerifyOtp} disabled={submitting}>
            {submitting ? '...' : 'Verify'}
          </button>
          <button onClick={handleSendPhoneOtp} disabled={submitting} style={{ background: 'none', color: t.accent, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Resend code
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'phone') {
    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          <button onClick={goBack} style={{ alignSelf: 'flex-start', marginBottom: 24, background: 'none', color: t.accent, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            ← Back
          </button>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📱</div>
          <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 34, color: t.ink, marginBottom: 8 }}>Phone Sign In</h1>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.sub, marginBottom: 48 }}>We'll send you a verification code</p>
          <input style={inputStyle} placeholder="+1 234 567 8900" value={phone} onChange={e => setPhone(e.target.value)} autoFocus />
          <button style={primaryBtnStyle} onClick={handleSendPhoneOtp} disabled={submitting}>
            {submitting ? '...' : 'Send Code'}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'email') {
    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          <button onClick={goBack} style={{ alignSelf: 'flex-start', marginBottom: 24, background: 'none', color: t.accent, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            ← Back
          </button>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 34, color: t.ink, marginBottom: 8 }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.sub, marginBottom: 48 }}>
            {isSignUp ? 'Sign up with your email' : 'Welcome back'}
          </p>
          <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button style={primaryBtnStyle} onClick={handleEmailAuth} disabled={submitting}>
            {submitting ? '...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', color: t.accent, fontWeight: 600, fontSize: 14, marginBottom: 8, cursor: 'pointer' }}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 320, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: t.line }} />
            <span style={{ fontSize: 13, color: t.sub }}>or</span>
            <div style={{ flex: 1, height: 1, background: t.line }} />
          </div>
          <button onClick={handleEmailOtp} disabled={submitting} style={{ background: 'none', color: t.accent, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Send me a magic link instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏋️</div>
        <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 34, color: t.ink, marginBottom: 8 }}>FitnessPro</h1>
        <p style={{ fontSize: 15, fontWeight: 600, color: t.sub, marginBottom: 48 }}>Your personal workout companion</p>

        <button onClick={signInWithGoogle} style={{ ...methodBtnStyle, background: '#fff', border: 'none' }}>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#4285F4' }}>G</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>Continue with Google</span>
        </button>

        <button onClick={() => setMode('email')} style={methodBtnStyle}>
          <span style={{ fontSize: 20 }}>✉️</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>Continue with Email</span>
        </button>

        <button onClick={() => setMode('phone')} style={methodBtnStyle}>
          <span style={{ fontSize: 20 }}>📱</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: t.ink }}>Continue with Phone</span>
        </button>
      </div>
    </div>
  );
}
