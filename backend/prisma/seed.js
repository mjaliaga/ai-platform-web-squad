import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoUsers = process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD
  ? [
      {
        name: process.env.SEED_ADMIN_NAME || "Administrador TIVIT",
        email: process.env.SEED_ADMIN_EMAIL,
        password: process.env.SEED_ADMIN_PASSWORD,
        role: "admin",
      },
    ]
  : [
      { name: "Ana Torres", email: "demo@tivit.com", password: "tivit2026", role: "admin" },
      { name: "Bruno Silva", email: "bruno.silva@tivit.com", password: "tivit2026", role: "member" },
    ];

async function main() {
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }
  console.log(`Usuarios iniciales creados: ${demoUsers.map((user) => user.email).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
