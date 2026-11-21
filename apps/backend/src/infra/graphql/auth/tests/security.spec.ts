import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import fastifyApollo from '@as-integrations/fastify';
import Fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { buildSchema } from 'type-graphql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FixedClock } from '@test/clock/fixed-clock';
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category-repository';
import { InMemoryRecurringTransactionRepository } from '@test/repositories/in-memory-recurring-transaction-repository';
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction-repository';
import { InMemoryUserRepository } from '@test/repositories/in-memory-user-repository';
import { RecurringTransactionsGenerator } from '@/application/services/recurring-transactions-generator';
import { CreateCategoryUseCase } from '@/application/use-cases/create-category-use-case';
import { CreateRecurringTransactionUseCase } from '@/application/use-cases/create-recurring-transaction-use-case';
import { CreateTransactionUseCase } from '@/application/use-cases/create-transaction-use-case';
import { CreateUserUseCase } from '@/application/use-cases/create-user-use-case';
import { DeleteCategoryUseCase } from '@/application/use-cases/delete-category-use-case';
import { DeleteTransactionUseCase } from '@/application/use-cases/delete-transaction-use-case';
import { DeleteUserUseCase } from '@/application/use-cases/delete-user-use-case';
import { EndRecurringTransactionUseCase } from '@/application/use-cases/end-recurring-transaction-use-case';
import { FindUserUseCase } from '@/application/use-cases/find-user-use-case';
import { ListCategoriesUseCase } from '@/application/use-cases/list-categories-use-case';
import { ListRecurringTransactionsUseCase } from '@/application/use-cases/list-recurring-transactions-use-case';
import { ListTransactionsUseCase } from '@/application/use-cases/list-transactions-use-case';
import { LoginUserUseCase } from '@/application/use-cases/login-user-use-case';
import { UpdateCategoryUseCase } from '@/application/use-cases/update-category-use-case';
import { UpdateRecurringTransactionUseCase } from '@/application/use-cases/update-recurring-transaction-use-case';
import { UpdateTransactionUseCase } from '@/application/use-cases/update-transaction-use-case';
import { UpdateUserUseCase } from '@/application/use-cases/update-user-use-case';
import { Category } from '@/domain/entities/category';
import { RecurringTransaction } from '@/domain/entities/recurring-transaction';
import { Transaction } from '@/domain/entities/transaction';
import { User } from '@/domain/entities/user';
import { BcryptPasswordHasher } from '@/infra/cryptography/bcrypt-password-hasher';
import { JwtTokenSigner } from '@/infra/cryptography/jwt-token-signer';
import { AuthResolver } from '../../auth.resolver';
import { CategoryResolver } from '../../category.resolver';
import { formatError } from '../../format-error';
import { helloRoutes } from '../../health';
import { RecurringTransactionResolver } from '../../recurring-transaction.resolver';
import { TransactionResolver } from '../../transaction.resolver';
import { UserResolver } from '../../user.resolver';
import { authChecker } from '../auth-checker';
import { makeContext, type GraphQLContext } from '../context';

// HTTP real via Fastify.inject, com schema, resolvers, casos de uso e JWT de produção.
// Só os repositórios e o relógio são substituídos; nenhum banco ou usuário real é usado.
const secret = 'security-integration-test-secret-only';
const tokens = new JwtTokenSigner(secret, '1h');
const hasher = new BcryptPasswordHasher(4);
const date = new Date('2026-11-21T12:00:00.000Z');
const categoryData = { name: 'Categoria nova', icon: 'ticket', color: 'pink' };
const transactionData = {
  description: 'Transação nova', type: 'expense', date: date.toISOString(), valueInCents: 1000,
};
const recurrenceData = {
  description: 'Recorrência nova', type: 'expense', valueInCents: 1000,
  dayOfMonth: 25, startDate: date.toISOString(),
};
const users = new InMemoryUserRepository();
const categories = new InMemoryCategoryRepository();
const transactions = new InMemoryTransactionRepository();
const recurrences = new InMemoryRecurringTransactionRepository();
const generator = new RecurringTransactionsGenerator(recurrences, transactions, new FixedClock(date));
let app: FastifyInstance;
let apollo: ApolloServer<GraphQLContext>;
let passwordHash: string;

