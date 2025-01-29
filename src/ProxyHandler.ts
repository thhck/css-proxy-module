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
    const name = url.searchParams.get('name');



		// example of error:

    //if (!name) {
    //   response.writeHead(400, { 'Content-Type': 'application/json' });
    //   response.end(JSON.stringify({ error: 'Please provide a name' }));
    //   return;
    //}


		const who = name ? name : "world !";


		// json repsonse:

    // const proxyResponse = {
    //   "hello": who
    // }
    // response.writeHead(200, { 'Content-Type': 'application/json' });
    // response.end(JSON.stringify(proxyResponse));

    // html response:
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(`<h1> hello ${who} </h1>`)
  }
}
 
