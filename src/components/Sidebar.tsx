'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Bell, LogOut, Moon } from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/ebooks', label: 'E-Books', icon: BookOpen },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Moon size={24} />
                <span>Admin Ramadan</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <button
                    onClick={() => {
                        localStorage.removeItem('admin_logged_in');
                        window.location.href = '/';
                    }}
                    className="sidebar-link"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
