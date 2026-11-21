import { gql, type TypedDocumentNode } from '@apollo/client';
import type {
  Category,
  CategoryInput,
  RecurringTransaction,
  RecurringTransactionInput,
  Transaction,
  TransactionInput,
  User,
} from './types';

const USER_FIELDS = gql`
  fragment UserFields on UserModel {
    id
    name
    email
    createdAt
  }
`;

const CATEGORY_FIELDS = gql`
  fragment CategoryFields on CategoryModel {
    id
    name
    description
    icon
    color
    createdAt
  }
`;

const TRANSACTION_FIELDS = gql`
  fragment TransactionFields on TransactionModel {
    id
    categoryId
    description
    type
    date
    valueInCents
    recurringTransactionId
    createdAt
  }
`;

const RECURRING_TRANSACTION_FIELDS = gql`
  fragment RecurringTransactionFields on RecurringTransactionModel {
    id
    categoryId
    description
    type
    valueInCents
    dayOfMonth
    dayType
    startDate
    nextDueDate
    createdAt
  }
`;

interface AuthResult {
  token: string;
  user: User;
}

export const LOGIN: TypedDocumentNode<
  { login: AuthResult },
  { data: { email: string; password: string } }
> = gql`
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const REGISTER: TypedDocumentNode<
  { register: AuthResult },
  { data: { name: string; email: string; password: string } }
> = gql`
  mutation Register($data: RegisterInput!) {
    register(data: $data) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const ME: TypedDocumentNode<{ me: User }> = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_ME: TypedDocumentNode<{ updateMe: User }, { data: { name: string } }> = gql`
  mutation UpdateMe($data: UpdateUserInput!) {
    updateMe(data: $data) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const CATEGORIES: TypedDocumentNode<{ categories: Category[] }> = gql`
  query Categories {
    categories {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

export const CREATE_CATEGORY: TypedDocumentNode<
  { createCategory: Category },
  { data: CategoryInput }
> = gql`
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

export const UPDATE_CATEGORY: TypedDocumentNode<
  { updateCategory: Category },
  { id: string; data: CategoryInput }
> = gql`
  mutation UpdateCategory($id: ID!, $data: UpdateCategoryInput!) {
    updateCategory(id: $id, data: $data) {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

export const DELETE_CATEGORY: TypedDocumentNode<{ deleteCategory: { id: string } }, { id: string }> =
  gql`
    mutation DeleteCategory($id: ID!) {
      deleteCategory(id: $id) {
        id
      }
    }
  `;

export const TRANSACTIONS: TypedDocumentNode<{ transactions: Transaction[] }> = gql`
  query Transactions {
    transactions {
      ...TransactionFields
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const CREATE_TRANSACTION: TypedDocumentNode<
  { createTransaction: Transaction },
  { data: TransactionInput }
> = gql`
  mutation CreateTransaction($data: CreateTransactionInput!) {
    createTransaction(data: $data) {
      ...TransactionFields
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const UPDATE_TRANSACTION: TypedDocumentNode<
  { updateTransaction: Transaction },
  { id: string; data: TransactionInput }
> = gql`
  mutation UpdateTransaction($id: ID!, $data: UpdateTransactionInput!) {
    updateTransaction(id: $id, data: $data) {
      ...TransactionFields
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const DELETE_TRANSACTION: TypedDocumentNode<
  { deleteTransaction: { id: string } },
  { id: string }
> = gql`
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id) {
      id
    }
  }
`;

export const RECURRING_TRANSACTIONS: TypedDocumentNode<{
  recurringTransactions: RecurringTransaction[];
}> = gql`
  query RecurringTransactions {
    recurringTransactions {
      ...RecurringTransactionFields
    }
  }
  ${RECURRING_TRANSACTION_FIELDS}
`;

export const CREATE_RECURRING_TRANSACTION: TypedDocumentNode<
  { createRecurringTransaction: RecurringTransaction },
  { data: RecurringTransactionInput & { startDate: string } }
> = gql`
  mutation CreateRecurringTransaction($data: CreateRecurringTransactionInput!) {
    createRecurringTransaction(data: $data) {
      ...RecurringTransactionFields
    }
  }
  ${RECURRING_TRANSACTION_FIELDS}
`;

export const UPDATE_RECURRING_TRANSACTION: TypedDocumentNode<
  { updateRecurringTransaction: RecurringTransaction },
  { id: string; data: RecurringTransactionInput }
> = gql`
  mutation UpdateRecurringTransaction($id: ID!, $data: UpdateRecurringTransactionInput!) {
    updateRecurringTransaction(id: $id, data: $data) {
      ...RecurringTransactionFields
    }
  }
  ${RECURRING_TRANSACTION_FIELDS}
`;

export const END_RECURRING_TRANSACTION: TypedDocumentNode<
  { endRecurringTransaction: { id: string } },
  { id: string }
> = gql`
  mutation EndRecurringTransaction($id: ID!) {
    endRecurringTransaction(id: $id) {
      id
    }
  }
`;

// Depois de qualquer escrita, recarrega as listas que alimentam dashboard e páginas.
// As recorrências entram porque criar uma pode gerar transações na hora.
export const REFETCH_LISTS = [TRANSACTIONS, CATEGORIES, RECURRING_TRANSACTIONS];
