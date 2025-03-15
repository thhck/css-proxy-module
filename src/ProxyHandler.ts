import { getLoggerFor } from '@solid/community-server';
import type { HttpHandlerInput } from '@solid/community-server';
import { HttpHandler } from '@solid/community-server';
import { lookup } from 'dns/promises';
import ipRange from 'ip-range-check';
import { isIP } from 'net';

// Reserved IP ranges
const RESERVED_IP_RANGES = [
  '127.0.0.0/8',       // loopback
  '::1/128',           // loopback
  '0.0.0.0/8',         // current network
  '169.254.0.0/16',    // link-local
  '10.0.0.0/8',        // private network
  '100.64.0.0/10',     // Shared Address Space
  '172.16.0.0/12',     // private network
  '192.0.0.0/24',      // IETF Protocol Assignments
  '192.0.2.0/24',      // TEST-NET-1, documentation and examples
  '192.88.99.0/24',    // IPv6 to IPv4 relay (includes 2002::/16)
  '192.168.0.0/16',    // private network
  '198.18.0.0/15',     // network benchmark tests
  '198.51.100.0/24',   // TEST-NET-2, documentation and examples
  '203.0.113.0/24',    // TEST-NET-3, documentation and examples
  '224.0.0.0/4',       // IP multicast (former Class D network)
  '240.0.0.0/4',       // reserved (former Class E network)
  '255.255.255.255',   // broadcast
  '64:ff9b::/96',      // IPv4/IPv6 translation (RFC 6052)
  '100::/64',          // discard prefix (RFC 6666)
  '2001::/32',         // Teredo tunneling
  '2001:10::/28',      // deprecated (previously ORCHID)
  '2001:20::/28',      // ORCHIDv2
  '2001:db8::/32',     // documentation and example source code
  '2002::/16',         // 6to4
  'fc00::/7',          // unique local address
  'fe80::/10',         // link-local address
  'ff00::/8'           // multicast
];


async function proxyRequest(uri: string): Promise<{ contentType: string; body: string }> {
  // Implement proxy timeout similar to PROXY_SETTINGS.proxyTimeout (10,000ms)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const fetchResponse = await fetch(uri, { signal: controller.signal, redirect: 'follow' });
    const contentType = fetchResponse.headers.get('content-type') || 'text/plain';
    const body = await fetchResponse.text();
    return { contentType, body };
  } finally {
    clearTimeout(timeout);
  }
}
/**
 * HTTP handler to provide a proxy endpoint with:
 * 1. URL validation,
 * 2. DNS lookup/IP validation, and
 * 3. CORS support.
 */
export class ProxyHttpHandler extends HttpHandler {
  protected readonly logger = getLoggerFor(this);

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {
    // ---  CORS Handling ---
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader(
      'Access-Control-Expose-Headers',
      'Authorization, User, Location, Link, Vary, Last-Modified, Content-Length, Content-Location, MS-Author-Via, X-Powered-By'
    );
    response.setHeader('Access-Control-Max-Age', '1728000');

    // --- Parse Query Parameter ---
    const requestUrl = new URL(request.url!, `http://${request.headers.host}`);
    const uri = requestUrl.searchParams.get('uri');

    if (!uri) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Please provide a URI' }));
      return;
    }

    // --- URL Validation ---

    // Parse the target URL to extract hostname and protocol.
    let targetUrl: URL;
    try {
      targetUrl = new URL(uri); // this should be the same as 'validUrl.isUri
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: `Invalid URL format: ${uri}` }));
      return;
    }

    // --- DNS Lookup and IP Validation ---
    let hostAddress: string;
    if (isIP(targetUrl.hostname)) {
      hostAddress = targetUrl.hostname;
    } else {
      try {
        const dnsResult = await lookup(targetUrl.hostname);
        hostAddress = dnsResult.address;
      } catch (err) {
        this.logger.error(`DNS lookup failed for ${targetUrl.hostname}: ${err}`);
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: `Cannot resolve hostname: ${targetUrl.hostname}` }));
        return;
      }
    }

    if (RESERVED_IP_RANGES.some(range => ipRange(hostAddress, range))) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: `Cannot proxy ${uri}` }));
      return;
    }

    // --- Proxy the Request ---
    try {
      const { contentType, body } = await proxyRequest(uri);
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(body);
    } catch (error) {
      this.logger.error(`Failed to proxy URI: ${error}`);
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Failed to fetch URI' }));
    }
  }
}