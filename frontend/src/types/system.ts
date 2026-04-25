/**
 * System status types for admin dashboard.
 */

export interface ServiceHealth {
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
}

export interface BackendStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    uptime_seconds: number;
    version: string;
}

export interface RedisStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    connected: boolean;
    memory_mb?: number;
    message?: string;
}

export interface PostgresStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    connected: boolean;
    pool_size?: number;
    active_connections?: number;
    idle_connections?: number;
    message?: string;
}

export interface SystemMetrics {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
}

export interface SystemStatusResponse {
    timestamp: string;
    services: Record<string, ServiceHealth>;
    backend: BackendStatus;
    redis: RedisStatus;
    postgres: PostgresStatus;
    system?: SystemMetrics;
}
