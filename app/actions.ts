"use server";

import prisma from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeSNPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("221")) {
    const rest = digits.slice(3);
    if (rest.length === 9) return `+221${rest}`;
  }
  if (digits.length === 9) return `+221${digits}`;
  throw new Error(
    "Numéro sénégalais invalide (attendu: +221 suivi de 9 chiffres)."
  );
}

export async function checkAndAddUser(email: string, name: string) {
  if (!email) return;
  try {
    const existingUser = await prisma.company.findUnique({ where: { email } });
    if (!existingUser && name) {
      await prisma.company.create({ data: { email, name } });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function createService(
  email: string,
  serviceName: string,
  avgTime: number,
  supportsUrgency = false
) {
  if (!email || !serviceName || avgTime == null) return;
  const company = await prisma.company.findUnique({ where: { email } });
  if (!company) return;
  await prisma.service.create({
    data: { name: serviceName, avgTime, companyId: company.id, supportsUrgency },
  });
}

export async function getServicesByEmail(email: string) {
  if (!email) return;
  try {
    const company = await prisma.company.findUnique({ where: { email } });
    if (!company) throw new Error("Aucune entreprise trouvée avec cet email");

    const services = await prisma.service.findMany({
      where: { companyId: company.id },
      include: { company: true },
    });
    return services;
  } catch (error) {
    console.error(error);
  }
}

export async function deleteServiceById(serviceId: string) {
  if (!serviceId) return;
  try {
    await prisma.service.delete({ where: { id: serviceId } });
  } catch (error) {
    console.error(error);
  }
}

export async function getCompanyPageName(email: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { email },
      select: { pageName: true },
    });
    if (company) return company.pageName;
  } catch (error) {
    console.error(error);
  }
}

export async function setCompanyPageName(email: string, pageName: string) {
  try {
    await prisma.company.update({ where: { email }, data: { pageName } });
  } catch (error) {
    console.error(error);
  }
}

export async function getServicesByPageName(pageName: string) {
  try {
    const company = await prisma.company.findUnique({ where: { pageName } });
    if (!company)
      throw new Error(
        `Aucune entreprise trouvée avec le nom de page : ${pageName}`
      );

    const services = await prisma.service.findMany({
      where: { companyId: company.id },
      include: { company: true },
    });
    return services;
  } catch (error) {
    console.error(error);
  }
}

export async function createTicket(
  serviceId: string,
  nameComplete: string,
  phoneE164: string,
  pageName: string,
  isUrgent: boolean = false
) {
  const company = await prisma.company.findUnique({ where: { pageName } });
  if (!company) throw new Error("Entreprise introuvable");

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new Error("Service introuvable");

  const phone = phoneE164.replace(/\s+/g, "");
  if (!/^\+221\d{9}$/.test(phone)) throw new Error("Numéro invalide");

  const urgentFlag =
    !!service.supportsUrgency && (isUrgent || /urgence/i.test(service.name));
  const ticketNum = await prisma.$transaction(async (tx) => {
    const raw = company.pageName ?? "TCK";
    const prefix =
      raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "TCK";
    const { ticketSeq } = await tx.company.update({
      where: { id: company.id },
      data: { ticketSeq: { increment: 1 } },
      select: { ticketSeq: true },
    });
    const seq = String(ticketSeq).padStart(4, "0");
    const num = `${prefix}${seq}`;

    await tx.ticket.create({
      data: {
        serviceId,
        nameComplete,
        num,
        status: "PENDING",
        customerPhone: phone,
        isUrgent: urgentFlag,
      },
    });

    return num;
  });

  return ticketNum;
}

export async function getPendingTicketsByEmail(email: string) {
  const company = await prisma.company.findUnique({
    where: { email },
    include: {
      services: {
        include: {
          tickets: {
            where: { status: { in: ["PENDING", "CALL", "IN_PROGRESS"] } },
            orderBy: [{ isUrgent: "desc" }, { createdAt: "asc" }],
            include: { post: true },
          },
        },
      },
    },
  });
  if (!company) throw new Error("Entreprise introuvable");

  return company.services.flatMap((s) =>
    s.tickets.map((t) => ({
      ...t,
      serviceName: s.name,
      avgTime: s.avgTime,
    }))
  );
}