type Account = {
  user: User;
  category: Category;
  transaction: Transaction;
  recurrence: RecurringTransaction;
  token: string;
};
let accounts: [Account, Account];

type Operation = {
  name: string;
  query: string;
  variables?: (account: Account) => Record<string, unknown>;
};
const operations: Operation[] = [
  { name: 'me', query: '{ me { id name email } }' },
  { name: 'categories', query: '{ categories { id name } }' },
  { name: 'transactions', query: '{ transactions { id description } }' },
  { name: 'recurringTransactions', query: '{ recurringTransactions { id description } }' },
  { name: 'updateMe', query: 'mutation { updateMe(data: { name: "Nome alterado" }) { id name } }' },
  { name: 'deleteMe', query: 'mutation { deleteMe { id } }' },
  {
    name: 'createCategory',
    query: 'mutation($data: CreateCategoryInput!) { createCategory(data: $data) { id name } }',
    variables: () => ({ data: categoryData }),
  },
  {
    name: 'updateCategory',
    query: 'mutation($id: ID!, $data: UpdateCategoryInput!) { updateCategory(id: $id, data: $data) { id name } }',
    variables: a => ({ id: a.category.id, data: categoryData }),
  },
  {
    name: 'deleteCategory',
    query: 'mutation($id: ID!) { deleteCategory(id: $id) { id } }',
    variables: a => ({ id: a.category.id }),
  },
  {
    name: 'createTransaction',
    query: 'mutation($data: CreateTransactionInput!) { createTransaction(data: $data) { id description } }',
    variables: a => ({ data: { ...transactionData, categoryId: a.category.id } }),
  },
  {
    name: 'updateTransaction',
    query: 'mutation($id: ID!, $data: UpdateTransactionInput!) { updateTransaction(id: $id, data: $data) { id description } }',
    variables: a => ({ id: a.transaction.id, data: { description: 'Alterada' } }),
  },
  {
    name: 'deleteTransaction',
    query: 'mutation($id: ID!) { deleteTransaction(id: $id) { id } }',
    variables: a => ({ id: a.transaction.id }),
  },
  {
    name: 'createRecurringTransaction',
    query: 'mutation($data: CreateRecurringTransactionInput!) { createRecurringTransaction(data: $data) { id description } }',
    variables: a => ({ data: { ...recurrenceData, categoryId: a.category.id } }),
  },
  {
    name: 'updateRecurringTransaction',
    query: 'mutation($id: ID!, $data: UpdateRecurringTransactionInput!) { updateRecurringTransaction(id: $id, data: $data) { id description } }',
    variables: a => ({ id: a.recurrence.id, data: { description: 'Alterada' } }),
  },
  {
    name: 'endRecurringTransaction',
    query: 'mutation($id: ID!) { endRecurringTransaction(id: $id) { id } }',
    variables: a => ({ id: a.recurrence.id }),
  },
];

function state() {
  return [users, categories, transactions, recurrences].map(repo =>
    [...repo.items.values()].map(entity => entity.toSnapshot()),
  );
}

async function request(query: string, variables: Record<string, unknown> = {}, authorization?: string) {
  const response = await app.inject({
    method: 'POST', url: '/graphql',
    headers: authorization === undefined ? {} : { authorization },
    payload: { query, variables },
  });
  return response.json();
}

function assertDenied(result: Awaited<ReturnType<typeof request>>, code: string) {
  expect(result.data == null).toBe(true);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].extensions.code).toBe(code);
  expect(result.errors[0].extensions).not.toHaveProperty('stacktrace');
}

