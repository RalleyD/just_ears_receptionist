export default {
    async scheduled(event, env, ctx) {
        const services = [
            {
                name: "N8N Worflow",
                url: env.N8N_URL
            },
            {
                name: "Voice Receptionist Backend",
                url: env.VOICE_AGENT_BACKEND_URL
            }
        ];

        await Promise.allSettled(
            services.map(async (service) => {
                try {
                    const response = await fetch(service.url);

                    console.log(`Ping sent, response: ${response.status}`);
                } catch(error) {
                    console.error(`Ping failed: ${service.name} : `, error.message);
                }
            })
        );
    },

    // Optional: Handle HTTP requests to test the worker manually - expose an endpoint to trigger
    async fetch(request, env, ctx) {
        if (request.metho === "GET" && new URL(request.url).pathname === "/trigger") {
            await this.scheduled(null, env, ctx);

            return new Response('Health checks triggered: ', {status: 200});
        }

        return new Response('Woker for Just Ears Health Monitoring'), {
            status: 200,
            headers: {'Content-Type': 'text/plain'}
        };
    }
};


