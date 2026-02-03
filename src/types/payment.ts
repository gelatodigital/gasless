export type SponsoredPayment = {
  type: 'sponsored';
};

export const sponsored = (): SponsoredPayment => ({ type: 'sponsored' });
