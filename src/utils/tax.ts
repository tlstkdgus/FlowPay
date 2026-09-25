/** 부가세 포함 금액을 공급가액/부가세(10%)로 분리 */
export const splitVat = (amount: number): { supplyAmount: number; vat: number } => {
  const supplyAmount = Math.round(amount / 1.1);
  return { supplyAmount, vat: amount - supplyAmount };
};
