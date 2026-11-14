import 'reflect-metadata'
import Fastify from 'fastify'
import { helloRoutes } from './infra/graphql/health'
import cors from "@fastify/cors";
import {env} from './env'
import { ApolloServer, BaseContext } from "@apollo/server";
import fastifyApollo, { fastifyApolloDrainPlugin } from "@as-integrations/fastify";
import { buildSchema } from 'type-graphql';
import { AuthResolver } from './infra/graphql/auth.resolver';
import { UserResolver } from './infra/graphql/user.resolver';

async function bootstrap(){
    const fastify = Fastify({logger: true})
    await fastify.register(cors, { origin: [`http://localhost:${env.PORT}`] });

    const schema = await buildSchema({
        resolvers: [AuthResolver, UserResolver],
        validate: false,
        emitSchemaFile: './schema.graphql'
    })

    const apollo = new ApolloServer<BaseContext>({
        schema,
        plugins: [fastifyApolloDrainPlugin(fastify)],
        });

        await apollo.start();

    fastify.register(helloRoutes)
    await fastify.register(fastifyApollo(apollo));
    fastify.listen({port: env.PORT}, () => console.log(`rodando na porta: ${env.PORT}`))
}


bootstrap()
