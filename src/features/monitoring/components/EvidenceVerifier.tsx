import { useState, useCallback } from "react";
import { Shield, Upload, CheckCircle, XCircle, FileText, Hash, GitBranch, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvidenceRecord {
  id: string;
  sha256_hash: string;
  prev_hash: string | null;
  chain_index: number;
  data: Record<string, unknown>;
  sealed_at: string;
  event_type: string;
  description: string;
}

interface VerificationResult {
  totalRecords: number;
  validHashes: number;
  invalidHashes: number;
  chainIntegrity: boolean;
  details: { index: number; id: string; hashValid: boolean; chainValid: boolean; computedHash: string; storedHash: string }[];
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const EvidenceVerifier = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  }, []);

  const verify = useCallback(async () => {
    if (!file) return;
    setVerifying(true);
    setError(null);

    try {
      const text = await file.text();
      const bundle = JSON.parse(text);
      const records: EvidenceRecord[] = bundle.records || bundle.evidence || bundle;

      if (!Array.isArray(records) || records.length === 0) {
        setError("El archivo no contiene registros de evidencia válidos.");
        setVerifying(false);
        return;
      }

      const sorted = [...records].sort((a, b) => (a.chain_index || 0) - (b.chain_index || 0));
      const details: VerificationResult["details"] = [];
      let chainOk = true;

      for (let i = 0; i < sorted.length; i++) {
        const rec = sorted[i];
        const dataStr = JSON.stringify(rec.data) + (rec.prev_hash || "");
        const computedHash = await sha256(dataStr);
        const hashValid = computedHash === rec.sha256_hash;

        let chainValid = true;
        if (i > 0 && rec.prev_hash) {
          chainValid = rec.prev_hash === sorted[i - 1].sha256_hash;
        }
        if (!chainValid) chainOk = false;

        details.push({
          index: rec.chain_index || i,
          id: rec.id,
          hashValid,
          chainValid,
          computedHash,
          storedHash: rec.sha256_hash,
        });
      }

      setResult({
        totalRecords: sorted.length,
        validHashes: details.filter(d => d.hashValid).length,
        invalidHashes: details.filter(d => !d.hashValid).length,
        chainIntegrity: chainOk,
        details,
      });
    } catch (err) {
      setError(`Error al procesar: ${(err as Error).message}`);
    }

    setVerifying(false);
  }, [file]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold" /> Verificador Offline de Evidencia
        </h2>
        <p className="text-xs text-sidebar-foreground/50">Sube un bundle JSON exportado para recomputar hashes y verificar integridad sin conexión</p>
        <a href="/sample-evidence.json" download className="text-[10px] text-gold hover:underline mt-1 inline-block">
          ¿No tienes uno? Descarga un ejemplo aquí
        </a>
      </div>

      {/* Upload area */}
      <div className="rounded-xl border-2 border-dashed border-sidebar-border hover:border-gold/30 transition-colors p-8 text-center">
        <Upload className="w-10 h-10 text-sidebar-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-sidebar-foreground/50 mb-3">Arrastra un archivo JSON o haz clic para seleccionar</p>
        <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" id="evidence-file" />
        <label htmlFor="evidence-file">
          <Button variant="outline" className="border-gold/20 text-gold cursor-pointer" asChild>
            <span><FileText className="w-4 h-4 mr-2" /> Seleccionar Bundle</span>
          </Button>
        </label>
        {file && <p className="text-xs text-sidebar-foreground/60 mt-2">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
      </div>

      {file && !result && (
        <Button onClick={verify} disabled={verifying} className="bg-gold text-sidebar hover:bg-gold/90">
          {verifying ? "Verificando…" : "🔍 Verificar Integridad"}
        </Button>
      )}

      {error && (
        <div className="rounded-xl p-4 border border-red-500/30 bg-red-500/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <FileText className="w-4 h-4 text-gold mb-2" />
              <div className="text-2xl font-bold text-sidebar-foreground font-heading">{result.totalRecords}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Registros</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <Hash className="w-4 h-4 text-green-500 mb-2" />
              <div className="text-2xl font-bold text-green-500 font-heading">{result.validHashes}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Hashes válidos</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <XCircle className="w-4 h-4 text-red-400 mb-2" />
              <div className="text-2xl font-bold text-red-400 font-heading">{result.invalidHashes}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Hashes inválidos</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <GitBranch className={`w-4 h-4 mb-2 ${result.chainIntegrity ? "text-green-500" : "text-red-400"}`} />
              <div className={`text-2xl font-bold font-heading ${result.chainIntegrity ? "text-green-500" : "text-red-400"}`}>
                {result.chainIntegrity ? "OK" : "ROTO"}
              </div>
              <div className="text-[10px] text-sidebar-foreground/50">Cadena hash</div>
            </div>
          </div>

          {/* Global result */}
          <div className={`rounded-xl p-4 border flex items-center gap-3 ${result.invalidHashes === 0 && result.chainIntegrity
            ? "border-green-500/30 bg-green-500/5"
            : "border-red-500/30 bg-red-500/5"
            }`}>
            {result.invalidHashes === 0 && result.chainIntegrity ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-sm font-bold text-green-500">✅ Integridad verificada</p>
                  <p className="text-[10px] text-sidebar-foreground/50">Todos los hashes coinciden y la cadena es continua. Los datos no han sido alterados.</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-400">⚠️ Integridad comprometida</p>
                  <p className="text-[10px] text-sidebar-foreground/50">{result.invalidHashes} hash(es) no coinciden. Los datos pueden haber sido manipulados.</p>
                </div>
              </>
            )}
          </div>

          {/* Details table */}
          <div className="rounded-xl border bg-sidebar border-sidebar-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-sidebar-foreground/40 border-b border-sidebar-border">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">ID</th>
                  <th className="text-left py-2 px-3">Hash</th>
                  <th className="text-center py-2 px-3">SHA-256</th>
                  <th className="text-center py-2 px-3">Chain</th>
                </tr>
              </thead>
              <tbody>
                {result.details.map((d) => (
                  <tr key={d.index} className="border-b border-sidebar-border/30">
                    <td className="py-2 px-3 font-mono text-sidebar-foreground/40">#{d.index}</td>
                    <td className="py-2 px-3 font-mono text-sidebar-foreground/60">{d.id.slice(0, 8)}…</td>
                    <td className="py-2 px-3 font-mono text-sidebar-foreground/40">{d.storedHash.slice(0, 12)}…</td>
                    <td className="py-2 px-3 text-center">
                      {d.hashValid ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {d.chainValid ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceVerifier;
