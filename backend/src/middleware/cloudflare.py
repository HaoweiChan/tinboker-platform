"""
Cloudflare middleware for trusted proxy handling.
Extracts real client IP from CF-Connecting-IP header when behind Cloudflare.
"""
import ipaddress
from typing import List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


# Cloudflare IP ranges (updated periodically)
# Source: https://www.cloudflare.com/ips/
CLOUDFLARE_IPV4_RANGES = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
]
CLOUDFLARE_IPV6_RANGES = [
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
]


def _build_cloudflare_networks() -> List[ipaddress.IPv4Network | ipaddress.IPv6Network]:
    """Build list of Cloudflare IP networks for validation."""
    networks = []
    for cidr in CLOUDFLARE_IPV4_RANGES:
        networks.append(ipaddress.ip_network(cidr))
    for cidr in CLOUDFLARE_IPV6_RANGES:
        networks.append(ipaddress.ip_network(cidr))
    return networks


CLOUDFLARE_NETWORKS = _build_cloudflare_networks()


def is_cloudflare_ip(ip_str: str) -> bool:
    """Check if an IP address belongs to Cloudflare."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in network for network in CLOUDFLARE_NETWORKS)
    except ValueError:
        return False


class CloudflareMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle requests proxied through Cloudflare.
    
    When a request comes from a Cloudflare IP, this middleware:
    - Extracts the real client IP from CF-Connecting-IP header
    - Stores both the Cloudflare IP and real client IP in request state
    - Adds country information from CF-IPCountry header if available
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get the connecting IP (might be Cloudflare or direct)
        client_host = request.client.host if request.client else None
        
        # Store original values
        request.state.connecting_ip = client_host
        request.state.real_client_ip = client_host
        request.state.is_cloudflare = False
        request.state.cf_country = None
        
        if client_host and is_cloudflare_ip(client_host):
            # Request is from Cloudflare, extract real client IP
            request.state.is_cloudflare = True
            cf_connecting_ip = request.headers.get("CF-Connecting-IP")
            if cf_connecting_ip:
                request.state.real_client_ip = cf_connecting_ip
            # Get country code if available
            request.state.cf_country = request.headers.get("CF-IPCountry")
        
        response = await call_next(request)
        return response
