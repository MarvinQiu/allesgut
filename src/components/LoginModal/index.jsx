import React from 'react';
import Login from '../../pages/Login';

const LoginModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-[80vh] overflow-auto rounded-2xl bg-white shadow-xl">
        <Login />
      </div>
    </div>
  );
};

export default LoginModal;
