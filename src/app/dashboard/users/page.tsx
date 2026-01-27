'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, RefreshCw, Trash2, RotateCcw, X, Phone, User, Mail } from 'lucide-react';
import {
    getActivationCodes,
    searchCodes,
    addActivationCode,
    deleteActivationCode,
    resetDeviceActivation,
    type ActivationCode,
} from '@/lib/supabase';

export default function UsersPage() {
    const [codes, setCodes] = useState<ActivationCode[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCode, setNewCode] = useState({ phone: '', customer_name: '', customer_email: '' });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const limit = 15;

    const loadCodes = async () => {
        setLoading(true);
        try {
            if (searchQuery) {
                const results = await searchCodes(searchQuery);
                setCodes(results);
                setTotal(results.length);
            } else {
                const result = await getActivationCodes(page, limit);
                setCodes(result.codes);
                setTotal(result.total);
            }
        } catch (error) {
            console.error('Error loading codes:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCodes();
    }, [page, searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadCodes();
    };

    const handleAddCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('add');

        const result = await addActivationCode(newCode);

        if (result.success) {
            setShowAddModal(false);
            setNewCode({ phone: '', customer_name: '', customer_email: '' });
            loadCodes();
        } else {
            alert('Erreur: ' + result.error);
        }

        setActionLoading(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce code?')) return;

        setActionLoading(id);
        const result = await deleteActivationCode(id);

        if (result.success) {
            loadCodes();
        } else {
            alert('Erreur: ' + result.error);
        }

        setActionLoading(null);
    };

    const handleReset = async (id: string) => {
        if (!confirm('Réinitialiser cet appareil? L\'utilisateur devra se reconnecter.')) return;

        setActionLoading(id);
        const result = await resetDeviceActivation(id);

        if (result.success) {
            loadCodes();
        } else {
            alert('Erreur: ' + result.error);
        }

        setActionLoading(null);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                        Utilisateurs
                    </h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        Gérer les codes d&apos;activation ({total} total)
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Ajouter un code
                </button>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                        <input
                            type="text"
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Rechercher par téléphone, nom ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={loadCodes}>
                        <RefreshCw size={18} />
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="card">
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Téléphone</th>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Order ID</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codes.map((code) => (
                                        <tr key={code.id}>
                                            <td style={{ fontFamily: 'monospace' }}>{code.phone}</td>
                                            <td>{code.customer_name || '-'}</td>
                                            <td style={{ color: 'var(--muted)' }}>{code.customer_email || '-'}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                {code.order_id.substring(0, 15)}...
                                            </td>
                                            <td>
                                                <span className={`badge ${code.used ? 'badge-success' : 'badge-warning'}`}>
                                                    {code.used ? 'Activé' : 'En attente'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                                                {new Date(code.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {code.used && (
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.5rem' }}
                                                            onClick={() => handleReset(code.id)}
                                                            disabled={actionLoading === code.id}
                                                            title="Réinitialiser l'appareil"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.5rem' }}
                                                        onClick={() => handleDelete(code.id)}
                                                        disabled={actionLoading === code.id}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {codes.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                                                Aucun code trouvé
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Précédent
                                </button>
                                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                                    Page {page} sur {totalPages}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Ajouter un code d&apos;activation</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddCode}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Téléphone *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                    <input
                                        type="tel"
                                        className="input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="+221 77 123 45 67"
                                        value={newCode.phone}
                                        onChange={(e) => setNewCode({ ...newCode, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Nom du client
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="Amadou Diallo"
                                        value={newCode.customer_name}
                                        onChange={(e) => setNewCode({ ...newCode, customer_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Email
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                    <input
                                        type="email"
                                        className="input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="email@example.com"
                                        value={newCode.customer_email}
                                        onChange={(e) => setNewCode({ ...newCode, customer_email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading === 'add'}>
                                    {actionLoading === 'add' ? 'Ajout...' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
