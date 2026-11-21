import 'reflect-metadata'
import Fastify from 'fastify'
import { helloRoutes } from './infra/graphql/health'
import cors from "@fastify/cors";
import {env} from './env'
import { ApolloServer } from "@apollo/server";
import fastifyApollo, { fastifyApolloDrainPlugin } from "@as-integrations/fastify";
import { buildSchema } from 'type-graphql';
import { AuthResolver } from './infra/graphql/auth.resolver';
import { UserResolver } from './infra/graphql/user.resolver';
import { CategoryResolver } from './infra/graphql/category.resolver';
import { TransactionResolver } from './infra/graphql/transaction.resolver';
import { RecurringTransactionResolver } from './infra/graphql/recurring-transaction.resolver';
import { createPrismaClient } from './infra/database/prisma/prisma';
import { PrismaUserRepository } from './infra/database/prisma/repositories/prisma-user-repository';
import { PrismaCategoryRepository } from './infra/database/prisma/repositories/prisma-category-repository';
import { PrismaTransactionRepository } from './infra/database/prisma/repositories/prisma-transaction-repository';
import { PrismaRecurringTransactionRepository } from './infra/database/prisma/repositories/prisma-recurring-transaction-repository';
import { SystemClock } from './infra/clock/system-clock';
import { RecurringTransactionsGenerator } from './application/services/recurring-transactions-generator';
import { formatError } from './infra/graphql/format-error';
import { authChecker } from './infra/graphql/auth/auth-checker';
import { GraphQLContext, makeContext } from './infra/graphql/auth/context';
import { CreateUserUseCase } from './application/use-cases/create-user-use-case';
import { FindUserUseCase } from './application/use-cases/find-user-use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user-use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user-use-case';
import { LoginUserUseCase } from './application/use-cases/login-user-use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category-use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category-use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category-use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories-use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction-use-case';
import { UpdateTransactionUseCase } from './application/use-cases/update-transaction-use-case';
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction-use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions-use-case';
import { CreateRecurringTransactionUseCase } from './application/use-cases/create-recurring-transaction-use-case';
import { UpdateRecurringTransactionUseCase } from './application/use-cases/update-recurring-transaction-use-case';
import { EndRecurringTransactionUseCase } from './application/use-cases/end-recurring-transaction-use-case';
import { ListRecurringTransactionsUseCase } from './application/use-cases/list-recurring-transactions-use-case';
import { BcryptPasswordHasher } from './infra/cryptography/bcrypt-password-hasher';
import { JwtTokenSigner } from './infra/cryptography/jwt-token-signer';
import { registerRecurringTransactionsJob } from './infra/jobs/recurring-transactions-job';

async function bootstrap(){
    const fastify = Fastify({logger: true})
    await fastify.register(cors, { origin: [env.WEB_URL] });

    const prisma = createPrismaClient(env.DATABASE_URL)
    fastify.addHook('onClose', () => prisma.$disconnect())

    const userRepository = new PrismaUserRepository(prisma)
    const categoryRepository = new PrismaCategoryRepository(prisma)
    const transactionRepository = new PrismaTransactionRepository(prisma)
    const recurringTransactionRepository = new PrismaRecurringTransactionRepository(prisma)
    const recurringTransactionsGenerator = new RecurringTransactionsGenerator(
        recurringTransactionRepository,
        transactionRepository,
        new SystemClock(),
    )
    registerRecurringTransactionsJob(fastify, recurringTransactionsGenerator)
    const passwordHasher = new BcryptPasswordHasher()
    const tokenSigner = new JwtTokenSigner(env.JWT_SECRET, env.JWT_EXPIRES_IN)
    const createUser = new CreateUserUseCase(userRepository, passwordHasher, tokenSigner)
    const loginUser = new LoginUserUseCase(userRepository, passwordHasher, tokenSigner)
    const findUser = new FindUserUseCase(userRepository)
    const updateUser = new UpdateUserUseCase(userRepository)
    const deleteUser = new DeleteUserUseCase(userRepository)
    const createCategory = new CreateCategoryUseCase(categoryRepository)
    const updateCategory = new UpdateCategoryUseCase(categoryRepository)
    const deleteCategory = new DeleteCategoryUseCase(categoryRepository)
    const listCategories = new ListCategoriesUseCase(categoryRepository)
    const createTransaction = new CreateTransactionUseCase(transactionRepository, categoryRepository)
    const updateTransaction = new UpdateTransactionUseCase(transactionRepository, categoryRepository)
    const deleteTransaction = new DeleteTransactionUseCase(transactionRepository)
    const listTransactions = new ListTransactionsUseCase(transactionRepository)
    const createRecurringTransaction = new CreateRecurringTransactionUseCase(
        recurringTransactionRepository,
        categoryRepository,
        recurringTransactionsGenerator,
    )
    const updateRecurringTransaction = new UpdateRecurringTransactionUseCase(recurringTransactionRepository, categoryRepository)
    const endRecurringTransaction = new EndRecurringTransactionUseCase(recurringTransactionRepository)
    const listRecurringTransactions = new ListRecurringTransactionsUseCase(recurringTransactionRepository)
    const resolvers = [
        new AuthResolver(createUser, loginUser),
        new UserResolver(findUser, updateUser, deleteUser),
        new CategoryResolver(createCategory, updateCategory, deleteCategory, listCategories),
        new TransactionResolver(createTransaction, updateTransaction, deleteTransaction, listTransactions),
        new RecurringTransactionResolver(
            createRecurringTransaction,
            updateRecurringTransaction,
            endRecurringTransaction,
            listRecurringTransactions,
        ),
    ]

    const schema = await buildSchema({
        resolvers: [AuthResolver, UserResolver, CategoryResolver, TransactionResolver, RecurringTransactionResolver],
        container: { get: (cls) => resolvers.find((resolver) => resolver instanceof cls) },
        authChecker,
        validate: false,
        emitSchemaFile: './schema.graphql'
    })

    const apollo = new ApolloServer<GraphQLContext>({
        schema,
        formatError,
        plugins: [fastifyApolloDrainPlugin(fastify)],
        });

        await apollo.start();

    fastify.register(helloRoutes)
    await fastify.register(fastifyApollo(apollo), { context: makeContext(tokenSigner) });
    await fastify.listen({port: env.PORT})
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.once(signal, () => {
            fastify.close().catch((err) => {
                fastify.log.error({ err }, 'Falha ao encerrar o servidor')
                process.exitCode = 1
            })
        })
    }
}


bootstrap()
