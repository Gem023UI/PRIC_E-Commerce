export interface EventItem {
  id: number;
  image: string;
  title: string;
  location: string;
  date: string;
  description: string;
}

// Temporary placeholder. Replace with real event photos.
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

// Sample data. All 5 cards share the same content for now.
export const EVENTS: EventItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  image: PLACEHOLDER_IMAGE,
  title: "DTI – Coconut Farmers and Industry Development Plan (CFIDP) Program",
  location: "SMX Convention Center, Pasay City",
  date: "August 26–30, 2026",
  description:
    "PRIC held a booth for selling and marketing the Hillside Farm Products such as ginger powder and its varying flavors in the recent DTI Agricultural Marketing Event to further develop the reach of the local produce here in the community.",
}));