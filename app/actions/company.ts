"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureCompany() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  let company = await prisma.company.findUnique({
    where: { email },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        email,
        name: user.firstName ?? "Ma société",
      },
    });
  }

  return company;
}
