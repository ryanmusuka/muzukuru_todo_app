import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Defining inline for simplicity
interface AuthFormProps {
  type: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isLogin = type === 'login';
      
      const requestBody = isLogin 
        ? new URLSearchParams({ username: username.trim(), password }).toString()
        : JSON.stringify({ username: username.trim(), password });

      const headers = {
        'Content-Type': isLogin ? 'application/x-www-form-urlencoded' : 'application/json',
      };

      const res = await fetch(`http://127.0.0.1:8000/${type}`, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.detail) 
          ? data.detail[0].msg 
          : data.detail || 'Invalid credentials';
        throw new Error(msg);
      }

      if (data.access_token) {
        login(data.access_token);
      } else if (type === 'register') {
        alert("Registration successful! Please login.");
        window.location.href = '/login';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8 capitalize" style={{ color: '#f97316' }}>
            {type}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder='Username'
              required
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder='Password'
              required
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition duration-200 disabled:bg-blue-300 capitalize"
          >
            {loading ? 'Processing...' : type}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {type === 'login' ? (
            <p>New user? <a href="/register" className="text-blue-600 font-bold hover:underline">Register here</a></p>
          ) : (
            <p>Already have an account? <a href="/login" className="text-blue-600 font-bold hover:underline">Login here</a></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;