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
    }
};
