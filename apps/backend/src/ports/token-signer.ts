export interface TokenPayload {
  sub: string;
}

export abstract class TokenSigner {
  abstract sign(payload: TokenPayload): Promise<string>;

  abstract verify(token: string): Promise<TokenPayload>;
}
