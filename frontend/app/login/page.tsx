'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/src/lib/api';
import { useAppDispatch } from '@/src/store';
import { setAuth } from '@/src/store/authSlice';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setAuth({ user, accessToken, refreshToken }));
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .login-wrapper {
          display: flex;
          width: 100%;
          max-width: 860px;
          justify-content: center;
          align-items: center;
          gap: 32px;
        }

        /* Phone mockup left side */
        .login-mockup {
          display: none;
          width: 380px;
          flex-shrink: 0;
        }

        @media (min-width: 900px) {
          .login-mockup { display: block; }
        }

        .login-mockup-inner {
          width: 100%;
          aspect-ratio: 380/581;
          background: #121212;
          border-radius: 24px;
          border: 1px solid #262626;
          overflow: hidden;
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
        }

        .login-mockup-cell {
          background: #1c1c1c;
          border-radius: 4px;
          aspect-ratio: 1;
        }

        /* Right panel */
        .login-panel {
          width: 100%;
          max-width: 350px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .login-card {
          background: rgba(12,12,12,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 36px 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .login-logo {
          font-size: 36px;
          font-weight: 700;
          color: #f5f5f5;
          letter-spacing: -0.5px;
          margin-bottom: 28px;
          margin-top: 8px;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-field {
          position: relative;
        }

        .login-input {
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

        .login-input::placeholder {
          color: #737373;
          font-size: 12px;
        }

        .login-input:focus {
          border-color: #555;
        }

        .login-input-has-value {
          padding-top: 14px;
          padding-bottom: 2px;
          font-size: 12px;
        }

        .login-label {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: #737373;
          font-size: 12px;
          pointer-events: none;
          transition: all 0.1s ease;
        }

        .login-label-small {
          top: 6px;
          transform: none;
          font-size: 10px;
          color: #8e8e8e;
        }

        .login-btn-primary {
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
          margin-top: 6px;
        }

        .login-btn-primary:hover:not(:disabled) {
          background: #1aa3ff;
        }

        .login-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 12px 0;
          width: 100%;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: #262626;
        }

        .login-divider-text {
          color: #737373;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .login-fb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: none;
          border: none;
          color: #e0f0ff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s ease;
          width: 100%;
        }

        .login-fb-btn:hover {
          background: #0a1929;
        }

        .login-forgot {
          text-align: center;
          margin-top: 8px;
        }

        .login-forgot a {
          font-size: 12px;
          color: #e0e0e0;
          text-decoration: none;
          font-weight: 500;
        }

        .login-forgot a:hover { text-decoration: underline; }

        .login-error {
          color: #ed4956;
          font-size: 13px;
          text-align: center;
          margin-top: 6px;
          font-weight: 500;
        }

        .login-signup-card {
          background: rgba(12,12,12,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          padding: 18px;
          text-align: center;
          font-size: 14px;
          color: #a8a8a8;
        }

        .login-signup-card a {
          color: #0095f6;
          font-weight: 600;
          text-decoration: none;
          margin-left: 4px;
        }

        .login-signup-card a:hover { color: #1aa3ff; }

        .login-app-section {
          text-align: center;
          margin-top: 4px;
        }

        .login-app-label {
          font-size: 13px;
          color: #a8a8a8;
          margin-bottom: 14px;
          font-weight: 400;
        }

        .login-app-badges {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .login-app-badge {
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

        .login-app-badge:hover { background: #1a1a1a; }
      `}</style>

      <div className="login-root">
        <div className="login-wrapper">
          {/* Phone mockup */}
          <div className="login-mockup">
            <div className="login-mockup-inner">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="login-mockup-cell" />
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="login-panel">
            <div className="login-card">
              <div className="login-logo">Instagram</div>

              <form className="login-form" onSubmit={handleSubmit}>
                {/* Email */}
                <FloatingInput
                  id="login-email"
                  type="email"
                  label="Phone number, username, or email"
                  value={email}
                  onChange={setEmail}
                  required
                />

                {/* Password */}
                <FloatingInput
                  id="login-password"
                  type="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  required
                />

                <button
                  type="submit"
                  className="login-btn-primary"
                  disabled={loading || !email || password.length < 1}
                >
                  {loading ? 'Logging in...' : 'Log in'}
                </button>

                {error && <p className="login-error">{error}</p>}

                <div className="login-divider">
                  <div className="login-divider-line" />
                  <span className="login-divider-text">OR</span>
                  <div className="login-divider-line" />
                </div>

                <button type="button" className="login-fb-btn">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Log in with Facebook
                </button>

                <div className="login-forgot">
                  <a href="#">Forgot password?</a>
                </div>
              </form>
            </div>

            <div className="login-signup-card">
              Don't have an account?
              <Link href="/signup">Sign up</Link>
            </div>

            <div className="login-app-section">
              <p className="login-app-label">Get the app.</p>
              <div className="login-app-badges">
                <button className="login-app-badge">App Store</button>
                <button className="login-app-badge">Google Play</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* Floating label input helper */
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
    <div className="login-field">
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`login-input${raised ? ' login-input-has-value' : ''}`}
        placeholder=""
        autoComplete={type === 'password' ? 'current-password' : 'email'}
      />
      <label htmlFor={id} className={`login-label${raised ? ' login-label-small' : ''}`}>
        {label}
      </label>
    </div>
  );
}