beforeAll(async () => {
  passwordHash = await hasher.hash('TestPassword123!');
  const resolvers = [
    new AuthResolver(new CreateUserUseCase(users, hasher, tokens), new LoginUserUseCase(users, hasher, tokens)),
    new UserResolver(new FindUserUseCase(users), new UpdateUserUseCase(users), new DeleteUserUseCase(users)),
    new CategoryResolver(
      new CreateCategoryUseCase(categories), new UpdateCategoryUseCase(categories),
      new DeleteCategoryUseCase(categories), new ListCategoriesUseCase(categories),
    ),
    new TransactionResolver(
      new CreateTransactionUseCase(transactions, categories), new UpdateTransactionUseCase(transactions, categories),
      new DeleteTransactionUseCase(transactions), new ListTransactionsUseCase(transactions),
    ),
    new RecurringTransactionResolver(
      new CreateRecurringTransactionUseCase(recurrences, categories, generator),
      new UpdateRecurringTransactionUseCase(recurrences, categories),
      new EndRecurringTransactionUseCase(recurrences), new ListRecurringTransactionsUseCase(recurrences),
    ),
  ];
  const schema = await buildSchema({
    resolvers: [AuthResolver, UserResolver, CategoryResolver, TransactionResolver, RecurringTransactionResolver],
    container: { get: cls => resolvers.find(resolver => resolver instanceof cls) },
    authChecker, validate: false,
  });
  app = Fastify();
  apollo = new ApolloServer<GraphQLContext>({ schema, formatError });
  await apollo.start();
  await app.register(helloRoutes);
  await app.register(fastifyApollo(apollo), { context: makeContext(tokens) });
  await app.ready();
});

beforeEach(async () => {
  for (const repo of [users, categories, transactions, recurrences]) repo.items.clear();
  async function seed(name: string): Promise<Account> {
    const user = await users.create(User.create({ name, email: `${name}@example.test`, password: passwordHash }));
    const category = await categories.create(Category.create({
      userId: user.id, name: `Categoria ${name}`, description: null,
      icon: 'ticket', color: 'blue', status: 'active',
    }));
    const transaction = await transactions.create(Transaction.create({
      userId: user.id, categoryId: category.id, description: `Privado ${name}`, type: 'expense',
      date, valueInCents: 9999, status: 'active', recurringTransactionId: null,
    }));
    const recurrence = await recurrences.create(RecurringTransaction.create({
      userId: user.id, categoryId: category.id, description: `Mensal ${name}`, type: 'expense',
      valueInCents: 100, dayOfMonth: 25, startDate: date,
      nextDueDate: new Date('2026-11-25T12:00:00.000Z'), status: 'active',
    }));
    return { user, category, transaction, recurrence, token: await tokens.sign({ sub: user.id }) };
  }
  accounts = [await seed('cliente-x'), await seed('cliente-y')];
});

afterAll(async () => {
  await app?.close();
  await apollo?.stop();
});

const invalidCredentials = [
  { name: 'sem Authorization', header: async (_a: Account) => undefined },
  { name: 'Bearer vazio', header: async (_a: Account) => 'Bearer ' },
  { name: 'JWT malformado', header: async (_a: Account) => 'Bearer token-invalido' },
  { name: 'esquema Basic', header: async (a: Account) => `Basic ${a.token}` },
  { name: 'assinatura de outra chave', header: async (a: Account) => `Bearer ${jwt.sign({ sub: a.user.id }, 'wrong-secret', { expiresIn: '1h' })}` },
  { name: 'JWT expirado', header: async (a: Account) => `Bearer ${jwt.sign({ sub: a.user.id }, secret, { expiresIn: '-1s' })}` },
  { name: 'JWT ainda não válido', header: async (a: Account) => `Bearer ${jwt.sign({ sub: a.user.id }, secret, { notBefore: '1h' })}` },
  { name: 'algoritmo none', header: async (a: Account) => `Bearer ${jwt.sign({ sub: a.user.id }, '', { algorithm: 'none' })}` },
  { name: 'JWT sem sub', header: async (_a: Account) => `Bearer ${jwt.sign({}, secret, { expiresIn: '1h' })}` },
  { name: 'sub numérico', header: async (_a: Account) => `Bearer ${jwt.sign({ sub: 123 }, secret, { expiresIn: '1h' })}` },
  {
    name: 'sub trocado por cliente-y sem refazer a assinatura',
    header: async (a: Account) => {
      const [header, payload, signature] = a.token.split('.');
      const forged = { ...JSON.parse(Buffer.from(payload!, 'base64url').toString()), sub: accounts[1].user.id };
      return `Bearer ${header}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${signature}`;
    },
  },
];

