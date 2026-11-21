// Fonte do "agora", pra regras com data poderem ser testadas com um dia fixo.
export abstract class Clock {
  abstract now(): Date;
}
