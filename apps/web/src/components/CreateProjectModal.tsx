import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle } from './ui/Card';
import api from '../lib/api';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
    const [name, setName] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('main');
    const [error, setError] = useState('');

    const queryClient = useQueryClient();

    const createProject = useMutation({
        mutationFn: async (data: { name: string; repoUrl: string; branch: string }) => {
            const res = await api.post('/projects', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
            setName('');
            setRepoUrl('');
            setBranch('main');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to create project');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        createProject.mutate({ name, repoUrl, branch });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-lg p-4">
                <Card className="relative border-gray-800 bg-surface shadow-xl">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-muted hover:text-text"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <CardHeader>
                        <CardTitle>Create New Project</CardTitle>
                    </CardHeader>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted">Project Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                placeholder="my-awesome-app"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted">Git Repository URL</label>
                            <input
                                type="url"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                placeholder="https://github.com/username/repo.git"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted">Branch</label>
                            <input
                                type="text"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                placeholder="main"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createProject.isPending}>
                                Create Project
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};
