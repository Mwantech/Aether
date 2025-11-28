import React, { useEffect, useRef, useState } from 'react';

interface LogViewerProps {
    logs: string[];
    height?: number;
    deploymentId?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs: initialLogs, height = 400, deploymentId }) => {
    const [logs, setLogs] = useState<string[]>(initialLogs);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    useEffect(() => {
        if (!deploymentId) return;

        const eventSource = new EventSource(`http://localhost:3000/deployments/${deploymentId}/logs`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setLogs(prev => [...prev, `[${new Date(data.timestamp).toLocaleTimeString()}] ${data.message}`]);
        };

        return () => {
            eventSource.close();
        };
    }, [deploymentId]);

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="bg-[#0d1117] rounded-md border border-gray-800 overflow-hidden">
            <div className="bg-surface border-b border-gray-800 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-mono text-muted">Build Logs</span>
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
            </div>
            <div
                style={{ height }}
                className="overflow-y-auto p-4 font-mono text-xs text-gray-300 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
                {logs.map((log, index) => (
                    <div key={index} className="px-2 py-0.5 hover:bg-white/5 whitespace-pre-wrap break-all">
                        {log}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
