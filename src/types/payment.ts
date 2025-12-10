import { type Address, zeroAddress } from 'viem';

export enum PaymentType {
  Token = 'token',
  Sponsored = 'sponsored'
}

export type TokenPayment = {
  type: PaymentType.Token;
  address: Address;
};

export type SponsoredPayment = {
  type: PaymentType.Sponsored;
};

export type Payment = TokenPayment | SponsoredPayment;

export const sponsored = (): Payment => ({ type: PaymentType.Sponsored });

export const token = (address: Address): Payment => ({ address, type: PaymentType.Token });

export const native = (): Payment => ({ address: zeroAddress, type: PaymentType.Token });