describe.each(invalidCredentials)('GraphQL HTTP: $name', credentials => {
  it.each(operations)('bloqueia $name sem retornar dados ou modificar registros', async operation => {
    const before = state();
    const result = await request(operation.query, operation.variables?.(accounts[0]), await credentials.header(accounts[0]));
    assertDenied(result, 'UNAUTHENTICATED');
    expect(state()).toEqual(before);
  });
});

describe('GraphQL HTTP: controles positivos', () => {
  it('exclui a própria transação das consultas e preserva outras contas', async () => {
    const result = await request(
      'mutation($id: ID!) { deleteTransaction(id: $id) { id } }',
      { id: accounts[0].transaction.id }, `Bearer ${accounts[0].token}`,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data.deleteTransaction.id).toBe(accounts[0].transaction.id);
    const listed = await request('{ transactions { id } }', {}, `Bearer ${accounts[0].token}`);
    expect(listed.errors).toBeUndefined();
    expect(listed.data.transactions).toEqual([]);
    expect((await transactions.find(accounts[0].transaction.id))?.isActive).toBe(false);
    expect((await transactions.find(accounts[1].transaction.id))?.isActive).toBe(true);
  });

  it('mantém um lançamento recorrente excluído fora das consultas mesmo ao tentar gerar novamente', async () => {
    await recurrences.update({ nextDueDate: date, dayOfMonth: 21 }, accounts[0].recurrence.id);
    await generator.generateDue();
    const generated = [...transactions.items.values()].find(t =>
      t.toSnapshot().recurringTransactionId === accounts[0].recurrence.id)!;
    const result = await request(
      'mutation($id: ID!) { deleteTransaction(id: $id) { id } }',
      { id: generated.id }, `Bearer ${accounts[0].token}`,
    );
    expect(result.errors).toBeUndefined();
    // Simula uma tentativa do job com um ponteiro antigo após falha parcial.
    await recurrences.update({ nextDueDate: date }, accounts[0].recurrence.id);
    await generator.generateDue();
    const listed = await request('{ transactions { id } }', {}, `Bearer ${accounts[0].token}`);
    expect(listed.errors).toBeUndefined();
    expect(listed.data.transactions).toEqual([{ id: accounts[0].transaction.id }]);
    expect((await transactions.find(generated.id))?.isActive).toBe(false);
  });

  it.each(operations)('permite $name com JWT válido e recursos próprios', async operation => {
    const result = await request(operation.query, operation.variables?.(accounts[0]), `Bearer ${accounts[0].token}`);
    expect(result.errors).toBeUndefined();
    expect(result.data[operation.name]).toBeDefined();
  });

  it('mantém health público', async () => {
    const result = await app.inject({ method: 'GET', url: '/health' });
    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual({ message: 'ok' });
  });

  it('permite cadastro e login públicos e aceita os JWTs retornados', async () => {
    const data = { name: 'Conta teste', email: 'nova@example.test', password: 'TestPassword123!' };
    const registered = await request(
      'mutation($data: RegisterInput!) { register(data: $data) { token user { id } } }', { data },
    );
    expect(registered.errors).toBeUndefined();
    const logged = await request(
      'mutation($data: LoginInput!) { login(data: $data) { token user { id } } }',
      { data: { email: data.email, password: data.password } }, 'Bearer invalido',
    );
    expect(logged.errors).toBeUndefined();
    for (const auth of [registered.data.register, logged.data.login]) {
      const me = await request('{ me { id } }', {}, `Bearer ${auth.token}`);
      expect(me.errors).toBeUndefined();
      expect(me.data.me.id).toBe(auth.user.id);
    }
  });

  it('nega login com senha errada sem emitir JWT', async () => {
    const result = await request(
      'mutation($data: LoginInput!) { login(data: $data) { token } }',
      { data: { email: accounts[0].user.toSnapshot().email, password: 'SenhaErrada123!' } },
    );
    assertDenied(result, 'UNAUTHENTICATED');
  });
});

