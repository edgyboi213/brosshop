
import React, { useState } from 'react';
import { Button } from './Button';
import { AuthApi } from '../services/api';
import { LoginResponse } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (data: LoginResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    username: '',
    fullName: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginView) {
        const res = await AuthApi.login({
          login: formData.login,
          password: formData.password
        });
        onLoginSuccess(res);
        onClose();
      } else {
        await AuthApi.register(formData);
        alert('Registration successful! Please login.');
        setIsLoginView(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-lg w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center brand-font uppercase">
          {isLoginView ? 'Вход' : 'Регистрация'}
        </h2>

        {error && <div className="bg-red-500/20 text-red-500 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Логин</label>
            <input 
              name="login"
              type="text" 
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-orange-500 outline-none"
              value={formData.login}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Пароль</label>
            <input 
              name="password"
              type="password" 
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-orange-500 outline-none"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {!isLoginView && (
            <>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Никнейм</label>
                <input 
                  name="username"
                  type="text" 
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
               <div>
                <label className="block text-sm text-zinc-400 mb-1">ФИО</label>
                <input 
                  name="fullName"
                  type="text" 
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Телефон</label>
                <input 
                  name="phoneNumber"
                  type="tel" 
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-orange-500 outline-none"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full mt-4" isLoading={loading}>
            {isLoginView ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-400">
          {isLoginView ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button 
            type="button"
            className="text-orange-500 hover:underline"
            onClick={() => setIsLoginView(!isLoginView)}
          >
            {isLoginView ? 'Создать' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};

