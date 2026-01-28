'use client';

import { useState } from 'react';
import { Bell, Send, Users, User, AlertCircle, CheckCircle, ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function NotificationsPage() {
    const [sendMode, setSendMode] = useState<'all' | 'segment'>('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [segment, setSegment] = useState('Subscribed Users');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; recipients?: number } | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !message) {
            setResult({ success: false, message: 'Titre et message requis' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    targetUrl: targetUrl || undefined,
                    segment: sendMode === 'all' ? 'Subscribed Users' : segment,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: `Notification envoyée! (ID: ${data.notification_id})`,
                    recipients: data.recipients,
                });
                setTitle('');
                setMessage('');
                setTargetUrl('');
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Erreur lors de l\'envoi',
                });
            }
        } catch (error) {
            console.error('Send error:', error);
            setResult({ success: false, message: 'Erreur réseau' });
        }

        setLoading(false);
    };

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
                            Tous les abonnés
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

                    <div style={{ marginBottom: '1rem' }}>
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

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                            <LinkIcon size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            Lien deep link (optionnel)
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="/prayer-times ou /quran/1"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                            Page à ouvrir quand l&apos;utilisateur tape sur la notification
                        </p>
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
                            <span style={{ fontSize: '0.875rem' }}>
                                {result.message}
                                {result.recipients !== undefined && ` (${result.recipients} destinataires)`}
                            </span>
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
                                setTargetUrl('/prayer-times');
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
                                setTargetUrl('/prayer-times');
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
                                setTargetUrl('/prayer-times');
                            }}
                        >
                            🕌 Rappel Prière
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => {
                                setTitle('📖 Lecture du Jour');
                                setMessage('Continuez votre lecture du Coran. Chaque verset compte!');
                                setTargetUrl('/quran');
                            }}
                        >
                            📖 Rappel Coran
                        </button>
                    </div>
                </div>

                {/* OneSignal Dashboard Link */}
                <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Bell size={24} color="var(--primary)" />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Dashboard OneSignal</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                Voir les statistiques détaillées, segments et historique
                            </p>
                        </div>
                        <a
                            href="https://app.onesignal.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ textDecoration: 'none' }}
                        >
                            <ExternalLink size={16} />
                            Ouvrir
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
