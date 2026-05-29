// src/features/payment/constants/payment.constants.ts

export interface PaymentMethodItem {
  id: string;
  label: string;
  icon: string;
  type: "upi" | "card" | "cod" | "netbanking";
  /** "ADD" = navigates to a form. undefined = selects directly. */
  action?: "ADD";
  /** Route to push when ADD is tapped. */
  addRoute?: string;
}

export interface PaymentSection {
  title: string;
  items: PaymentMethodItem[];
}

export const PAYMENT_SECTIONS: PaymentSection[] = [
  {
    title: "Recommended",
    items: [
      {
        id: "gpay",
        label: "Google Pay UPI",
        icon: "logo-google",
        type: "upi",
      },
      {
        id: "paytm",
        label: "Paytm UPI",
        icon: "wallet-outline",
        type: "upi",
      },
      {
        id: "amazon",
        label: "Amazon Pay UPI",
        icon: "bag-outline",
        type: "upi",
      },
    ],
  },
  {
    title: "Cards",
    items: [
      {
        id: "card",
        label: "Add credit or debit cards",
        icon: "card-outline",
        type: "card",
        action: "ADD",
        addRoute: "/checkout/add-card",
      },
    ],
  },
  {
    title: "Pay by any UPI app",
    items: [
      {
        id: "upi",
        label: "Add new UPI ID",
        icon: "qr-code-outline",
        type: "upi",
        action: "ADD",
        addRoute: "/checkout/add-upi",
      },
    ],
  },
  {
    title: "Pay On Delivery",
    items: [
      {
        id: "cod",
        label: "Cash on Delivery",
        icon: "cash-outline",
        type: "cod",
      },
    ],
  },
  {
    title: "Netbanking",
    items: [
      {
        id: "bank",
        label: "Netbanking",
        icon: "business-outline",
        type: "netbanking",
        action: "ADD",
        addRoute: "/checkout/netbanking",
      },
    ],
  },
];