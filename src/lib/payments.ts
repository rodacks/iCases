export type PaymentResult = { status: 'DEMO_NO_CHARGE'; chargedAmount: 0 };
export interface PaymentProvider {
  prepare(): PaymentResult;
}
// Deliberately has no card fields, network calls or banking success state.
export const demoPaymentProvider: PaymentProvider = {
  prepare() {
    return { status: 'DEMO_NO_CHARGE', chargedAmount: 0 };
  },
};
