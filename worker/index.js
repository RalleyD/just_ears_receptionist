export default {
    async scheduled(event, env, ctx) {
        const url = env.BACKEND_URL;

        try {
            console.log(`Pinging: ${url}`);
            const response = await fetch(
                `${url}/ping?msg=keep_alive`
            );
        } catch (error) {
            console.error("Ping failed: ", error);
        }
    }
};
