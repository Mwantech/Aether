import React from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Settings = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text">Settings</h2>
                <p className="text-muted mt-1">Manage your account and global preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-muted">Email</label>
                        <input
                            type="email"
                            disabled
                            value="admin@aether.local"
                            className="w-full max-w-md bg-background/50 border border-gray-700 rounded-md px-3 py-2 text-text opacity-60 cursor-not-allowed"
                        />
                    </div>
                    <Button variant="secondary">Change Password</Button>
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Registry Configuration</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                    <p className="text-sm text-muted">Configure your local Docker registry connection.</p>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-muted">Registry URL</label>
                        <input
                            type="text"
                            defaultValue="localhost:32000"
                            className="w-full max-w-md bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <Button>Save Changes</Button>
                </div>
            </Card>
        </div>
    );
};
