import { getLoggerFor } from '@solid/community-server';
import type { HttpHandlerInput } from '@solid/community-server';
import { HttpHandler } from '@solid/community-server';


/**
 * HTTP handler to provide a endpoint to css.
 */

export class ProxyHttpHandler extends HttpHandler {
  protected readonly logger = getLoggerFor(this);

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {

    // Parse query parameters
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const uri = url.searchParams.get('uri');



		// example of error:

    //if (!name) {
    //   response.writeHead(400, { 'Content-Type': 'application/json' });
    //   response.end(JSON.stringify({ error: 'Please provide a name' }));
    //   return;
    //}


    if (!uri) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Please provide a URI' }));
      return;
    }

    try {
      const fetchResponse = await fetch(uri);
      const contentType = fetchResponse.headers.get('content-type') || 'text/plain';
      const body = await fetchResponse.text();

      response.writeHead(200, { 'Content-Type': contentType });
      response.end(body);
    } catch (error) {
      this.logger.error(`Failed to fetch URI: ${error}`);
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Failed to fetch URI' }));
    }
  }
}
 
