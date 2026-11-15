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
import { InMemoryUserRepository } from './infra/database/in-memory/in-memory-user-repository';
import { CreateUserUseCase } from './application/use-cases/create-user-use-case';
import { FindUserUseCase } from './application/use-cases/find-user-use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user-use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user-use-case';

async function bootstrap(){
    const fastify = Fastify({logger: true})
    await fastify.register(cors, { origin: [`http://localhost:${env.PORT}`] });

    // Troca aqui pelo repositório do Drizzle quando o banco entrar.
    const userRepository = new InMemoryUserRepository()
    const createUser = new CreateUserUseCase(userRepository)
    const findUser = new FindUserUseCase(userRepository)
    const updateUser = new UpdateUserUseCase(userRepository)
    const deleteUser = new DeleteUserUseCase(userRepository)
    const resolvers = [
        new AuthResolver(createUser),
        new UserResolver(findUser, updateUser, deleteUser),
    ]

    const schema = await buildSchema({
        resolvers: [AuthResolver, UserResolver],
        container: { get: (cls) => resolvers.find((resolver) => resolver instanceof cls) },
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
