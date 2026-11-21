import { TokenPayload, TokenSigner } from '@/ports/token-signer';

export class FakeTokenSigner implements TokenSigner {
  sign(payload: TokenPayload): Promise<string> {
    return Promise.resolve(`token:${payload.sub}`);
  }

  verify(token: string): Promise<TokenPayload> {
    if (!token.startsWith('token:')) return Promise.reject(new Error('invalid token'));
    return Promise.resolve({ sub: token.slice('token:'.length) });
  }
}
