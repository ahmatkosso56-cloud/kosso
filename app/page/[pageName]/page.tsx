
"use client";

import {
  createTicket,
  getServicesByPageName,
  getTicketsByIds,
} from "@/app/actions";
import TicketComponent from "@/app/components/TicketComponent";
import { Ticket } from "@/type";
import { Service } from "@prisma/client";
import React, { use, useEffect, useState, useCallback } from "react";

type PageProps = { params: Promise<{ pageName: string }> };

const Page = ({ params }: PageProps) => {
  const { pageName } = use(params);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [nameComplete, setNameComplete] = useState<string>("");
  const [ticketNums, setTicketNums] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const [phoneDigits, setPhoneDigits] = useState<string>(""); 
  const toDigits = (s: string) => s.replace(/\D/g, "");
  const formatSN = (d: string) => {
    const m = d.match(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (!m) return d;
    return [m[1], m[2], m[3], m[4]].filter(Boolean).join(" ");
  };

  const fetchTicketsByIds = useCallback(async (nums: string[]) => {
    try {
      const fetched = await getTicketsByIds(nums);
      const valid = fetched?.filter((t) => t.status !== "FINISHED") ?? [];
      const validNums = valid.map((t) => t.num);
      localStorage.setItem("ticketNums", JSON.stringify(validNums));
      setTickets(valid);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const list = await getServicesByPageName(pageName);
      if (list) setServices(list);
    })();

    const stored = localStorage.getItem("ticketNums");
    if (stored && stored !== "undefined") {
      const saved = JSON.parse(stored) as string[];
      setTicketNums(saved);
      if (saved.length > 0) fetchTicketsByIds(saved);
    } else {
      setTicketNums([]);
    }
  }, [pageName, fetchTicketsByIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId || !nameComplete.trim()) {
      alert("Veuillez sélectionner un service et entrer votre nom.");
      return;
    }

    const digits = phoneDigits.replace(/\D/g, "");
    if (digits.length !== 9) {
      alert("Numéro invalide. Ex: 77 123 45 67");
      return;
    }
    const phoneE164 = `+221${digits}`;

    try {
      setSubmitting(true);

      const ticketNum = await createTicket(
        selectedServiceId,
        nameComplete.trim(),
        phoneE164,
        pageName || "",
        isUrgent
      );

      const updated = [...ticketNums, ticketNum as string];
      setTicketNums(updated);
      localStorage.setItem("ticketNums", JSON.stringify(updated));

      await fetchTicketsByIds(updated);

      setSelectedServiceId(null);
      setNameComplete("");
      setPhoneDigits("");
      setIsUrgent(false);
      setCountdown(5);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (countdown === 0) {
        if (ticketNums.length > 0) fetchTicketsByIds(ticketNums);
        setCountdown(5);
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [countdown, ticketNums, fetchTicketsByIds]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="px-5 md:px-[10%] mt-8 mb-10">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenu chez{" "}
          <span className="badge badge-accent ml-2">@{pageName}</span>
        </h1>
        <p className="text-md">Aller , créer votre ticket</p>
      </div>

      <div className="flex flex-col md:flex-row w-full mt-4">
        <form className="flex flex-col space-y-2 md:w-96" onSubmit={handleSubmit}>
          <select
            className="select select-bordered w-full"
            onChange={(e) => {
              setSelectedServiceId(e.target.value);
              setIsUrgent(false); 
            }}
            value={selectedServiceId || ""}
          >
            <option disabled value="">
              Choisissez un service
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - ({service.avgTime} min)
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Quel est votre nom ?"
            className="input input-bordered w-full"
            onChange={(e) => setNameComplete(e.target.value)}
            value={nameComplete}
          />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Quel est votre numéro ?"
            className="input input-bordered w-full"
            value={formatSN(phoneDigits)}
            onChange={(e) =>
              setPhoneDigits(toDigits(e.target.value).slice(0, 9))
            } 
          />
          {selectedService?.supportsUrgency && (
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-error"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
              />
              <span className="label-text">Cas urgent ?</span>
            </label>
          )}
          <button type="submit" className="btn btn-accent w-fit" disabled={submitting}>
            {submitting ? "Création..." : "Go"}
          </button>
        </form>
        <div className="w-full mt-4 md:ml-4 md:mt-0">
          {tickets.length !== 0 && (
            <div>
              <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">Vos Tickets</h1>
                <div className="flex items-center">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75"></span>
                    <span className="relative inline-flex size-3 rounded-full bg-accent"></span>
                  </span>
                  <div className="ml-2">({countdown}s)</div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {tickets.map((ticket, index) => {
                  const totalWaitTime = tickets
                    .slice(0, index)
                    .reduce((acc, prev) => acc + prev.avgTime, 0);
                  return (
                    <TicketComponent
                      key={ticket.id}
                      ticket={ticket}
                      totalWaitTime={totalWaitTime}
                      index={index}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Page;
