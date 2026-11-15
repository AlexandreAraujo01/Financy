export interface UpdateUserInput {
  userId: string;
  // null vem do GraphQL quando o campo é enviado vazio; null não altera nada.
  name?: string | null;
  email?: string | null;
}
