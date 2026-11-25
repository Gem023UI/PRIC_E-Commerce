export type Role = "customer" | "admin" | "rider";

/** Where each role lands after logging in. */
export function homeForRole(role?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "rider":
      return "/rider/orders";
    default:
      return "/orders";
  }
}

export function homeLabelForRole(role?: string | null): string {
  switch (role) {
    case "admin":
      return "Dashboard";
    case "rider":
      return "My deliveries";
    default:
      return "My orders";
  }
}