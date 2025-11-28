import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GitBranch, Play, Clock, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { LogViewer } from '../components/LogViewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const EnvVarsEditor = ({ initialVars, onSave, isSaving }: { initialVars: Record<string, string>, onSave: (vars: Record<string, string>) => void, isSaving: boolean }) => {
    const [vars, setVars] = React.useState<{ key: string, value: string }[]>(
        Object.entries(initialVars).map(([key, value]) => ({ key, value }))
    );
    const [pasteMode, setPasteMode] = React.useState(false);
    const [pasteContent, setPasteContent] = React.useState('');

    // Sync with initialVars when they change (e.g. after save or refetch)
    React.useEffect(() => {
        setVars(Object.entries(initialVars).map(([key, value]) => ({ key, value })));
    }, [initialVars]);

    const handleAdd = () => {
        setVars([...vars, { key: '', value: '' }]);
    };

    const handleRemove = (index: number) => {
        const newVars = [...vars];
        newVars.splice(index, 1);
        setVars(newVars);
    };

    const handleChange = (index: number, field: 'key' | 'value', value: string) => {
        const newVars = [...vars];
        newVars[index][field] = value;
        setVars(newVars);
    };

    const handleSave = () => {
        const varsObj = vars.reduce((acc, { key, value }) => {
            if (key.trim()) acc[key.trim()] = value;
            return acc;
        }, {} as Record<string, string>);
        onSave(varsObj);
    };

    const handleParseEnv = () => {
        const lines = pasteContent.split('\n');
        const newVars = [...vars];

        lines.forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                newVars.push({ key, value });
            }
        });

        setVars(newVars);
        setPasteMode(false);
        setPasteContent('');
    };

    return (
        <div className="space-y-4">
            {!pasteMode ? (
                <>
                    <div className="space-y-2">
                        {vars.map((v, i) => (
                            <div key={i} className="flex space-x-2">
                                <input
                                    placeholder="KEY"
                                    value={v.key}
                                    onChange={(e) => handleChange(i, 'key', e.target.value)}
                                    className="flex-1 bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                                />
                                <input
                                    placeholder="VALUE"
                                    value={v.value}
                                    onChange={(e) => handleChange(i, 'value', e.target.value)}
                                    className="flex-1 bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                                />
                                <Button variant="secondary" onClick={() => handleRemove(i)} className="px-3">
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <div className="space-x-2">
                            <Button variant="secondary" onClick={handleAdd} size="sm">
                                + Add Variable
                            </Button>
                            <Button variant="secondary" onClick={() => setPasteMode(true)} size="sm">
                                Import .env
                            </Button>
                        </div>
                        <Button onClick={handleSave} isLoading={isSaving} size="sm">
                            Save Changes
                        </Button>
                    </div>
                </>
            ) : (
                <div className="space-y-2">
                    <textarea
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        placeholder="Paste your .env content here..."
                        className="w-full h-48 bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                    />
                    <div className="flex space-x-2">
                        <Button onClick={handleParseEnv} size="sm">
                            Load Variables
                        </Button>
                        <Button variant="secondary" onClick={() => setPasteMode(false)} size="sm">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ProjectDetails = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const { data: project, isLoading } = useQuery({
        queryKey: ['project', id],
        queryFn: async () => {
            const res = await api.get(`/projects`); // Ideally we'd have a get-one endpoint, but filtering for POC
            return res.data.find((p: any) => p.id === id);
        }
    });

    const deployMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/projects/${id}/deploy`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            // In a real app, we'd start polling or listening to WS here
        }
    });

    const [rootCandidates, setRootCandidates] = React.useState<string[]>([]);
    const [selectedRoot, setSelectedRoot] = React.useState<string>('/');

    const scanMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/projects/${id}/detect-roots`);
            return res.data.roots;
        },
        onSuccess: (roots) => {
            setRootCandidates(roots);
            if (roots.length > 0) setSelectedRoot(roots[0]);
        }
    });

    const updateProjectMutation = useMutation({
        mutationFn: async (data: { name?: string, rootDir?: string, buildCommand?: string, outputDir?: string, installCommand?: string, envVars?: Record<string, string>, branch?: string, runtime?: string, domain?: string }) => {
            const res = await api.patch(`/projects/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/projects/${id}`);
        },
        onSuccess: () => {
            window.location.href = '/dashboard';
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            await api.patch(`/projects/${id}`, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        }
    });

    const [projectName, setProjectName] = React.useState('');

    React.useEffect(() => {
        if (project) {
            setProjectName(project.name);
        }
    }, [project]);

    const latestDeploy = project?.deployments?.[0];

    const logs = React.useMemo(() =>
        latestDeploy?.logs ? latestDeploy.logs.split('\n') : ['Waiting for logs...'],
        [latestDeploy?.logs]
    );

    const previewUrl = project ? `http://${project.name}.aether.localhost:3005` : '';

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>;
    if (!project) return <div className="p-12 text-center text-muted">Project not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-text">{project.name}</h1>
                    <div className="flex items-center mt-2 text-muted space-x-4">
                        <div className="flex items-center space-x-2">
                            <GitBranch className="w-4 h-4" />
                            <span>{project.branch}</span>
                        </div>
                        <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 hover:text-accent">
                            <ExternalLink className="w-4 h-4" />
                            <span>Repository</span>
                        </a>
                        {latestDeploy?.status === 'READY' && (
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-success hover:text-success/80">
                                <ExternalLink className="w-4 h-4" />
                                <span>Visit App</span>
                            </a>
                        )}
                    </div>
                </div>
                <Button
                    onClick={() => deployMutation.mutate()}
                    isLoading={deployMutation.isPending || latestDeploy?.status === 'QUEUED' || latestDeploy?.status === 'BUILDING'}
                    disabled={latestDeploy?.status === 'QUEUED' || latestDeploy?.status === 'BUILDING'}
                    className="bg-success hover:bg-success/90"
                >
                    {latestDeploy?.status === 'QUEUED' || latestDeploy?.status === 'BUILDING' ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deploying...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Deploy Now
                        </>
                    )}
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Preview Card */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>App Preview</CardTitle>
                            </CardHeader>
                            <div className="p-6 pt-0">
                                <div className="aspect-video bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-center overflow-hidden relative">
                                    {latestDeploy?.imageUrl ? (
                                        <img src={latestDeploy.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-muted flex flex-col items-center">
                                            <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                                <ExternalLink className="w-8 h-8 opacity-20" />
                                            </div>
                                            <span>No preview available</span>
                                            {latestDeploy?.status === 'READY' && (
                                                <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-2 text-accent hover:underline text-sm">
                                                    Open App ↗
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {latestDeploy?.status === 'BUILDING' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                            <div className="flex flex-col items-center text-white">
                                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                                <span>Building...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Recent History */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <div className="p-6 pt-0 space-y-4">
                                {project.deployments?.slice(0, 5).map((deploy: any) => (
                                    <div key={deploy.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-gray-800/50">
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                deploy.status === 'READY' ? "bg-success" :
                                                    deploy.status === 'FAILED' ? "bg-error" : "bg-warning"
                                            )} />
                                            <div className="text-sm">
                                                <div className="font-medium">{deploy.status}</div>
                                                <div className="text-xs text-muted">
                                                    {new Date(deploy.createdAt).toLocaleDateString()}
                                                    {deploy.outputSize && ` • ${formatBytes(deploy.outputSize)}`}
                                                </div>
                                            </div>
                                        </div>
                                        <Clock className="w-4 h-4 text-muted" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Build Logs</CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0">
                            <LogViewer
                                logs={logs}
                                height={500}
                                deploymentId={latestDeploy?.id}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    {/* Configuration Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Project Name</label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                        {projectName !== project.name && (
                                            <Button
                                                onClick={() => updateProjectMutation.mutate({ name: projectName })}
                                                isLoading={updateProjectMutation.isPending}
                                            >
                                                Save
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted">
                                        Deployment URL: {previewUrl}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Branch</label>
                                    <input
                                        type="text"
                                        defaultValue={project.branch || 'main'}
                                        onBlur={(e) => updateProjectMutation.mutate({ branch: e.target.value })}
                                        className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                    <p className="text-xs text-muted">
                                        Git branch to deploy.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Custom Domain</label>
                                <input
                                    type="text"
                                    placeholder="myapp.com"
                                    defaultValue={project.domain || ''}
                                    onBlur={(e) => updateProjectMutation.mutate({ domain: e.target.value })}
                                    className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                                <p className="text-xs text-muted">
                                    Map a custom domain to your deployment.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Root Directory</label>
                                <div className="flex space-x-2">
                                    <div className="flex-1">
                                        {rootCandidates.length > 0 ? (
                                            <select
                                                value={selectedRoot}
                                                onChange={(e) => setSelectedRoot(e.target.value)}
                                                className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                            >
                                                {rootCandidates.map(root => (
                                                    <option key={root} value={root}>{root}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={project.rootDir || '/'}
                                                readOnly
                                                className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text opacity-50 cursor-not-allowed"
                                            />
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => scanMutation.mutate()}
                                        isLoading={scanMutation.isPending}
                                    >
                                        Scan Repo
                                    </Button>
                                    {rootCandidates.length > 0 && (
                                        <Button
                                            onClick={() => updateProjectMutation.mutate({ rootDir: selectedRoot })}
                                            isLoading={updateProjectMutation.isPending}
                                        >
                                            Save
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Runtime Override</label>
                                    <select
                                        defaultValue={project.runtime || ''}
                                        onChange={(e) => updateProjectMutation.mutate({ runtime: e.target.value })}
                                        className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                        <option value="">Auto-Detect</option>
                                        <option value="node">Node.js</option>
                                        <option value="python">Python</option>
                                        <option value="docker">Docker</option>
                                        <option value="static">Static HTML</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Output Directory</label>
                                    <input
                                        type="text"
                                        placeholder="dist"
                                        defaultValue={project.outputDir || ''}
                                        onBlur={(e) => updateProjectMutation.mutate({ outputDir: e.target.value })}
                                        className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Build Command</label>
                                    <input
                                        type="text"
                                        placeholder="npm run build"
                                        defaultValue={project.buildCommand || ''}
                                        onBlur={(e) => updateProjectMutation.mutate({ buildCommand: e.target.value })}
                                        className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Install Command</label>
                                    <input
                                        type="text"
                                        placeholder="npm install"
                                        defaultValue={project.installCommand || ''}
                                        onBlur={(e) => updateProjectMutation.mutate({ installCommand: e.target.value })}
                                        className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Project Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Info</CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted uppercase">Project ID</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <code className="bg-surface px-2 py-1 rounded text-sm font-mono">{project.id}</code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(project.id)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <span className="sr-only">Copy</span>
                                            📋
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted uppercase">Created At</label>
                                    <div className="mt-1 text-sm">
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Integrations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Integrations</CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Deploy Webhook</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`http://localhost:3000/webhooks/${project.id}`}
                                        className="w-full bg-background border border-gray-700 rounded-md px-3 py-2 text-text font-mono text-sm opacity-75"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigator.clipboard.writeText(`http://localhost:3000/webhooks/${project.id}`)}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-xs text-muted">
                                    Add this URL to your Git provider's webhooks to trigger deployments on push.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Environment Variables */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Environment Variables</CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-6">
                            <p className="text-sm text-muted">
                                Define environment variables for your build and runtime.
                            </p>

                            <EnvVarsEditor
                                initialVars={project.envVars || {}}
                                onSave={(vars) => updateProjectMutation.mutate({ envVars: vars })}
                                isSaving={updateProjectMutation.isPending}
                            />
                        </div>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-error/50 mb-6">
                        <CardHeader>
                            <CardTitle className="text-error">Danger Zone</CardTitle>
                        </CardHeader>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Suspend Project</div>
                                    <div className="text-sm text-muted">Disable deployments and access.</div>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => toggleStatusMutation.mutate(project.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                                    isLoading={toggleStatusMutation.isPending}
                                >
                                    {project.status === 'SUSPENDED' ? 'Resume' : 'Suspend'}
                                </Button>
                            </div>
                            <div className="border-t border-gray-800 my-4" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-error">Delete Project</div>
                                    <div className="text-sm text-muted">Permanently remove this project and all data.</div>
                                </div>
                                <Button
                                    variant="danger"
                                    className="bg-error text-white hover:bg-error/90"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                                            deleteMutation.mutate();
                                        }
                                    }}
                                    isLoading={deleteMutation.isPending}
                                >
                                    Delete Project
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
