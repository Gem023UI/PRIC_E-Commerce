import type { OrderAddress, OrderItem, PaymentMethod, PaymentStatus } from "@/lib/orders";

export type RiderStatus = "to_ship" | "on_delivery" | "completed" | "cancelled" | "to_confirm";

export type RiderOrderRow = {
  id: string;
  /** Short reference, e.g. #4F2A91. Riders never see the full tracking code. */
  ref: string;
  status: RiderStatus;
  fullName: string;
  phone: string;
  itemCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Cash to collect at the door (0 when nothing is owed). */
  collectAmount: number;
  area: string;
  assignedAt: string | null;
  completedAt: string | null;
};

export type RiderOrderDetail = RiderOrderRow & {
  address: OrderAddress;
  items: OrderItem[];
  notes: string;
};

export const googleMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;