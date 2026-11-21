import type { FastifyInstance } from 'fastify'

export async function helloRoutes(app: FastifyInstance) {
    app.get('/health', async () => {
        return { message: 'ok' }
    })
}