import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePhone = (phone) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.sendSmsCode(phone);
      setStep('code');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || '发送验证码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { user } = await authService.verifySmsCode(phone, code);
      login(user);
    } catch (err) {
      setError(err.response?.data?.message || '验证码错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (countdown === 0) {
      handleSendCode();
    }
  };

  const handleBack = () => {
    setStep('phone');
    setCode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 flex flex-col font-body">
      {/* Header */}
      <header className="sticky top-0 glass border-b border-primary-100/50 z-10">
        <div className="flex items-center justify-between p-4">
          {step === 'code' ? (
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-primary-100/80 flex items-center justify-center text-primary-700 hover:bg-primary-200/80 transition-colors duration-200 cursor-pointer"
              aria-label="返回"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-10" />
          )}
          <h1 className="font-semibold text-primary-900 font-heading">
            {step === 'phone' ? '手机登录' : '输入验证码'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Logo and tagline */}
        <div className="text-center mb-10 mt-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl gradient-bg flex items-center justify-center shadow-soft-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2 font-heading">AllesGut</h2>
          <p className="text-primary-600">特需儿童家长社区</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in" role="alert">
            <p className="text-red-700 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-primary-800 font-medium mb-2">
                手机号码
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号码"
                className="w-full px-4 py-4 input-soft text-lg text-primary-900 placeholder-primary-400 font-body"
                maxLength={11}
                autoComplete="tel"
              />
            </div>

            <button
              onClick={handleSendCode}
              disabled={isLoading || phone.length !== 11}
              className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-200 cursor-pointer ${
                isLoading || phone.length !== 11
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发送中...
                </span>
              ) : (
                '获取验证码'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-primary-600">验证码已发送至</p>
              <p className="text-primary-900 font-semibold text-lg">{phone}</p>
            </div>

            <div>
              <label htmlFor="code" className="block text-primary-800 font-medium mb-2">
                验证码
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-4 input-soft text-xl text-center tracking-[0.5em] text-primary-900 placeholder-primary-400 font-body"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-200 cursor-pointer ${
                isLoading || code.length !== 6
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  验证中...
                </span>
              ) : (
                '登录'
              )}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={countdown > 0}
                className={`text-sm font-medium cursor-pointer ${
                  countdown > 0 ? 'text-primary-400' : 'text-primary-600 hover:text-primary-700'
                }`}
              >
                {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-primary-400 text-xs mt-10">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </main>
    </div>
  );
};

export default Login;