describe.each([0, 1] as const)('GraphQL HTTP: isolamento, conta %i como atacante', attackerIndex => {
  it('retorna somente perfil, categorias, transações e recorrências da conta autenticada', async () => {
    const account = accounts[attackerIndex];
    const result = await request(
      '{ me { id email } categories { id } transactions { id } recurringTransactions { id } }',
      {}, `Bearer ${account.token}`,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      me: { id: account.user.id, email: account.user.toSnapshot().email },
      categories: [{ id: account.category.id }], transactions: [{ id: account.transaction.id }],
      recurringTransactions: [{ id: account.recurrence.id }],
    });
  });

  it.each(operations.filter(op => /^(updateCategory|deleteCategory|updateTransaction|deleteTransaction|updateRecurringTransaction|endRecurringTransaction)$/.test(op.name)))(
    'nega $name usando ID da outra conta e preserva os registros', async operation => {
      const before = state();
      const result = await request(
        operation.query, operation.variables?.(accounts[1 - attackerIndex]!),
        `Bearer ${accounts[attackerIndex].token}`,
      );
      assertDenied(result, 'NOT_FOUND');
      expect(state()).toEqual(before);
    },
  );

  it.each(['createTransaction', 'createRecurringTransaction', 'updateTransaction', 'updateRecurringTransaction'])(
    'nega %s com categoria da outra conta', async name => {
      const operation = operations.find(op => op.name === name)!;
      const variables = operation.variables!(accounts[attackerIndex]);
      const data = variables.data as Record<string, unknown>;
      const before = state();
      const result = await request(operation.query, {
        ...variables, data: { ...data, categoryId: accounts[1 - attackerIndex]!.category.id },
      }, `Bearer ${accounts[attackerIndex].token}`);
      assertDenied(result, 'NOT_FOUND');
      expect(state()).toEqual(before);
    },
  );

  it('altera e exclui somente a própria conta', async () => {
    const attacker = accounts[attackerIndex];
    const victim = accounts[1 - attackerIndex]!;
    const before = victim.user.toSnapshot();
    const updated = await request('mutation { updateMe(data: { name: "Alterado" }) { id } }', {}, `Bearer ${attacker.token}`);
    expect(updated.errors).toBeUndefined();
    expect(updated.data.updateMe.id).toBe(attacker.user.id);
    const deleted = await request('mutation { deleteMe { id } }', {}, `Bearer ${attacker.token}`);
    expect(deleted.errors).toBeUndefined();
    expect(deleted.data.deleteMe.id).toBe(attacker.user.id);
    expect((await users.find(victim.user.id))?.toSnapshot()).toEqual(before);
  });

  it('não gera lançamentos pendentes da outra conta ao listar transações', async () => {
    const victim = accounts[1 - attackerIndex]!;
    await recurrences.update({ nextDueDate: new Date('2026-10-25T12:00:00.000Z') }, victim.recurrence.id);
    const before = state();
    const result = await request('{ transactions { id } }', {}, `Bearer ${accounts[attackerIndex].token}`);
    expect(result.errors).toBeUndefined();
    expect(state()).toEqual(before);
  });
});

