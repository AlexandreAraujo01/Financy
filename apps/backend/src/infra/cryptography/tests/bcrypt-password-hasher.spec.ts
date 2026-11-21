import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '@/infra/cryptography/bcrypt-password-hasher';

// 4 é o mínimo do bcrypt; deixa o teste rápido.
const sut = new BcryptPasswordHasher(4);

describe('BcryptPasswordHasher unit test', () => {
  it('should not return the plain password', async () => {
    const hashed = await sut.hash('secret123');

    expect(hashed).not.toBe('secret123');
  });

  it('should match the original password', async () => {
    const hashed = await sut.hash('secret123');

    await expect(sut.compare('secret123', hashed)).resolves.toBe(true);
  });

  it('should not match a different password', async () => {
    const hashed = await sut.hash('secret123');

    await expect(sut.compare('wrong', hashed)).resolves.toBe(false);
  });
});
