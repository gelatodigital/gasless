import type { Address } from 'viem';

export enum PaymentType {
  Token = 'token',
  Sponsored = 'sponsored'
}

export type TokenPayment = {
  type: PaymentType.Token;
  address: Address | string;
};

export type SponsoredPayment = {
  type: PaymentType.Sponsored;
};

export type Payment = TokenPayment | SponsoredPayment;

export const sponsored = (): Payment => ({ type: PaymentType.Sponsored });

export const token = (address: Address | string): Payment => ({ address, type: PaymentType.Token });
