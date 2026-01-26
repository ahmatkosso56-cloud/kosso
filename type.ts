import { Ticket as TicketCompany } from '@prisma/client'

export type Ticket = TicketCompany & {
  serviceName: string
  avgTime: number
  // on l’affiche dans TicketComponent ; optionnel pour éviter les erreurs TS si le champ n’est pas encore migré
  isUrgent?: boolean;
customerPhone?: string | null;

}
