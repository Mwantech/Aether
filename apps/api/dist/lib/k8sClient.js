"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIngress = exports.createService = exports.createDeployment = void 0;
const k8s = __importStar(require("@kubernetes/client-node"));
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
const createDeployment = async (name, image, envVars) => {
    const deployment = {
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
    }
    catch (err) {
        if (err.response?.statusCode === 409) {
            await k8sApi.replaceNamespacedDeployment(name, 'default', deployment);
        }
        else {
            throw err;
        }
    }
};
exports.createDeployment = createDeployment;
const createService = async (name) => {
    const service = {
        metadata: { name },
        spec: {
            selector: { app: name },
            ports: [{ port: 80, targetPort: 80 }],
            type: 'ClusterIP',
        },
    };
    try {
        await k8sCoreApi.createNamespacedService('default', service);
    }
    catch (err) {
        if (err.response?.statusCode !== 409)
            throw err;
    }
};
exports.createService = createService;
const createIngress = async (name, domain) => {
    const ingress = {
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
    }
    catch (err) {
        if (err.response?.statusCode === 409) {
            await k8sNetworkingApi.replaceNamespacedIngress(name, 'default', ingress);
        }
        else {
            throw err;
        }
    }
};
exports.createIngress = createIngress;
