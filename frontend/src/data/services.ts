export type ServiceId = "rentals" | "financing" | "savings-loans" | "production";

export type ServiceGroup = { title?: string; items: string[] };

export type Service = {
  id: ServiceId;
  number: string;
  name: string;
  short: string;
  cta: string;
  subtitle: string;
  intro: string[];
  groups: ServiceGroup[];
  howItWorks: string;
  notice?: { label: string; text: string };
  imageAlt: string;
  images: string[];
  form: {
    title: string;
    submitLabel: string;
    notice: string;
    messagePlaceholder: string;
  };
};

// TODO: placeholder pictures. Replace each service's array with its own photos.
const PLACEHOLDER_IMAGES = ["/community.jpg", "/marketing.jpg", "/microfinance.jpg"];

export const SERVICES: Service[] = [
  {
    id: "rentals",
    number: "01",
    name: "Rentals for Catering Events",
    short:
      "Rental support for family celebrations, community gatherings, and organizational events.",
    cta: "Inquire About Rentals",
    subtitle: "Making Every Occasion More Convenient",
    intro: [
      "PRIC MPC offers rental services intended to support catering events and related occasions. Whether for family celebrations, community gatherings, organizational activities, or business functions, our rental service helps customers access the resources they need for their events.",
    ],
    groups: [
      {
        items: [
          "Rental arrangements for catering-related events.",
          "Options for private celebrations, community gatherings, and organizational functions.",
          "Advance booking and reservation inquiries.",
          "Coordination of rental schedules and availability.",
        ],
      },
    ],
    howItWorks:
      "Customers may inquire about available rental items, rates, reservation requirements, and rental periods. Once the requested arrangements are confirmed, the customer can proceed with the cooperative's booking process.",
    notice: {
      label: "Please note",
      text: "Available items, rental rates, security deposits, delivery arrangements, and reservation terms are subject to confirmation with PRIC MPC.",
    },
    imageAlt: "Catering event rental items from PRIC MPC",
    images: PLACEHOLDER_IMAGES,
    form: {
      title: "Rental inquiry",
      submitLabel: "Send Rental Inquiry",
      notice:
        "Sending this form does not reserve any items. PRIC MPC will confirm availability and terms with you.",
      messagePlaceholder:
        "Tell us your event date, expected guests, and the items or setup you need.",
    },
  },
  {
    id: "financing",
    number: "02",
    name: "Loans and Micro-financing",
    short:
      "Loan and micro-financing inquiries for eligible members and livelihood activities.",
    cta: "Explore Financing",
    subtitle: "Accessible Financial Opportunities for Members",
    intro: [
      "PRIC MPC provides loan and micro-financing services intended to support eligible members with their financial needs and economic activities, subject to the cooperative's approved lending programs and policies.",
      "Micro-financing can help qualified borrowers explore funding opportunities for small-scale livelihood activities, business initiatives, and other permitted purposes. Through its financial services, the cooperative aims to support responsible borrowing and economic participation.",
    ],
    groups: [
      {
        items: [
          "Loan inquiries and application assistance.",
          "Micro-financing opportunities for eligible borrowers.",
          "Financing inquiries related to livelihood and small business activities, where permitted.",
          "Information about repayment arrangements and applicable charges.",
          "Guidance on the cooperative's assessment and approval process.",
        ],
      },
    ],
    howItWorks:
      "Interested applicants may inquire about the available loan programs, eligibility criteria, documentary requirements, and applicable financial terms. Applications are evaluated according to the cooperative's established procedures.",
    notice: {
      label: "Important information",
      text: "Loan availability, maximum borrowing amounts, interest rates, payment schedules, collateral requirements, and approval conditions depend on the specific financing program offered by PRIC MPC.",
    },
    imageAlt: "PRIC MPC financing services",
    images: PLACEHOLDER_IMAGES,
    form: {
      title: "Financing inquiry",
      submitLabel: "Send Financing Inquiry",
      notice:
        "This is an inquiry only, not a loan application. It does not guarantee approval. Do not include ID or bank account numbers.",
      messagePlaceholder:
        "Share what you would like to know, such as programs, eligibility, requirements, or repayment.",
    },
  },
  {
    id: "savings-loans",
    number: "03",
    name: "Savings and Loans",
    short:
      "Savings facilities and loan programs that help members build financial stability.",
    cta: "Learn About Savings & Loans",
    subtitle: "Building Financial Stability Through Cooperation",
    intro: [
      "PRIC MPC's savings and loan services support the cooperative's financial-service activities and its goal of promoting responsible financial participation among eligible members.",
      "Savings services can help members develop consistent saving habits, while loan services may provide access to financing under the cooperative's approved terms. Together, these services can contribute to financial planning and the management of personal or livelihood-related needs.",
    ],
    groups: [
      {
        title: "Savings",
        items: [
          "Inquiries about available savings facilities and account arrangements.",
          "Information about applicable savings terms and conditions.",
          "Guidance on deposits and withdrawals.",
          "Information about member account records and financial transactions.",
        ],
      },
      {
        title: "Loans",
        items: [
          "Loan application and eligibility inquiries.",
          "Guidance on repayments and other applicable transactions.",
        ],
      },
    ],
    howItWorks:
      "Members may inquire about the savings facilities and loan programs currently available. The cooperative's authorized personnel can explain the requirements, applicable terms, transaction procedures, and relevant account arrangements.",
    notice: {
      label: "Important information",
      text: "Specific savings products, account-opening requirements, minimum balances, interest rates, withdrawal rules, loan eligibility, and repayment terms must be confirmed with PRIC MPC.",
    },
    imageAlt: "PRIC MPC savings and loan services",
    images: PLACEHOLDER_IMAGES,
    form: {
      title: "Savings and loans inquiry",
      submitLabel: "Send Inquiry",
      notice:
        "This is an inquiry only, not an account opening or loan application. Do not include ID or bank account numbers.",
      messagePlaceholder: "Tell us whether you are interested in savings, loans, or both.",
    },
  },
  {
    id: "production",
    number: "04",
    name: "Manufacturing and Production",
    short:
      "Manufacturing and production activities, with supply and partnership inquiries.",
    cta: "Explore Production Services",
    subtitle: "Transforming Resources Into Valuable Products",
    intro: [
      "PRIC MPC engages in manufacturing and production activities that support its multipurpose operations and enterprise development. Through the production of goods, the cooperative creates opportunities to develop marketable products, support business activities, and contribute to local economic participation.",
    ],
    groups: [
      {
        items: [
          "Manufacturing and production operations.",
          "Product processing and preparation, where applicable.",
          "Production planning and operational activities.",
          "Product development and quality-related processes.",
          "Potential supply and production partnerships, subject to current capacity.",
        ],
      },
    ],
    howItWorks:
      "Businesses and other interested parties may inquire about the cooperative's production capabilities, existing product lines, supply arrangements, and potential commercial partnerships. Any proposed arrangement is subject to the cooperative's actual production capacity and operating requirements.",
    imageAlt: "PRIC MPC production activities",
    images: PLACEHOLDER_IMAGES,
    form: {
      title: "Production inquiry",
      submitLabel: "Send Production Inquiry",
      notice:
        "Any arrangement is subject to PRIC MPC's current production capacity and operating requirements.",
      messagePlaceholder:
        "Describe the product or production requirement, estimated quantity, and intended use.",
    },
  },
];

/** Hero carousel order. Each slide scrolls to its service on click. */
export const HERO_SLIDES: { id: ServiceId; src: string; caption: string }[] = [
  { id: "production", src: "/services/ginger.png", caption: "Ginger Manufacturing and Production" },
  { id: "financing", src: "/services/micro.png", caption: "Loans and Micro-financing" },
  { id: "savings-loans", src: "/services/savings.png", caption: "Savings and Loans" },
  { id: "rentals", src: "/services/rent.png", caption: "Rentals for Catering Events" },
];