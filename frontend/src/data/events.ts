export type EventStatus = "upcoming" | "latest";

export interface EventItem {
  id: number;
  status: EventStatus;
  title: string;
  location: string;
  /** The date as shown on the site. */
  date: string;
  time: string;
  description: string;
  /** First picture, used by cards and carousels. */
  image: string;
  /** All pictures, shown one by one on the details page. */
  images: string[];
}