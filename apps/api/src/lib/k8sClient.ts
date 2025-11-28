import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

export const createDeployment = async (name: string, image: string, envVars: Record<string, string>) => {
    const deployment: k8s.V1Deployment = {
        metadata: { name },
        spec: {
            replicas: 1,
            selector: { matchLabels: { app: name } },
            template: {
                metadata: { labels: { app: name } },
                spec: {
                    containers: [{
                        name,
                        image,
                        ports: [{ containerPort: 80 }],
                        env: Object.entries(envVars).map(([key, value]) => ({ name: key, value })),
                    }],
                },
            },
        },
    };

    try {
        await k8sApi.createNamespacedDeployment('default', deployment);
    } catch (err: any) {
        if (err.response?.statusCode === 409) {
            await k8sApi.replaceNamespacedDeployment(name, 'default', deployment);
        } else {
            throw err;
        }
    }
};

export const createService = async (name: string) => {
    const service: k8s.V1Service = {
        metadata: { name },
        spec: {
            selector: { app: name },
            ports: [{ port: 80, targetPort: 80 }],
            type: 'ClusterIP',
        },
    };

    try {
        await k8sCoreApi.createNamespacedService('default', service);
    } catch (err: any) {
        if (err.response?.statusCode !== 409) throw err;
    }
};

export const createIngress = async (name: string, domain: string) => {
    const ingress: k8s.V1Ingress = {
        metadata: { name },
        spec: {
            rules: [{
                host: domain,
                http: {
                    paths: [{
                        path: '/',
                        pathType: 'Prefix',
                        backend: {
                            service: {
                                name,
                                port: { number: 80 },
                            },
                        },
                    }],
                },
            }],
        },
    };

    try {
        await k8sNetworkingApi.createNamespacedIngress('default', ingress);
    } catch (err: any) {
        if (err.response?.statusCode === 409) {
            await k8sNetworkingApi.replaceNamespacedIngress(name, 'default', ingress);
        } else {
            throw err;
        }
    }
};
