export default {
    async scheduled(event, env, ctx) {
        const url = env.BACKEND_URL + 'healthz';

        try {
            console.log(`Pinging: ${url}`);
            const response = await fetch(
                url
            );
        } catch (error) {
            console.error("Ping failed: ", error);
        }
    },

    // Optional: Handle HTTP requests to test the worker manually
    async fetch(request, env, ctx) {
        const url = env.RENDER_URL + '/healthz';
        
        try {
        const response = await fetch(url);
        return new Response(
            JSON.stringify({
            status: 'Ping sent',
            renderStatus: response.status,
            timestamp: new Date().toISOString()
            }),
            {
            headers: { 'Content-Type': 'application/json' }
            }
        );
        } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
        }
    }
};


