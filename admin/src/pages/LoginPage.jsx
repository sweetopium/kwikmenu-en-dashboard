import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { fetchSystemHealth, storeAdminKey } from '../lib/adminApi';

const LoginPage = () => {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    storeAdminKey(adminKey.trim());
    try {
      await fetchSystemHealth();
      navigate('/');
    } catch (nextError) {
      setError(nextError.message || 'Не удалось войти в админку.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple text-white">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">KwikMenu Admin</h1>
            <p className="text-sm text-muted-foreground">Вход по отдельному ключу администратора</p>
          </div>
        </div>

        <label className="text-sm font-bold text-foreground" htmlFor="admin-key">
          Admin key
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background px-3">
          <KeyRound size={17} className="text-muted-foreground" />
          <input
            id="admin-key"
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Можно оставить пустым в development"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div> : null}

        <Button className="mt-6 w-full" disabled={isLoading}>
          {isLoading ? 'Проверяем...' : 'Войти'}
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