export async function getTicketsByIds(ticketNums: string[]) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { num: { in: ticketNums } },
      orderBy: { createdAt: "asc" },
      include: {
        service: {
          select: { id: true, name: true, avgTime: true, supportsUrgency: true },
        },
        post: { select: { id: true, name: true } },
      },
    });
    if (!tickets.length) throw new Error("Aucun ticket trouvé");

    return tickets.map((t) => ({
      ...t,
      serviceName: t.service.name,
      avgTime: t.service.avgTime,
    }));
  } catch (e) {
    console.error(e);
  }
}

export async function createPost(email: string, postName: string) {
  try {
    const company = await prisma.company.findUnique({ where: { email } });
    if (!company) throw new Error(`Aucune entreprise trouvée avec cet email`);

    await prisma.post.create({ data: { name: postName, companyId: company.id } });
  } catch (error) {
    console.error(error);
  }
}

export async function deletePost(postId: string) {
  try {
    await prisma.post.delete({ where: { id: postId } });
  } catch (error) {
    console.error(error);
  }
}

export async function getPostsByCompanyEmail(email: string) {
  try {
    const company = await prisma.company.findUnique({ where: { email } });
    if (!company) throw new Error(`Aucune entreprise trouvée avec cet email`);

    const posts = await prisma.post.findMany({
      where: { companyId: company.id },
      include: { company: true },
    });
    return posts;
  } catch (error) {
    console.error(error);
  }
}

export async function getPostNameById(postId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { name: true },
    });
    if (post) return post.name;
    throw new Error("Poste non trouvé");
  } catch (error) {
    console.error(error);
  }
}

export async function getLastTicketByEmail(email: string, idPoste: string) {
  try {
    const existing = await prisma.ticket.findFirst({
      where: { postId: idPoste, status: { in: ["CALL", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      include: { service: true, post: true },
    });
    if (existing?.service) {
      return {
        ...existing,
        serviceName: existing.service.name,
        avgTime: existing.service.avgTime,
      };
    }
    const ticket = await prisma.ticket.findFirst({
      where: { status: "PENDING", service: { company: { email } } },
      orderBy: [{ isUrgent: "desc" }, { createdAt: "asc" }],
      include: { service: true, post: true },
    });
    if (!ticket?.service) return null;

    const post = await prisma.post.findUnique({ where: { id: idPoste } });
    if (!post) return null;

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "CALL", postId: post.id, postName: post.name },
      include: { service: true },
    });

    return {
      ...updated,
      serviceName: updated.service.name,
      avgTime: updated.service.avgTime,
    };
  } catch (e) {
    console.error(e);
  }
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  try {
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: newStatus } });
  } catch (error) {
    console.error(error);
  }
}

export async function get10LstFinishedTicketsByEmail(email: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: "FINISHED", service: { company: { email } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { service: true, post: true },
    });

    return tickets.map((ticket) => ({
      ...ticket,
      serviceName: ticket.service?.name,
      avgTime: ticket.service?.avgTime,
    }));
  } catch (error) {
    console.error(error);
  }
}

export async function getTicketStatsByEmail(email: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { service: { company: { email } } },
      select: { status: true },
    });
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === "FINISHED"
    ).length;
    const pendingTickets = tickets.filter(
      (t) => t.status === "PENDING"
    ).length;

    return { totalTickets, resolvedTickets, pendingTickets };
  } catch (error) {
    console.error(error);
    return { totalTickets: 0, resolvedTickets: 0, pendingTickets: 0 };
  }
}

export async function updateServiceSupportsUrgency(
  serviceId: string,
  supports: boolean
) {
  await prisma.service.update({
    where: { id: serviceId },
    data: { supportsUrgency: supports },
  });
}

export async function setTicketUrgency(ticketId: string, isUrgent: boolean) {
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { isUrgent },
  });
}
