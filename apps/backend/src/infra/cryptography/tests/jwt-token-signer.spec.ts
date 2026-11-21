import { describe, expect, it } from 'vitest';
import { JwtTokenSigner } from '@/infra/cryptography/jwt-token-signer';

const secret = 'a'.repeat(32);
const sut = new JwtTokenSigner(secret, '1d');

describe('JwtTokenSigner unit test', () => {
  it('should verify a token it signed', async () => {
    const token = await sut.sign({ sub: 'user-1' });

    await expect(sut.verify(token)).resolves.toEqual({ sub: 'user-1' });
  });

  it('should reject a token signed with another secret', async () => {
    const other = new JwtTokenSigner('b'.repeat(32), '1d');
    const token = await other.sign({ sub: 'user-1' });

    await expect(sut.verify(token)).rejects.toThrow();
  });

  it('should reject an expired token', async () => {
    const expired = new JwtTokenSigner(secret, '-1s');
    const token = await expired.sign({ sub: 'user-1' });

    await expect(sut.verify(token)).rejects.toThrow();
  });
});
