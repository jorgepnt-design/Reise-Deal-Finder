import {
  Bell,
  BellOff,
  CalendarDays,
  Hotel,
  Plane,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { activitiesByCity, cities } from "./data/cities";
import { agentStatus, buildDeals, runDailyPriceCheck } from "./services/dealAgents";
import type { Deal, SearchState } from "./types/travel";

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const defaultSearch: SearchState = {
  cityId: "lisbon",
  startDate: "2026-07-10",
  endDate: "2026-07-14",
  budget: 1400,
  people: 2,
  alertsEnabled: true,
};

function formatDateRange(deal: Deal) {
  return `${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(new Date(deal.startDate))} - ${new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(deal.endDate))}`;
}

function scoreLabel(score: number) {
  if (score >= 92) return "Top-Deal";
  if (score >= 86) return "Sehr stark";
  return "Solide";
}

export default function App() {
  const [search, setSearch] = useState<SearchState>(defaultSearch);
  const [activeTab, setActiveTab] = useState<"deals" | "agents" | "activities">("deals");
  const [lastRun, setLastRun] = useState("Heute 07:00");

  const selectedCity = cities.find((city) => city.id === search.cityId) ?? cities[0];
  const deals = useMemo(() => buildDeals(search).sort((a, b) => b.score - a.score), [search]);
  const alertSummary = useMemo(() => runDailyPriceCheck(deals), [deals]);
  const featuredDeal = deals[0];
  const activities = activitiesByCity[selectedCity.id] ?? activitiesByCity.lisbon;

  function updateSearch<Key extends keyof SearchState>(key: Key, value: SearchState[Key]) {
    setSearch((current) => ({ ...current, [key]: value }));
  }

  function refreshAgents() {
    setLastRun(new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
  }

  return (
    <main className="min-h-screen bg-[#090d14] text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <img className="absolute inset-0 h-full w-full object-cover opacity-38" src={selectedCity.heroImage} alt={selectedCity.name} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090d14]/45 via-[#090d14]/80 to-[#090d14]" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
                <Plane size={22} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Reise Deal Finder</p>
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">{selectedCity.name} Deals live vergleichen</h1>
              </div>
            </div>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
              onClick={() => updateSearch("alertsEnabled", !search.alertsEnabled)}
              type="button"
            >
              {search.alertsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              {search.alertsEnabled ? "Push aktiv" : "Push aus"}
            </button>
          </header>

          <div className="grid flex-1 items-end gap-8 pb-8 pt-16 lg:grid-cols-[1fr_430px]">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-1 text-sm font-semibold text-emerald-950">
                <Sparkles size={16} /> {alertSummary.headline}
              </p>
              <h2 className="text-5xl font-semibold leading-[1.02] text-white sm:text-7xl">{selectedCity.name} unter Budget finden</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                Vier Agenten durchsuchen Fluege, Hotels, Preis-Historie und Aktivitaeten. Die besten Kombi-Deals werden nach
                Preis, Bewertung, Datum und Preisfall sortiert.
              </p>
              {featuredDeal && (
                <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
                  <Metric label="Bester Preis" value={currency.format(featuredDeal.totalPrice)} />
                  <Metric label="Datum" value={formatDateRange(featuredDeal)} />
                  <Metric label="Score" value={`${featuredDeal.score}/100`} />
                </div>
              )}
            </div>

            <SearchPanel search={search} onChange={updateSearch} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {[
              ["deals", "Deals"],
              ["agents", "Agenten"],
              ["activities", "Aktivitaeten"],
            ].map(([id, label]) => (
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === id ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 hover:bg-white/10"
            onClick={refreshAgents}
            type="button"
          >
            <RefreshCw size={16} /> Preise aktualisieren
          </button>
        </div>

        {activeTab === "deals" && (
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard deal={deal} key={deal.id} />
            ))}
          </div>
        )}

        {activeTab === "agents" && (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {agentStatus.map((agent) => (
              <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5" key={agent.name}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{agent.name}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{agent.title}</h3>
                  </div>
                  <span className="rounded-md bg-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-950">{agent.state}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{agent.description}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {agent.sources.map((source) => (
                    <a className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 hover:border-cyan-300" href={source.url} key={source.name} rel="noreferrer" target="_blank">
                      {source.name}
                    </a>
                  ))}
                </div>
              </article>
            ))}
            <article className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-5 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-cyan-100">Scheduled Task</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Taeglich um 07:00 Uhr vergleichen</h3>
                </div>
                <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-slate-950">Letzter Lauf: {lastRun}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                Push wird ausgelost, wenn ein Preis um mehr als 10 Prozent faellt oder ein neuer Deal auftaucht. In der App kann
                der Schalter oben rechts jederzeit deaktiviert werden.
              </p>
            </article>
          </div>
        )}

        {activeTab === "activities" && (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {activities.map((activity) => (
              <article className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]" key={activity.title}>
                <img className="h-40 w-full object-cover" src={activity.image} alt={activity.title} />
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{activity.kind}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{activity.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{activity.description}</p>
                  <p className="mt-4 text-sm font-semibold text-emerald-200">{activity.priceHint}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

type SearchPanelProps = {
  search: SearchState;
  onChange: <Key extends keyof SearchState>(key: Key, value: SearchState[Key]) => void;
};

function SearchPanel({ search, onChange }: SearchPanelProps) {
  return (
    <form className="rounded-lg border border-white/15 bg-[#111827]/85 p-5 shadow-2xl backdrop-blur" onSubmit={(event) => event.preventDefault()}>
      <div className="mb-5 flex items-center gap-3">
        <Search className="text-cyan-200" size={20} />
        <h2 className="text-lg font-semibold text-white">Deal-Suche</h2>
      </div>
      <label className="block text-sm font-medium text-slate-300" htmlFor="city">
        Zielstadt
      </label>
      <select className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" id="city" value={search.cityId} onChange={(event) => onChange("cityId", event.target.value)}>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field icon={<CalendarDays size={16} />} label="Von" type="date" value={search.startDate} onChange={(value) => onChange("startDate", value)} />
        <Field icon={<CalendarDays size={16} />} label="Bis" type="date" value={search.endDate} onChange={(value) => onChange("endDate", value)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field icon={<Wallet size={16} />} label="Budget" min={250} step={25} type="number" value={String(search.budget)} onChange={(value) => onChange("budget", Number(value))} />
        <Field icon={<Users size={16} />} label="Personen" min={1} max={6} type="number" value={String(search.people)} onChange={(value) => onChange("people", Number(value))} />
      </div>
      <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
        Start: Deutschland. Sortierung: Preis-Leistung, Preisfall, Datum und Bewertung.
      </div>
    </form>
  );
}

type FieldProps = {
  icon: ReactNode;
  label: string;
  value: string;
  type: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: string) => void;
};

function Field({ icon, label, value, type, min, max, step, onChange }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      <span className="mb-2 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <input className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" max={max} min={min} step={step} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const overBudget = deal.totalPrice > deal.budget;

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#111827] shadow-xl">
      <img className="h-48 w-full object-cover" src={deal.image} alt={deal.title} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cyan-200">{scoreLabel(deal.score)}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{deal.title}</h3>
          </div>
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${overBudget ? "bg-amber-300 text-amber-950" : "bg-emerald-300 text-emerald-950"}`}>
            {overBudget ? "ueber Budget" : "im Budget"}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <Info icon={<Plane size={16} />} label="Flug" value={currency.format(deal.flightPrice)} />
          <Info icon={<Hotel size={16} />} label="Hotel" value={currency.format(deal.hotelPrice)} />
          <Info icon={<ShieldCheck size={16} />} label="Rating" value={`${deal.hotelRating}/10`} />
        </div>
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-sm text-slate-400">{formatDateRange(deal)}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{currency.format(deal.totalPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-emerald-200">{deal.priceDropPercent}% gefallen</p>
            <p className="mt-1 text-xs text-slate-400">{deal.people} Personen</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-3">
      <p className="flex items-center gap-2 text-slate-400">{icon}{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
