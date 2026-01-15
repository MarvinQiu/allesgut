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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          {step === 'code' ? (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          ) : (
            <div className="w-8" />
          )}
          <span className="font-medium text-gray-900">
            {step === 'phone' ? '手机登录' : '输入验证码'}
          </span>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="text-center mb-8 mt-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AllesGut</h1>
          <p className="text-gray-500">特需儿童家长社区</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">手机号码</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号码"
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={11}
              />
            </div>

            <button
              onClick={handleSendCode}
              disabled={isLoading || phone.length !== 11}
              className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
                isLoading || phone.length !== 11
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isLoading ? '发送中...' : '获取验证码'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-600">验证码已发送至</p>
              <p className="text-gray-900 font-medium">{phone}</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
                isLoading || code.length !== 6
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isLoading ? '验证中...' : '登录'}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={countdown > 0}
                className={`text-sm ${
                  countdown > 0 ? 'text-gray-400' : 'text-primary-500'
                }`}
              >
                {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
};

export default Login;
