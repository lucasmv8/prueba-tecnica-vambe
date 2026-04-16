"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Mail } from "lucide-react";
import type { DuplicateEmailGroup } from "@vambe/domain";

interface DataQualityCardProps {
  duplicateEmails: DuplicateEmailGroup[];
}

export function DataQualityCard({ duplicateEmails }: DataQualityCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (duplicateEmails.length === 0) return null;

  const totalAffected = duplicateEmails.reduce((sum, g) => sum + g.clientes.length, 0);

  return (
    <div className="bg-[#161616] border border-amber-900/40 rounded-xl overflow-hidden">
      {/* Header — siempre visible */}
      <button
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-400">
            Problema de calidad de datos
          </span>
          <span className="text-xs text-[#A0A0A0]">—</span>
          <span className="text-xs text-[#A0A0A0]">
            {duplicateEmails.length} email{duplicateEmails.length > 1 ? "s" : ""} compartido{duplicateEmails.length > 1 ? "s" : ""} entre {totalAffected} clientes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
            Requiere atención
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-[#A0A0A0]" />
          ) : (
            <ChevronDown size={14} className="text-[#A0A0A0]" />
          )}
        </div>
      </button>

      {/* Detalle expandible */}
      {expanded && (
        <div className="border-t border-amber-900/30 px-5 py-4 space-y-3">
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Los siguientes emails están registrados para más de un cliente. Esto puede indicar
            errores en la carga de datos, clientes duplicados o contactos que cambiaron de empresa.
            Se recomienda verificar y unificar estos registros.
          </p>
          <div className="space-y-2">
            {duplicateEmails.map((group) => (
              <div
                key={group.correo}
                className="flex items-start gap-3 bg-[#111111] border border-amber-900/20 rounded-lg px-4 py-3"
              >
                <Mail size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-amber-400 truncate">{group.correo}</p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5">
                    {group.clientes.length} clientes:{" "}
                    <span className="text-white">{group.clientes.join(", ")}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
