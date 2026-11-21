const KEY = 'financy:token';

// "Lembrar-me" guarda o token no localStorage (sobrevive ao fechar o navegador);
// sem ele, fica no sessionStorage e some ao fechar a aba.
export const authStorage = {
  get(): string | null {
    return localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  },
  set(token: string, remember: boolean) {
    this.clear();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  },
  clear() {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  },
};
