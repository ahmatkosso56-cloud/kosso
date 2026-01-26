"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import {
  createService,
  deleteServiceById,
  getServicesByEmail,
  updateServiceSupportsUrgency,
} from "../actions";
import { Service } from "@prisma/client";
import { Clock, ClockArrowUp, Trash } from "lucide-react";
import EmptyState from "../components/EmptyState";
import CompanyQRCard from "../components/CompanyQRCard";

export default function ServicesPage() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const [serviceName, setServiceName] = useState("");
  const [avgTime, setAvgTime] = useState<number>(0);
  const [supportsUrgency, setSupportsUrgency] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [services, setServices] = useState<Service[]>([]);

  async function fetchServices() {
    if (!email) return;
    setLoading(true);
    try {
      const data = await getServicesByEmail(email);
      if (data) setServices(data as Service[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function handleCreateService() {
    if (!email || !serviceName.trim() || avgTime <= 0) return;
    try {
      await createService(email, serviceName.trim(), avgTime, supportsUrgency);
      setServiceName("");
      setAvgTime(0);
      setSupportsUrgency(false);
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteService(serviceId: string) {
    const ok = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce service ? Tous les tickets associés seront également supprimés."
    );
    if (!ok) return;
    try {
      await deleteServiceById(serviceId);
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleUrgency(s: Service) {
    try {
      await updateServiceSupportsUrgency(s.id, !s.supportsUrgency);
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Wrapper>
      {/* 3 colonnes : Form | Liste | QR */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1 — Formulaire */}
       <div className="lg:col-span-3 space-y-2">
          <span className="label-text">Nom du service</span>
          <input
            type="text"
            placeholder="Nom du service"
            className="input input-bordered input-sm w-full"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
          />

          <span className="label-text">Temps moyen du service</span>
          <label className="input input-bordered flex items-center input-sm gap-2">
            <ClockArrowUp className="w-4 h-4" />
            <input
              type="number"
              className="grow"
              placeholder="20"
              value={avgTime}
              onChange={(e) => setAvgTime(Number(e.target.value))}
            />
            <span>min</span>
          </label>

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle"
              checked={supportsUrgency}
              onChange={(e) => setSupportsUrgency(e.target.checked)}
            />
            <span className="label-text">Autoriser l’urgence pour ce service</span>
          </label>

          <button
            className="btn btn-sm btn-accent mt-1"
            onClick={handleCreateService}
          >
            Nouveau
          </button>
        </div>
          <div className="lg:col-span-6 lg:border-l border-base-200 lg:pl-4">
          <h3 className="font-semibold mb-2">Liste des services</h3>

          {loading ? (
            <div className="flex justify-center items-center w-full py-8">
              <span className="loading loading-spinner loading-sm" />
            </div>
          ) : services.length === 0 ? (
            <EmptyState message="Aucun service pour le moment" IconComponent="Telescope" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom du service</th>
                    <th>Temps moyen</th>
                    <th>Urgence activée ?</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, index) => (
                    <tr key={s.id}>
                      <td>{index + 1}</td>
                      <td className="capitalize">{s.name}</td>
                      <td>
                        <div className="inline-flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {s.avgTime} min
                        </div>
                      </td>
                      <td>
                        <label className="label cursor-pointer gap-2">
                          <input
                            type="checkbox"
                            className="toggle toggle-error"
                            checked={!!s.supportsUrgency}
                            onChange={() => handleToggleUrgency(s)}
                          />
                          <span className="text-sm">
                            {s.supportsUrgency ? "Activée" : "Désactivée"}
                          </span>
                        </label>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="btn btn-xs btn-error"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <aside className="lg:col-span-3 min-w-[320px]">
    <CompanyQRCard className="sticky top-24" />
  </aside>
      </div>
    </Wrapper>
  );
}
