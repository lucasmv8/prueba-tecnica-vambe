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
    <div className="bg-card border border-amber-900/40 rounded-xl overflow-hidden">
      <button
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Problema de calidad de datos
          </span>
          <span className="text-xs text-muted-foreground">—</span>
          <span className="text-xs text-muted-foreground">
            {duplicateEmails.length} email{duplicateEmails.length > 1 ? "s" : ""} compartido{duplicateEmails.length > 1 ? "s" : ""} entre {totalAffected} clientes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-700 dark:text-amber-600 bg-amber-600/10 border border-amber-600/20 rounded-full px-2 py-0.5">
            Requiere atención
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-amber-900/30 px-5 py-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Los siguientes emails están registrados para más de un cliente. Esto puede indicar
            errores en la carga de datos, clientes duplicados o contactos que cambiaron de empresa.
            Se recomienda verificar y unificar estos registros.
          </p>
          <div className="space-y-2">
            {duplicateEmails.map((group) => (
              <div
                key={group.correo}
                className="flex items-start gap-3 bg-muted border border-amber-900/20 rounded-lg px-4 py-3"
              >
                <Mail size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">{group.correo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {group.clientes.length} clientes:{" "}
                    <span className="text-foreground">{group.clientes.join(", ")}</span>
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
