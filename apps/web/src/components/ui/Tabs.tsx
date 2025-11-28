import React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
}

const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (value: string) => void } | null>(null);

export const Tabs = ({ defaultValue, className, children }: TabsProps) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-surface border border-gray-800 p-1 text-muted", className)}>
            {children}
        </div>
    );
};

export const TabsTrigger = ({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.activeTab === value;

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-gray-700 text-white shadow-sm" : "hover:bg-gray-800 hover:text-gray-200",
                className
            )}
            onClick={() => context.setActiveTab(value)}
        >
            {children}
        </button>
    );
};

export const TabsContent = ({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.activeTab !== value) return null;

    return (
        <div className={cn("mt-4 ring-offset-background focus-visible:outline-none", className)}>
            {children}
        </div>
    );
};
