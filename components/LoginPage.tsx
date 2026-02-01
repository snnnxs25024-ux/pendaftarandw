import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (id === 'Nexus Sunter' && password === 'nexus123') {
      onLoginSuccess();
    } else {
      setError('ID atau Password salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <img 
            src="https://i.imgur.com/fF8ZWc7.png" 
            alt="Logo Nexus" 
            className="h-20 w-auto mb-4 mix-blend-multiply" 
          />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Login Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan kredensial untuk mengakses dashboard.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="admin-id" className="sr-only">ID</label>
              <input
                id="admin-id"
                name="id"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 bg-slate-800 border border-slate-600 placeholder-slate-400 text-white rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="ID Admin"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-admin" className="sr-only">Password</label>
              <input
                id="password-admin"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 bg-slate-800 border border-slate-600 placeholder-slate-400 text-white rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Login
            </button>
          </div>
        </form>
         <button 
            onClick={onBackToHome}
            className="w-full text-center mt-4 text-sm text-orange-600 hover:text-orange-800 font-medium"
        >
            Kembali ke Halaman Utama
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
