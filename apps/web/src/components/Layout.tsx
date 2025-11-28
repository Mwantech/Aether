import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Box, Settings, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, to, onClick }: { icon: any, label: string, to: string, onClick?: () => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} onClick={onClick}>
            <div className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1",
                isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface hover:text-text"
            )}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
            </div>
        </Link>
    );
};

export const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background text-text flex">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-gray-800 bg-primary hidden md:flex flex-col p-4">
                <div className="px-2 py-4 mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent">
                        Aether
                    </h1>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
                    <SidebarItem icon={Box} label="Projects" to="/projects" />
                    <SidebarItem icon={Settings} label="Settings" to="/settings" />
                </nav>


            </aside>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-primary p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-bold text-white">Aether</h1>
                            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        <nav className="space-y-2">
                            <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" onClick={() => setIsMobileMenuOpen(false)} />
                            <SidebarItem icon={Box} label="Projects" to="/projects" onClick={() => setIsMobileMenuOpen(false)} />
                            <SidebarItem icon={Settings} label="Settings" to="/settings" onClick={() => setIsMobileMenuOpen(false)} />

                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 py-4 bg-primary/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="md:hidden">
                        <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)}><Menu /></Button>
                    </div>
                    <div className="flex items-center space-x-4 ml-auto">
                        <span className="text-sm text-muted hidden sm:inline-block">{user?.email}</span>
                        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted hover:text-error">
                            <LogOut className="w-5 h-5" />
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary ring-2 ring-surface" />
                    </div>
                </header>

                <div className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
