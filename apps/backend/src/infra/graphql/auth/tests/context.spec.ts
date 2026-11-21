import type { FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import { FakeTokenSigner } from '@test/cryptography/fake-token-signer';
import { makeContext } from '../context';

const context = makeContext(new FakeTokenSigner());
const request = (authorization?: string) =>
  ({ headers: authorization ? { authorization } : {} }) as FastifyRequest;

describe('GraphQL context unit test', () => {
  it('should take the user id from a valid bearer token', async () => {
    await expect(context(request('Bearer token:user-1'))).resolves.toEqual({ userId: 'user-1' });
  });

  it('should have no user without the authorization header', async () => {
    await expect(context(request())).resolves.toEqual({ userId: null });
  });

  it('should have no user for an invalid token instead of failing the request', async () => {
    await expect(context(request('Bearer tampered'))).resolves.toEqual({ userId: null });
  });

  it('should have no user for a scheme other than Bearer', async () => {
    await expect(context(request('Basic token:user-1'))).resolves.toEqual({ userId: null });
  });
});
