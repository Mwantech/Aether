import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Activity, Box, CheckCircle, Clock, GitBranch, Plus, Server, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await api.get('/projects');
            return res.data;
        }
    });

    const { data: recentDeployments } = useQuery({
        queryKey: ['recent-deployments'],
        queryFn: async () => {
            const res = await api.get('/deployments'); // New endpoint
            return res.data;
        }
    });

    // Calculate stats
    const totalProjects = projects?.length || 0;
    const totalDeployments = recentDeployments?.length || 0; // This is just recent, ideally we'd get total from API
    const successfulDeployments = recentDeployments?.filter((d: any) => d.status === 'READY').length || 0;
    const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 100;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text">Overview</h2>
                    <p className="text-muted mt-1">Welcome back. Here's what's happening with your projects.</p>
                </div>
                <Link to="/projects">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <Box className="h-4 w-4 text-muted" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProjects}</div>
                        <p className="text-xs text-muted">Active applications</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Deployments</CardTitle>
                        <Activity className="h-4 w-4 text-muted" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDeployments}</div>
                        <p className="text-xs text-muted">In the last 24 hours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{successRate}%</div>
                        <p className="text-xs text-muted">Deployment reliability</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Server className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">Operational</div>
                        <p className="text-xs text-muted">All systems normal</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentDeployments?.map((deploy: any) => (
                                <div key={deploy.id} className="flex items-center">
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center border",
                                        deploy.status === 'READY' ? "bg-success/10 border-success/20 text-success" :
                                            deploy.status === 'FAILED' ? "bg-error/10 border-error/20 text-error" :
                                                "bg-warning/10 border-warning/20 text-warning"
                                    )}>
                                        {deploy.status === 'READY' ? <CheckCircle className="h-5 w-5" /> :
                                            deploy.status === 'FAILED' ? <XCircle className="h-5 w-5" /> :
                                                <Activity className="h-5 w-5 animate-pulse" />}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{deploy.project.name}</p>
                                        <p className="text-xs text-muted">
                                            {deploy.status === 'READY' ? 'Deployment successful' :
                                                deploy.status === 'FAILED' ? 'Deployment failed' : 'Building...'}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted">
                                        {new Date(deploy.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                            {(!recentDeployments || recentDeployments.length === 0) && (
                                <div className="text-center py-4 text-muted">No recent activity</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Projects List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects?.slice(0, 5).map((project: any) => (
                                <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded bg-surface border border-gray-800 flex items-center justify-center">
                                            <Box className="h-4 w-4 text-muted" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{project.name}</div>
                                            <div className="text-xs text-muted flex items-center">
                                                <GitBranch className="w-3 h-3 mr-1" />
                                                {project.branch}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        project.status === 'ACTIVE' ? "bg-success" : "bg-error"
                                    )} />
                                </Link>
                            ))}
                            <Link to="/projects">
                                <Button variant="secondary" className="w-full mt-4">View All Projects</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
