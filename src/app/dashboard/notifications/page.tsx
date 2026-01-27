'use client';

import { useState } from 'react';
import { Bell, Send, Users, User, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export default function NotificationsPage() {
    const [sendMode, setSendMode] = useState<'all' | 'segment'>('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [segment, setSegment] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // OneSignal config (to be set in .env.local)
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.NEXT_PUBLIC_ONESIGNAL_API_KEY;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!appId || !apiKey) {
            setResult({
                success: false,
                message: 'OneSignal non configuré. Ajoutez NEXT_PUBLIC_ONESIGNAL_APP_ID et NEXT_PUBLIC_ONESIGNAL_API_KEY dans .env.local',
            });
            return;
        }

        if (!title || !message) {
            setResult({ success: false, message: 'Titre et message requis' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const payload: Record<string, unknown> = {
                app_id: appId,
                headings: { en: title, fr: title },
                contents: { en: message, fr: message },
            };

            if (sendMode === 'all') {
                payload.included_segments = ['All'];
            } else if (segment) {
                payload.included_segments = [segment];
            }

            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.id) {
                setResult({
                    success: true,
                    message: `Notification envoyée! (ID: ${data.id})`,
                });
                setTitle('');
                setMessage('');
            } else {
                setResult({
                    success: false,
                    message: data.errors?.[0] || 'Erreur lors de l\'envoi',
                });
            }
        } catch (error) {
            console.error('Send error:', error);
            setResult({ success: false, message: 'Erreur réseau' });
        }

        setLoading(false);
    };

    const isConfigured = appId && apiKey;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    Notifications Push
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                    Envoyer des notifications aux utilisateurs via OneSignal
                </p>
            </div>

            {!isConfigured ? (
                <div className="card" style={{ borderColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <AlertCircle size={24} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Configuration requise</h3>
                            <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                Pour envoyer des notifications, configurez OneSignal dans votre fichier <code>.env.local</code>:
                            </p>
                            <pre style={{
                                background: 'var(--background)',
                                padding: '1rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                            }}>
                                {`NEXT_PUBLIC_ONESIGNAL_APP_ID=votre-app-id
NEXT_PUBLIC_ONESIGNAL_API_KEY=votre-api-key`}
                            </pre>
                            <a
                                href="https://onesignal.com/apps"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ marginTop: '1rem', textDecoration: 'none' }}
                            >
                                <ExternalLink size={16} />
                                Ouvrir OneSignal Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
                    {/* Send Mode Selection */}
                    <div className="card">
                        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Destinataires</h3>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                type="button"
                                className={`btn ${sendMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSendMode('all')}
                                style={{ flex: 1 }}
                            >
                                <Users size={18} />
                                Tous les utilisateurs
                            </button>
                            <button
                                type="button"
                                className={`btn ${sendMode === 'segment' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSendMode('segment')}
                                style={{ flex: 1 }}
                            >
                                <User size={18} />
                                Segment spécifique
                            </button>
                        </div>

                        {sendMode === 'segment' && (
                            <div style={{ marginTop: '1rem' }}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Nom du segment (ex: Active Users)"
                                    value={segment}
                                    onChange={(e) => setSegment(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Notification Content */}
                    <form onSubmit={handleSend} className="card">
                        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Contenu de la notification</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                Titre *
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: 🌙 Rappel Iftar"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                Message *
                            </label>
                            <textarea
                                className="input"
                                placeholder="Le contenu de votre notification..."
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {result && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: result.success ? 'var(--primary)' : 'var(--danger)',
                                }}
                            >
                                {result.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                <span style={{ fontSize: '0.875rem' }}>{result.message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? (
                                'Envoi en cours...'
                            ) : (
                                <>
                                    <Send size={18} />
                                    Envoyer la notification
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Actions rapides</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start' }}
                                onClick={() => {
                                    setTitle('🌙 Rappel Iftar');
                                    setMessage('C\'est bientôt l\'heure de rompre le jeûne. Préparez-vous pour l\'Iftar!');
                                }}
                            >
                                🍽️ Rappel Iftar
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start' }}
                                onClick={() => {
                                    setTitle('⏰ Rappel Suhoor');
                                    setMessage('Réveillez-vous pour le Suhoor avant l\'aube!');
                                }}
                            >
                                🌅 Rappel Suhoor
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start' }}
                                onClick={() => {
                                    setTitle('📿 Temps de Prière');
                                    setMessage('N\'oubliez pas votre prière. Qu\'Allah accepte vos adorations.');
                                }}
                            >
                                🕌 Rappel Prière
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