describe('GraphQL HTTP: tentativas de contornar o schema', () => {
  it.each(operations.filter(op => op.variables && !op.name.startsWith('delete') && !op.name.startsWith('end')))(
    'rejeita userId injetado no input de $name', async operation => {
      const variables = operation.variables!(accounts[0]);
      const before = state();
      const result = await request(operation.query, {
        ...variables, data: { ...(variables.data as object), userId: accounts[1].user.id },
      }, `Bearer ${accounts[0].token}`);
      expect(result.errors[0].message).toContain('userId');
      expect(result.data).toBeUndefined();
      expect(state()).toEqual(before);
    },
  );

  it('rejeita userId como argumento para consultar o perfil de outra pessoa', async () => {
    const result = await request('query($id: ID!) { me(userId: $id) { id email } }',
      { id: accounts[1].user.id }, `Bearer ${accounts[0].token}`);
    expect(result.errors[0].message).toContain('Unknown argument');
    expect(result.data).toBeUndefined();
  });

  it('não expõe senha ou hash pelo GraphQL', async () => {
    const result = await request('{ me { id password } }', {}, `Bearer ${accounts[0].token}`);
    expect(result.errors[0].message).toContain('Cannot query field "password"');
    expect(result.data).toBeUndefined();
  });

  it('protege consultas via GET com aliases e fragments', async () => {
    const query = '{ perfil: me { ...Dados } } fragment Dados on UserModel { id email }';
    const result = await app.inject({
      method: 'GET', url: `/graphql?query=${encodeURIComponent(query)}`,
      headers: { 'apollo-require-preflight': 'true' },
    });
    assertDenied(result.json(), 'UNAUTHENTICATED');
  });
});

describe('GraphQL HTTP: recorrências em dias úteis', () => {
  const create = 'mutation($data: CreateRecurringTransactionInput!) { createRecurringTransaction(data: $data) { id dayType dayOfMonth nextDueDate } }';

  it('persiste a regra e calcula feriados nacionais na API', async () => {
    const result = await request(create, { data: {
      ...recurrenceData, categoryId: accounts[0].category.id, dayOfMonth: 5,
      dayType: 'business_day', startDate: '2026-11-01T12:00:00.000Z',
    } }, `Bearer ${accounts[0].token}`);
    expect(result.errors).toBeUndefined();
    expect(result.data.createRecurringTransaction).toMatchObject({
      dayType: 'business_day', dayOfMonth: 5, nextDueDate: '2026-12-07T12:00:00.000Z',
    });
    const id = result.data.createRecurringTransaction.id;
    expect([...transactions.items.values()].filter(t => t.toSnapshot().recurringTransactionId === id)
      .map(t => t.toSnapshot().date.toISOString())).toEqual(['2026-11-09T12:00:00.000Z']);
    const listed = await request('{ recurringTransactions { id dayType dayOfMonth nextDueDate } }', {}, `Bearer ${accounts[0].token}`);
    expect(listed.errors).toBeUndefined();
    expect(listed.data.recurringTransactions).toContainEqual(result.data.createRecurringTransaction);
  });

  it('mantém clientes antigos criando dias fixos quando dayType é omitido', async () => {
    const result = await request(create, { data: { ...recurrenceData, categoryId: accounts[0].category.id } }, `Bearer ${accounts[0].token}`);
    expect(result.errors).toBeUndefined();
    expect(result.data.createRecurringTransaction).toMatchObject({ dayType: 'calendar_day', nextDueDate: '2026-11-25T12:00:00.000Z' });
  });

  it('recusa o 24º dia útil sem gravar registros', async () => {
    const before = state();
    const result = await request(create, { data: {
      ...recurrenceData, categoryId: accounts[0].category.id, dayType: 'business_day', dayOfMonth: 24,
    } }, `Bearer ${accounts[0].token}`);
    assertDenied(result, 'BAD_USER_INPUT');
    expect(state()).toEqual(before);
  });

  it('recalcula o próximo lançamento ao editar a regra pela API', async () => {
    const result = await request(
      'mutation($id: ID!, $data: UpdateRecurringTransactionInput!) { updateRecurringTransaction(id: $id, data: $data) { dayType nextDueDate } }',
      { id: accounts[0].recurrence.id, data: { dayType: 'business_day', dayOfMonth: 5 } },
      `Bearer ${accounts[0].token}`,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data.updateRecurringTransaction).toEqual({ dayType: 'business_day', nextDueDate: '2026-12-07T12:00:00.000Z' });
  });
});
