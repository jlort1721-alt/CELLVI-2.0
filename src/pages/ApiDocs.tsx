import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Send,
  Lock,
  Key,
  Globe,
  Webhook,
  Code,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-500",
  POST: "bg-blue-500/10 text-blue-500",
  PUT: "bg-orange-500/10 text-orange-400",
  DELETE: "bg-red-500/10 text-red-400",
  PATCH: "bg-purple-500/10 text-purple-400",
};

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  tag: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  body?: string;
  response?: string;
}

const endpoints: Endpoint[] = [
  { method: "POST", path: "/api-gateway/auth/login", summary: "Authenticate and get JWT token", tag: "Auth", auth: false, body: '{ "email": "user@company.co", "password": "..." }', response: '{ "access_token": "eyJ...", "token_type": "bearer", "expires_in": 3600, "user": { ... } }' },
  { method: "POST", path: "/api-gateway/auth/refresh", summary: "Refresh an expired token", tag: "Auth", auth: true, body: '{ "refresh_token": "..." }', response: '{ "access_token": "eyJ...", "refresh_token": "..." }' },
  { method: "GET", path: "/api-gateway/vehicles", summary: "List all vehicles for tenant", tag: "Fleet", auth: true, params: [{ name: "page", type: "number", required: false, desc: "Page number (default 1)" }, { name: "per_page", type: "number", required: false, desc: "Results per page (max 100)" }, { name: "status", type: "string", required: false, desc: "Filter: active | inactive" }], response: '{ "data": [{ "id": "...", "plate": "ABC-123", "type": "truck", ... }], "pagination": { "page": 1, "per_page": 20, "total": 45 } }' },
  { method: "GET", path: "/api-gateway/vehicles/:id", summary: "Get vehicle detail with last telemetry", tag: "Fleet", auth: true, response: '{ "id": "...", "plate": "ABC-123", "last_position": { "lat": 1.21, "lng": -77.28 }, ... }' },
  { method: "GET", path: "/api-gateway/drivers", summary: "List all drivers for tenant", tag: "Fleet", auth: true, response: '{ "data": [...], "pagination": { ... } }' },
  { method: "GET", path: "/api-gateway/geofences", summary: "List geofences", tag: "Fleet", auth: true, response: '{ "data": [...] }' },
  { method: "GET", path: "/api-gateway/telemetry", summary: "Query telemetry events", tag: "Telemetry", auth: true, params: [{ name: "vehicle_id", type: "uuid", required: false, desc: "Filter by vehicle" }, { name: "from", type: "ISO8601", required: false, desc: "Start timestamp" }, { name: "to", type: "ISO8601", required: false, desc: "End timestamp" }, { name: "limit", type: "number", required: false, desc: "Max results (default 100)" }], response: '{ "data": [{ "ts": "...", "lat": 1.21, "lng": -77.28, "speed": 65, ... }] }' },
  { method: "POST", path: "/telemetry-ingest", summary: "Ingest telemetry from device", tag: "Telemetry", auth: true, body: '{ "imei": "860123456789012", "events": [{ "ts": "...", "lat": 1.21, "lng": -77.28, "speed": 55 }] }', response: '{ "processed": 1, "vehicle_id": "..." }' },
  { method: "POST", path: "/device-gateway", summary: "Multi-protocol device data ingestion", tag: "Devices", auth: false, body: '{ "imei": "860123456789012", "protocol": "generic_json", "data": { ... } }', response: '{ "status": "accepted", "message_id": "..." }' },
  { method: "GET", path: "/api-gateway/alerts", summary: "List active alerts", tag: "Monitoring", auth: true, response: '{ "data": [{ "id": "...", "type": "speed_exceeded", "severity": "high", ... }] }' },
  { method: "PATCH", path: "/api-gateway/alerts/:id/acknowledge", summary: "Acknowledge an alert", tag: "Monitoring", auth: true, response: '{ "acknowledged": true, "acknowledged_at": "..." }' },
  { method: "GET", path: "/api-gateway/evidence", summary: "Query evidence records with chain verification", tag: "Evidence", auth: true, params: [{ name: "chain", type: "boolean", required: false, desc: "Include chain verification" }], response: '{ "data": [...], "chain_valid": true }' },
  { method: "POST", path: "/evidence-seal", summary: "Seal an event with SHA-256 hash", tag: "Evidence", auth: true, body: '{ "event_type": "speed_alert", "description": "...", "data": { ... } }', response: '{ "id": "...", "sha256_hash": "a1b2c3...", "chain_index": 42 }' },
  { method: "POST", path: "/evidence-export", summary: "Export evidence bundle with Merkle proofs", tag: "Evidence", auth: true, body: '{ "from": "2026-01-01", "to": "2026-02-01", "include_proofs": true }', response: '{ "bundle_hash": "...", "records": [...], "merkle_root": "..." }' },
  { method: "GET", path: "/api-gateway/policies", summary: "List policy engine rules", tag: "Policies", auth: true, response: '{ "data": [{ "id": "...", "name": "Speed > 120km/h", "status": "active", ... }] }' },
  { method: "POST", path: "/api-gateway/webhooks", summary: "Register a webhook listener", tag: "Integrations", auth: true, body: '{ "url": "https://your-app.com/webhook", "events": ["alert.created", "geofence.breach"], "secret": "..." }', response: '{ "id": "...", "status": "active" }' },
];

