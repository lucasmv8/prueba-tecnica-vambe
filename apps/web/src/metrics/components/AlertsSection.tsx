"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, ChevronDown, ChevronUp, Mail, X, Send, Sparkles, RefreshCw } from "lucide-react";
import type { AlertEntry } from "@vambe/domain";
import { capitalizeFirst } from "@vambe/ui-system";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useComposeEmail } from "@/metrics/hooks/useComposeEmail";

interface AlertsSectionProps {
  alertas: AlertEntry[];
}

function ContactModal({ alert, onClose }: { alert: AlertEntry; onClose: () => void }) {
  const isWarning = alert.tipo === "potencial_no_cerrado";

  const defaultSubject = isWarning
    ? `Seguimiento de reunión — ${alert.nombre}`
    : `Revisión de acuerdo — ${alert.nombre}`;

  const defaultBody = isWarning
    ? [
        `Hola ${alert.nombre.split(" ")[0]},`,
        "",
        `Espero que estés bien. Me comunico para dar seguimiento a nuestra reunión reciente${alert.industria ? ` sobre tus necesidades en el sector ${capitalizeFirst(alert.industria)}` : ""}.`,
        "",
        alert.painPoint
          ? `Entiendo que uno de los principales desafíos que enfrenta tu equipo es: ${alert.painPoint}`
          : "",
        "",
        alert.proximaAccion
          ? `Como próximo paso, te propongo: ${alert.proximaAccion}`
          : "Me gustaría agendar una llamada para avanzar en los detalles.",
        "",
        "Quedo a tu disposición para coordinar.",
        "",
        `Saludos,\n${alert.vendedor}`,
      ]
        .filter((l) => l !== undefined)
        .join("\n")
    : [
        `Hola ${alert.nombre.split(" ")[0]},`,
        "",
        "Espero que todo esté marchando bien desde que comenzamos a trabajar juntos. Me comunico simplemente para recordarte que estamos disponibles para lo que necesites.",
        "",
        "Si en algún momento surge alguna duda, quieres explorar nuevas funcionalidades o simplemente necesitas apoyo, no dudes en escribirme — estamos para ayudarte.",
        "",
        `Saludos,\n${alert.vendedor}`,
      ]
        .filter((l) => l !== undefined)
        .join("\n");

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sent, setSent] = useState(false);
  useBodyScrollLock();
  const { loading: aiLoading, result: aiResult, error: aiError, generate, clearResult } = useComposeEmail();

  const handleSend = () => setSent(true);

  const handleGenerateAI = () => generate({
    tipo: alert.tipo,
    nombre: alert.nombre,
    vendedor: alert.vendedor,
    industria: alert.industria,
    painPoint: alert.painPoint,
    conclusionEjecutiva: alert.conclusionEjecutiva,
    proximaAccion: alert.proximaAccion,
  });

  const handleUseAI = () => {
    if (!aiResult) return;
    setSubject(aiResult.subject);
    setBody(aiResult.body);
    clearResult();
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[540px] pointer-events-auto flex flex-col" style={{ maxHeight: "85vh" }}>
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Mail size={13} className="text-[#60A5FA]" />
                <span className="text-sm font-semibold text-foreground">Redactar mensaje</span>
              </div>
              <p className="text-xs text-muted-foreground">Para: {alert.nombre} · {alert.correo}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {sent ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                <Send size={20} className="text-[#10B981]" />
              </div>
              <p className="text-sm font-medium text-foreground">Mensaje listo para enviar</p>
              <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                Esta es una simulación. En producción el mensaje se enviaría a{" "}
                <span className="text-foreground">{alert.correo}</span>.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-border/80 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                  isWarning
                    ? "bg-amber-600/8 dark:bg-amber-500/5 border-amber-600/20 dark:border-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-muted border-border text-[#6B7280]"
                }`}>
                  {isWarning
                    ? <AlertTriangle size={11} className="shrink-0" />
                    : <Info size={11} className="shrink-0" />
                  }
                  <span>{alert.etiqueta}</span>
                  {alert.industria && (
                    <span className="text-[#505050]">· {capitalizeFirst(alert.industria)}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-[#505050] uppercase tracking-wider mb-1.5">Asunto</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#505050] uppercase tracking-wider mb-1.5">Mensaje</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB]/60 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={11} className="text-[#A855F7]" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Versión generada con IA</span>
                    </div>
                    <button
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/25 hover:bg-[#A855F7]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {aiLoading
                        ? <><RefreshCw size={10} className="animate-spin" />Generando...</>
                        : <><Sparkles size={10} />{aiResult ? "Regenerar" : "Generar"}</>
                      }
                    </button>
                  </div>

                  {aiError && (
                    <p className="text-[11px] text-red-400">{aiError}</p>
                  )}

                  {aiLoading && !aiResult && (
                    <div className="bg-muted border border-[#A855F7]/15 rounded-lg p-3 space-y-2 animate-pulse">
                      <div className="h-2.5 bg-border rounded w-2/3" />
                      <div className="h-2 bg-border rounded w-full" />
                      <div className="h-2 bg-border rounded w-5/6" />
                      <div className="h-2 bg-border rounded w-4/6" />
                    </div>
                  )}

                  {aiResult && (
                    <div className="bg-muted border border-[#A855F7]/20 rounded-lg p-3 space-y-2">
                      <p className="text-[10px] text-[#A855F7]/70 font-medium">{aiResult.subject}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiResult.body}</p>
                      <button
                        onClick={handleUseAI}
                        className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#A855F7]/15 text-[#C084FC] border border-[#A855F7]/30 hover:bg-[#A855F7]/25 transition-colors cursor-pointer"
                      >
                        Usar este mensaje
                      </button>
                    </div>
                  )}

                  {!aiResult && !aiLoading && !aiError && (
                    <p className="text-[11px] text-[#505050]">
                      Genera una versión más personalizada usando el contexto del cliente.
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
                <p className="text-[10px] text-[#505050]">Simulación · no se enviará ningún correo</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-border/80 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!subject.trim() || !body.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 hover:bg-[#2563EB]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Send size={11} />
                    Enviar mensaje
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

function TruncatedText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`relative group min-w-0 truncate ${className ?? ""}`}>
      <span className="truncate block">{text}</span>
      <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-50 hidden group-hover:block">
        <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground shadow-xl whitespace-normal max-w-[340px] leading-relaxed">
          {text}
        </div>
      </div>
    </div>
  );
}

function AlertRow({ alert, onContact }: { alert: AlertEntry; onContact: (a: AlertEntry) => void }) {
  const isWarning = alert.severidad === "warning";
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
      isWarning ? "bg-amber-600/8 dark:bg-amber-500/5 border-amber-600/20 dark:border-amber-500/15" : "bg-muted border-border"
    }`}>
      {isWarning
        ? <AlertTriangle size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />
        : <Info size={10} className="text-[#6B7280] shrink-0" />
      }

      <div className="shrink-0 min-w-[160px]">
        <span className="text-xs font-medium text-foreground">{alert.nombre}</span>
        <span className="text-[11px] text-[#505050] ml-1.5">· {alert.vendedor}</span>
        {alert.industria && (
          <span className="ml-1.5 text-[10px] text-[#6B7280] bg-muted border border-border px-1.5 py-0.5 rounded-full">
            {capitalizeFirst(alert.industria)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
        {alert.painPoint && (
          <TruncatedText text={alert.painPoint} className="text-[11px] text-muted-foreground shrink-0" />
        )}
        {alert.proximaAccion && isWarning && (
          <TruncatedText text={`→ ${alert.proximaAccion}`} className="text-[11px] text-[#10B981]/70 flex-1" />
        )}
      </div>

      <span className={`text-[10px] font-medium shrink-0 ${isWarning ? "text-amber-600 dark:text-amber-400" : "text-[#6B7280]"}`}>
        {alert.etiqueta}
      </span>
      <button
        onClick={() => onContact(alert)}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors cursor-pointer shrink-0 ${
          isWarning
            ? "bg-amber-600/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-600/25 dark:border-amber-500/25 hover:bg-amber-600/20 dark:hover:bg-amber-500/20"
            : "bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/25 hover:bg-[#2563EB]/20"
        }`}
      >
        <Mail size={10} />
        Contactar
      </button>
    </div>
  );
}

export function AlertsSection({ alertas }: AlertsSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [contactTarget, setContactTarget] = useState<AlertEntry | null>(null);

  const warnings = alertas.filter((a) => a.severidad === "warning");
  const infos = alertas.filter((a) => a.severidad === "info");

  return (
    <>
      {contactTarget && (
        <ContactModal alert={contactTarget} onClose={() => setContactTarget(null)} />
      )}

      <div className="bg-card border border-border rounded-xl">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-2 px-5 py-4 cursor-pointer hover:bg-muted transition-colors rounded-xl"
        >
          <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Señales de Atención
          </h3>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#505050]">
              {alertas.length} cliente{alertas.length !== 1 ? "s" : ""}
            </span>
            {collapsed
              ? <ChevronDown size={14} className="text-[#505050]" />
              : <ChevronUp size={14} className="text-[#505050]" />
            }
          </div>
        </button>

        {!collapsed && (
          <div className="px-5 pb-5 space-y-2">
            {warnings.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 uppercase tracking-wider font-medium">
                    Oportunidades sin cerrar
                  </p>
                  <p className="text-[10px] text-[#505050]">
                    Clientes con alto potencial que aún no firmaron
                  </p>
                </div>
                {warnings.map((a) => (
                  <AlertRow key={a.clientId} alert={a} onContact={setContactTarget} />
                ))}
              </div>
            )}

            {warnings.length > 0 && infos.length > 0 && (
              <div className="border-t border-border my-3" />
            )}

            {infos.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">
                    Datos a revisar
                  </p>
                  <p className="text-[10px] text-[#505050]">
                    Cierres con potencial bajo según el análisis IA
                  </p>
                </div>
                {infos.map((a) => (
                  <AlertRow key={a.clientId} alert={a} onContact={setContactTarget} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
