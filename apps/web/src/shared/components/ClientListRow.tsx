import type { Client } from "@vambe/domain";
import { capitalizeFirst, POTENTIAL_COLORS } from "@vambe/ui-system";

interface ClientListRowProps {
  client: Client;
  showIndustria?: boolean;
  infoText?: string | null;
}

export function ClientListRow({ client, showIndustria = false, infoText }: ClientListRowProps) {
  const potencial = client.analysis?.potencial ?? null;
  const potColor = potencial ? (POTENTIAL_COLORS[potencial] ?? "#606060") : "#606060";

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: potColor }}
              title={`Potencial: ${potencial ?? "—"}`}
            />
            <span className="text-sm font-medium text-foreground truncate">{client.nombre}</span>
          </div>
          <div className="flex items-center gap-2 ml-4 mt-0.5">
            <span className="text-xs text-[#606060]">{client.vendedor}</span>
            {showIndustria && client.analysis?.industria && (
              <>
                <span className="text-[10px] text-[#505050]">·</span>
                <span className="text-xs text-[#505050]">{capitalizeFirst(client.analysis.industria)}</span>
              </>
            )}
          </div>
        </div>
        {client.leadScore !== null && (
          <span className="text-xs font-medium text-[#A855F7] shrink-0" title="Lead Score">
            {client.leadScore}pts
          </span>
        )}
      </div>
      {infoText && (
        <p className="text-xs text-muted-foreground leading-relaxed ml-4 line-clamp-2">
          {infoText}
        </p>
      )}
    </div>
  );
}
