import {Resolver, Mutation, Arg } from 'type-graphql'
import { RegisterInput } from '../../application/dtos/input/auth.input';
import { RegisterOutput } from '../../application/dtos/output/auth.output';
import { User } from '../../domain/entities/user';

@Resolver()
export class AuthResolver {

    @Mutation(() => RegisterOutput)
    async register(@Arg('data', () => RegisterInput) data: RegisterInput): Promise<RegisterOutput> {
        const user = User.create(data)

        // TODO: salvar no banco e gerar o JWT
        return { token: '', user: user.toSnapshot() }
    }

}
