import { Arg, Authorized, ID, Mutation, Query, Resolver } from 'type-graphql'
import { CreateCategoryInput, UpdateCategoryInput } from './inputs/category.input';
import { CategoryModel } from './models/category.model';
import { CurrentUserId } from './auth/current-user-id';
import { CreateCategoryUseCase } from '@/application/use-cases/create-category-use-case';
import { UpdateCategoryUseCase } from '@/application/use-cases/update-category-use-case';
import { DeleteCategoryUseCase } from '@/application/use-cases/delete-category-use-case';
import { ListCategoriesUseCase } from '@/application/use-cases/list-categories-use-case';

@Authorized()
@Resolver()
export class CategoryResolver {

    constructor(
        private readonly createCategoryUseCase: CreateCategoryUseCase,
        private readonly updateCategoryUseCase: UpdateCategoryUseCase,
        private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
        private readonly listCategoriesUseCase: ListCategoriesUseCase,
    ) {}

    @Query(() => [CategoryModel])
    async categories(@CurrentUserId() userId: string): Promise<CategoryModel[]> {
        const categories = await this.listCategoriesUseCase.execute({ userId })
        return categories.map(CategoryModel.fromEntity)
    }

    @Mutation(() => CategoryModel)
    async createCategory(
        @CurrentUserId() userId: string,
        @Arg('data', () => CreateCategoryInput) data: CreateCategoryInput,
    ): Promise<CategoryModel> {
        const category = await this.createCategoryUseCase.execute({ userId, ...data })
        return CategoryModel.fromEntity(category)
    }

    @Mutation(() => CategoryModel)
    async updateCategory(
        @CurrentUserId() userId: string,
        @Arg('id', () => ID) id: string,
        @Arg('data', () => UpdateCategoryInput) data: UpdateCategoryInput,
    ): Promise<CategoryModel> {
        const category = await this.updateCategoryUseCase.execute({ userId, categoryId: id, ...data })
        return CategoryModel.fromEntity(category)
    }

    @Mutation(() => CategoryModel)
    async deleteCategory(
        @CurrentUserId() userId: string,
        @Arg('id', () => ID) id: string,
    ): Promise<CategoryModel> {
        const category = await this.deleteCategoryUseCase.execute({ userId, categoryId: id })
        return CategoryModel.fromEntity(category)
    }

}