const tags = [...new Set(endpoints.map((e) => e.tag))];

const ApiDocs = () => {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filteredEndpoints = activeTag === "all" ? endpoints : endpoints.filter((e) => e.tag === activeTag);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge className="bg-gold/10 text-gold border-gold/30 mb-3">API Reference v2</Badge>
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-foreground mb-3">
              CELLVI RESTful API
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Integre la plataforma CELLVI con su ERP, TMS o sistema de despacho. OAuth2, webhooks firmados, y documentación OpenAPI 3.1.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Globe className="w-4 h-4" /> Base URL: <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">https://ydejpsvpcgjpokgbiulw.supabase.co/functions/v1</code></div>
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="w-3.5 h-3.5" /> OAuth2 + Bearer Token</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Key className="w-3.5 h-3.5" /> HMAC-SHA256 Webhooks</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Webhook className="w-3.5 h-3.5" /> Rate Limited</div>
            </div>
          </motion.div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button onClick={() => setActiveTag("all")} className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all ${activeTag === "all" ? "bg-gold-gradient text-navy" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              Todos ({endpoints.length})
            </button>
            {tags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all ${activeTag === tag ? "bg-gold-gradient text-navy" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {tag} ({endpoints.filter((e) => e.tag === tag).length})
              </button>
            ))}
          </div>

          {/* Endpoints */}
          <div className="space-y-2">
            {filteredEndpoints.map((ep, i) => {
              const id = `${ep.method}-${ep.path}`;
              const isExpanded = expandedId === id;
              return (
                <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="border border-border rounded-lg overflow-hidden bg-card hover:border-gold/30 transition-all">
                    <button onClick={() => setExpandedId(isExpanded ? null : id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${METHOD_COLORS[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                      {ep.auth && <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />}
                      <span className="text-xs text-muted-foreground hidden md:block">{ep.summary}</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">
                        <p className="text-sm text-muted-foreground">{ep.summary}</p>
                        {ep.auth && (
                          <div className="flex items-center gap-2 text-xs text-orange-400">
                            <Lock className="w-3.5 h-3.5" /> Requires Authorization: Bearer &lt;token&gt;
                          </div>
                        )}
                        {ep.params && (
                          <div>
                            <h4 className="text-xs font-heading font-bold text-foreground mb-2">Query Parameters</h4>
                            <div className="space-y-1">
                              {ep.params.map((p) => (
                                <div key={p.name} className="flex items-center gap-3 text-xs">
                                  <code className="font-mono text-gold">{p.name}</code>
                                  <span className="text-muted-foreground/50">{p.type}</span>
                                  {p.required && <Badge variant="outline" className="text-[9px] h-4">required</Badge>}
                                  <span className="text-muted-foreground">{p.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {ep.body && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-heading font-bold text-foreground">Request Body</h4>
                              <button onClick={() => copyToClipboard(ep.body!, `body-${id}`)} className="text-muted-foreground hover:text-foreground">
                                {copied === `body-${id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <pre className="bg-card border border-border rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto">{ep.body}</pre>
                          </div>
                        )}
                        {ep.response && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-heading font-bold text-foreground">Response (200)</h4>
                              <button onClick={() => copyToClipboard(ep.response!, `resp-${id}`)} className="text-muted-foreground hover:text-foreground">
                                {copied === `resp-${id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <pre className="bg-card border border-border rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto">{ep.response}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rate Limiting Info */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Rate Limiting & Fair Use</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="font-heading font-bold text-gold text-2xl mb-1">10K</div>
                <div className="text-muted-foreground text-xs">SMB: requests/month</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="font-heading font-bold text-gold text-2xl mb-1">200K</div>
                <div className="text-muted-foreground text-xs">Business: requests/month</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="font-heading font-bold text-gold text-2xl mb-1">∞</div>
                <div className="text-muted-foreground text-xs">Enterprise: adaptive throttling</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Exceeding limits returns HTTP 429 with <code className="bg-muted px-1 rounded">Retry-After</code> header. 
              Webhooks use HMAC-SHA256 signature verification via <code className="bg-muted px-1 rounded">X-Signature-256</code> header.
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;
