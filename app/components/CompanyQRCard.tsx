"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { getCompanyPageName } from "@/app/actions";
import clsx from "clsx";

type Props = { className?: string };

export default function CompanyQRCard({ className }: Props) {
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const [pageName, setPageName] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [companyUrl, setCompanyUrl] = useState<string>("");

  useEffect(() => {
    if (!email) return;

    (async () => {
      const pn = await getCompanyPageName(email);
      if (!pn) return;

      setPageName(pn);
      setQrUrl(`/api/qr/${pn}`);
      setCompanyUrl(`${window.location.origin}/page/${pn}`);
    })();
  }, [email]);

  return (
    <div className={clsx("card bg-base-100 border border-base-200", className)}>
      <div className="card-body gap-3">
        <h3 className="card-title text-base">QR pour vos clients</h3>

        {!isLoaded ? (
          <div className="skeleton w-60 h-60 mx-auto" />
        ) : !email ? (
          <div className="alert alert-warning">Connectez-vous</div>
        ) : !pageName ? (
          <div className="alert alert-warning">
            Définissez le <b>nom de page</b>.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border p-3 mx-auto">
              <Image
                src={qrUrl}
                alt={`QR @${pageName}`}
                width={240}
                height={240}
                className="block w-full max-w-[240px] aspect-square object-contain"
                priority
              />
            </div>

            <div className="join w-full">
              <a
                className="btn btn-accent btn-sm join-item w-1/2"
                href={qrUrl}
                download={`qr-${pageName}.png`}
              >
                Télécharger
              </a>

              <a
                className="btn btn-sm join-item w-1/2"
                href={`/page/${pageName}`}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir la page
              </a>
            </div>

            <button
              className="btn btn-outline btn-xs"
              onClick={async () => {
                await navigator.clipboard.writeText(companyUrl);
                alert("Lien copié !");
              }}
            >
              Copier le lien
            </button>

            <p className="text-xs opacity-70 truncate" title={companyUrl}>
              {companyUrl}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
