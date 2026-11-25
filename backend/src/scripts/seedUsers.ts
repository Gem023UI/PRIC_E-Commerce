
import bcrypt from "bcryptjs";

import { connectDatabase, disconnectDatabase } from "../database/connection";
import { USER_ROLES, User, type UserRole } from "../database/models/user.model";

// ============================================================
// CONFIGURATION
// ============================================================

type SeedUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// ============================================================
// ACCOUNTS TO SEED
// ============================================================

const USERS: SeedUser[] = [
  {
    firstName: "Jemuel",
    lastName: "Malaga",
    email: "malagajemuel@gmail.com",
    role: "admin",
    password: "Admin123",
  },
  {
    firstName: "Gem",
    lastName: "Alfaro",
    email: "gemmalfaro023@gmail.com",
    role: "rider",
    password: "Rider123",
  },
  {
    firstName: "Venus",
    lastName: "Page",
    email: "venuspage18@gmail.com",
    role: "customer",
    password: "Customer123",
  },
];

// ============================================================
// VALIDATION
// ============================================================

function validateUsers() {
  const emails = new Set<string>();

  for (const user of USERS) {
    if (!USER_ROLES.includes(user.role)) {
      throw new Error(`Invalid role: ${user.role}`);
    }

    if (emails.has(user.email)) {
      throw new Error(`Duplicate seed email: ${user.email}`);
    }

    emails.add(user.email);

    const validPassword =
      user.password.length >= 8 &&
      /[a-z]/.test(user.password) &&
      /[A-Z]/.test(user.password) &&
      /\d/.test(user.password);

    if (!validPassword) {
      throw new Error(
        `Password for ${user.email} must contain at least 8 characters, an uppercase letter, a lowercase letter, and a number.`
      );
    }
  }
}

// ============================================================
// DATABASE SEEDING
// ============================================================

async function main() {
  validateUsers();

  await connectDatabase();

  let created = 0;
  let existing = 0;

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    const result = await User.updateOne(
      { email: user.email },
      {
        $setOnInsert: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,

          status: "verified",
          emailVerified: new Date(),

          passwordHash,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      created++;

      console.log(
        `[CREATED] ${user.role.toUpperCase()} - ${user.email}`
      );
    } else {
      existing++;

      console.log(
        `[EXISTS] ${user.role.toUpperCase()} - ${user.email}`
      );
    }
  }

  console.log("\n========================================");
  console.log("USER SEEDING COMPLETED");
  console.log("========================================");
  console.log(`Total accounts: ${USERS.length}`);
  console.log(`Newly created: ${created}`);
  console.log(`Already existing: ${existing}`);
  console.log("========================================");
}

main()
  .catch((err) => {
    console.error("Error seeding users:", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
