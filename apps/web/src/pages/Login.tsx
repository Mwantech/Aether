import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, email);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-gray-800 bg-surface/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                        Aether
                    </h1>
                    <CardTitle>Welcome back</CardTitle>
                    <p className="text-sm text-muted">Enter your credentials to access your dashboard</p>
                </CardHeader>

                <form onSubmit={handleLogin} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="admin@aether.local"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Sign In
                    </Button>

                    <div className="text-center text-sm text-muted">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-accent hover:underline">
                            Sign up
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
};
