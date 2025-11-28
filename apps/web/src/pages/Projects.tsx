import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, GitBranch, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { CreateProjectModal } from '../components/CreateProjectModal';

const ProjectCard = ({ project }: any) => {
    const lastDeploy = project.deployments?.[0];

    return (
        <Link to={`/projects/${project.id}`}>
            <Card className="hover:border-accent/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-accent/5">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="group-hover:text-accent transition-colors">{project.name}</CardTitle>
                            <div className="flex items-center text-sm text-muted space-x-2">
                                <GitBranch className="w-4 h-4" />
                                <span>{project.branch}</span>
                            </div>
                        </div>
                        {lastDeploy && (
                            <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                lastDeploy.status === 'READY' ? "bg-success/10 text-success" :
                                    lastDeploy.status === 'FAILED' ? "bg-error/10 text-error" :
                                        "bg-warning/10 text-warning"
                            )}>
                                {lastDeploy.status}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-sm text-muted">
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {lastDeploy ? new Date(lastDeploy.createdAt).toLocaleDateString() : 'No deploys'}
                    </div>
                    {project.domain && (
                        <a href={`http://${project.domain}`} target="_blank" rel="noreferrer" className="flex items-center hover:text-text" onClick={e => e.stopPropagation()}>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </Card>
        </Link>
    );
};

export const Projects = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await api.get('/projects');
            return res.data;
        }
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text">Projects</h2>
                    <p className="text-muted mt-1">Manage your deployed applications.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            ) : projects?.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-surface/30">
                    <h3 className="text-lg font-medium text-text">No projects found</h3>
                    <p className="text-muted mt-2 mb-6">Get started by creating your first project.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects?.map((project: any) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
};
