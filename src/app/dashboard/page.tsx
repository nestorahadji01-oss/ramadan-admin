'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { getDashboardStats, getRecentActivations, getActivationCodes, type DashboardStats, type ActivationCode } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);
    const [recentCodes, setRecentCodes] = useState<ActivationCode[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, chartDataResult, codesResult] = await Promise.all([
                getDashboardStats(),
                getRecentActivations(7),
                getActivationCodes(1, 5),
            ]);
            setStats(statsData);
            setChartData(chartDataResult);
            setRecentCodes(codesResult.codes);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                        Dashboard
                    </h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        Vue d&apos;ensemble de l&apos;application Ramadan
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={loadData}>
                    <RefreshCw size={18} />
                    Actualiser
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
            }}>
                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Users size={20} color="var(--primary)" />
                        </div>
                        <span className="stat-label">Total Codes</span>
                    </div>
                    <span className="stat-value">{stats?.totalCodes || 0}</span>
                </div>

                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <CheckCircle size={20} color="var(--primary)" />
                        </div>
                        <span className="stat-label">Activés</span>
                    </div>
                    <span className="stat-value">{stats?.activatedCodes || 0}</span>
                </div>

                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Clock size={20} color="var(--warning)" />
                        </div>
                        <span className="stat-label">Aujourd&apos;hui</span>
                    </div>
                    <span className="stat-value">{stats?.todayActivations || 0}</span>
                </div>

                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <TrendingUp size={20} color="#3b82f6" />
                        </div>
                        <span className="stat-label">Cette semaine</span>
                    </div>
                    <span className="stat-value">{stats?.weekActivations || 0}</span>
                </div>
            </div>

            {/* Chart */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Activations (7 derniers jours)
                </h2>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a1a',
                                    border: '1px solid #2a2a2a',
                                    borderRadius: '8px',
                                    color: '#fff',
                                }}
                                labelFormatter={(label) => formatDate(String(label))}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                name="Activations"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Codes */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>
                        Dernières activations
                    </h2>
                    <a href="/dashboard/users" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                        <Plus size={16} />
                        Voir tout
                    </a>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Téléphone</th>
                                <th>Nom</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCodes.map((code) => (
                                <tr key={code.id}>
                                    <td>{code.phone}</td>
                                    <td>{code.customer_name || '-'}</td>
                                    <td>
                                        <span className={`badge ${code.used ? 'badge-success' : 'badge-warning'}`}>
                                            {code.used ? 'Activé' : 'En attente'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--muted)' }}>
                                        {new Date(code.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                </tr>
                            ))}
                            {recentCodes.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                                        Aucune activation
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
