/** Payment type enum */
export enum PaymentType {
  Token = 'token',
  Sponsored = 'sponsored'
}

/** Token payment (TRX or TRC-20) */
export type TokenPayment = {
  type: PaymentType.Token;
  address: string;
};

/** Sponsored payment (gasless) */
export type SponsoredPayment = {
  type: PaymentType.Sponsored;
};

/** Payment type union */
export type Payment = TokenPayment | SponsoredPayment;

/** Creates a sponsored payment */
export const sponsored = (): Payment => ({ type: PaymentType.Sponsored });

/** Creates a token payment (TRX or TRC-20 address) */
export const token = (address: string): Payment => ({ address, type: PaymentType.Token });
