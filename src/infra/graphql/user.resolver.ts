import { Query, Resolver } from 'type-graphql'
import { UserModel } from './models/user.model';

@Resolver()
export class UserResolver {

    @Query(() => UserModel)
    me(): UserModel {
        return { id: '1', name: 'alex', email: 'alex@example.com', createdAt: new Date() }
    }

}
