'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/src/lib/api';
import { useAppDispatch } from '@/src/store';
import { setAuth } from '@/src/store/authSlice';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.register({
        email,
        password,
        username,
        bio: bio || undefined,
      });
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setAuth({ user, accessToken, refreshToken }));
      router.push('/');
    } catch (err: any) {
      const apiDetailedError = err.response?.data?.errors?.[0]?.message;
      setError(apiDetailedError || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isValid = email.length > 0 && username.length > 0 && password.length >= 8;

  return (
    <>
      <style>{`
        .signup-root {
          min-height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .signup-panel {
          width: 100%;
          max-width: 350px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .signup-card {
          background: #000;
          border: 1px solid #262626;
          border-radius: 2px;
          padding: 32px 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .signup-logo {
          font-size: 36px;
          font-weight: 700;
          color: #f5f5f5;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          margin-top: 4px;
        }

        .signup-tagline {
          color: #737373;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .signup-fb-btn {
          width: 100%;
          background: #0095f6;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 8px;
          padding: 7px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s ease;
          margin-bottom: 16px;
        }

        .signup-fb-btn:hover { background: #1aa3ff; }

        .signup-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          margin-bottom: 16px;
        }

        .signup-divider-line {
          flex: 1;
          height: 1px;
          background: #262626;
        }

        .signup-divider-text {
          color: #737373;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .signup-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .signup-field {
          position: relative;
        }

        .signup-input {
          width: 100%;
          background: #121212;
          border: 1px solid #363636;
          border-radius: 3px;
          font-size: 12px;
          padding: 9px 8px 7px;
          outline: none;
          color: #f5f5f5;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }

        .signup-input:focus {
          border-color: #555;
        }

        .signup-input-raised {
          padding-top: 14px;
          padding-bottom: 2px;
        }

        .signup-label {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: #737373;
          font-size: 12px;
          pointer-events: none;
          transition: all 0.1s ease;
        }

        .signup-label-small {
          top: 6px;
          transform: none;
          font-size: 10px;
          color: #8e8e8e;
        }

        .signup-legal {
          color: #737373;
          font-size: 11px;
          text-align: center;
          line-height: 1.5;
          margin-top: 4px;
        }

        .signup-legal a {
          color: #a8a8a8;
          font-weight: 600;
          text-decoration: none;
        }

        .signup-legal a:hover { text-decoration: underline; }

        .signup-btn {
          width: 100%;
          background: #0095f6;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 8px;
          padding: 7px 16px;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
          margin-top: 4px;
        }

        .signup-btn:hover:not(:disabled) { background: #1aa3ff; }

        .signup-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .signup-error {
          color: #ed4956;
          font-size: 13px;
          text-align: center;
          font-weight: 500;
          margin-top: 4px;
        }

        .signup-login-card {
          background: #000;
          border: 1px solid #262626;
          border-radius: 2px;
          padding: 18px;
          text-align: center;
          font-size: 14px;
          color: #a8a8a8;
        }

        .signup-login-card a {
          color: #0095f6;
          font-weight: 600;
          text-decoration: none;
          margin-left: 4px;
        }

        .signup-login-card a:hover { color: #1aa3ff; }

        .signup-app-section {
          text-align: center;
          margin-top: 4px;
        }

        .signup-app-label {
          font-size: 13px;
          color: #a8a8a8;
          margin-bottom: 14px;
        }

        .signup-app-badges {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .signup-app-badge {
          background: #000;
          border: 1px solid #363636;
          border-radius: 8px;
          padding: 6px 14px;
          color: #f5f5f5;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .signup-app-badge:hover { background: #1a1a1a; }
      `}</style>

      <div className="signup-root">
        <div className="signup-panel">
          <div className="signup-card">
            <div className="signup-logo">Instagram</div>
            <p className="signup-tagline">Sign up to see photos and videos from your friends.</p>

            <button className="signup-fb-btn">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign up with Facebook
            </button>

            <div className="signup-divider">
              <div className="signup-divider-line" />
              <span className="signup-divider-text">OR</span>
              <div className="signup-divider-line" />
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <FloatingInput id="su-email" type="email" label="Email" value={email} onChange={setEmail} required />
              <FloatingInput id="su-username" type="text" label="Username" value={username} onChange={setUsername} required />
              <FloatingInput id="su-bio" type="text" label="Bio (Optional)" value={bio} onChange={setBio} />
              <FloatingInput id="su-password" type="password" label="Password" value={password} onChange={setPassword} required />

              <p className="signup-legal">
                People who use our service may have uploaded your contact information to Instagram.{' '}
                <a href="#">Learn More</a>
              </p>
              <p className="signup-legal">
                By signing up, you agree to our{' '}
                <a href="#">Terms</a>,{' '}
                <a href="#">Privacy Policy</a> and{' '}
                <a href="#">Cookies Policy</a>.
              </p>

              <button type="submit" className="signup-btn" disabled={loading || !isValid}>
                {loading ? 'Signing up...' : 'Sign up'}
              </button>

              {error && <p className="signup-error">{error}</p>}
            </form>
          </div>

          <div className="signup-login-card">
            Have an account?
            <Link href="/login">Log in</Link>
          </div>

          <div className="signup-app-section">
            <p className="signup-app-label">Get the app.</p>
            <div className="signup-app-badges">
              <button className="signup-app-badge">App Store</button>
              <button className="signup-app-badge">Google Play</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FloatingInput({
  id,
  type,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div className="signup-field">
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`signup-input${raised ? ' signup-input-raised' : ''}`}
        placeholder=""
      />
      <label htmlFor={id} className={`signup-label${raised ? ' signup-label-small' : ''}`}>
        {label}
      </label>
    </div>
  );
}