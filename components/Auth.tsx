import React, { useState } from 'react';
import { Shield, Key, Mail, ArrowRight, Loader2, Ghost, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-oxidiana-black flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-oxidiana-panel border border-oxidiana-border p-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-oxidiana-red opacity-50 animate-pulse"></div>
        <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-oxidiana-red opacity-5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-oxidiana-red/10 border border-oxidiana-red flex items-center justify-center mb-4 animate-glitch">
            <Ghost className="text-oxidiana-red w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
            {isLogin ? 'Acceso de Usuario' : 'Registro de Usuario'}
          </h1>
          <p className="text-oxidiana-dim text-xs mt-2 uppercase tracking-tighter">
            BIOMA OXIDIANA // PROTOCOLO DE IDENTIDAD
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-oxidiana-red uppercase font-bold tracking-widest flex items-center gap-2">
              <Mail size={12} /> Email de Usuario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-oxidiana-border p-3 text-white focus:border-oxidiana-red outline-none transition-colors text-sm"
              placeholder="luna@oxidiana.net"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-oxidiana-red uppercase font-bold tracking-widest flex items-center gap-2">
              <Key size={12} /> Credencial de Acceso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-oxidiana-border p-3 text-white focus:border-oxidiana-red outline-none transition-colors text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-3 flex items-start gap-3 animate-pulse">
              <AlertCircle className="text-red-500 w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-red-500 text-[10px] uppercase leading-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-oxidiana-red text-black font-bold py-3 uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-oxidiana-border flex flex-col items-center gap-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-oxidiana-dim hover:text-oxidiana-red uppercase tracking-widest transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
          
          <div className="flex items-center gap-2 text-[8px] text-oxidiana-dim opacity-30 uppercase">
            <Shield size={10} /> Encriptación de Grado Militar Activada
          </div>
        </div>
      </div>
      
      {/* Terminal background effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]">
        <pre className="text-[10px] leading-none select-none">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i}>{Math.random().toString(36).substring(2, 80)}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}
