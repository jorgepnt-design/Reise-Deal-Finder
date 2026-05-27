import {
  Bell,
  BellOff,
  Bookmark,
  BookmarkCheck,
  CalendarCheck,
  CalendarDays,
  ExternalLink,
  Heart,
  Hotel,
  LineChart,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Timer,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { activitiesByCity, cities } from "./data/cities";
import { agentStatus, buildDeals, buildFlights, loadLiveDeals, originAirports, recommendTravelDates, runDailyPriceCheck } from "./services/dealAgents";
import type { DateRecommendation, Deal, FlightOption, SearchState } from "./types/travel";

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
type FlightSort = "priceAsc" | "priceDesc" | "departureAsc" | "directFirst";
type PackageSort = "packagePriceAsc" | "packagePriceDesc" | "separateTotalAsc" | "departureAsc" | "directFirst";
type PackageItem = { deal: Deal; flight: FlightOption };

const defaultSearch: SearchState = {
  cityId: "lisbon",
  startDate: "2026-07-10",
  endDate: "2026-07-14",
  budget: 1400,
  people: 2,
  alertsEnabled: true,
  tripMode: "package",
  flightType: "roundTrip",
  originAirport: "FRA",
  directOnly: false,
  durationFilter: "any",
  weekendOnly: false,
  minHotelRating: 8,
  baggage: "carryOn",
  flexibleSearch: "exact",
  dateFlexDays: 0,
  outboundTimeWindow: "any",
  returnTimeWindow: "any",
};

function formatDateRange(deal: Deal) {
  if (deal.flightType === "oneWay") {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(deal.startDate));
  }
  return `${formatShortDate(deal.startDate)} - ${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(deal.endDate))}`;
}

function formatDealPriceLabel(deal: Deal) {
  return `${formatDisplayPrice(deal.totalPrice, deal.isLive)} gesamt (${formatDisplayPrice(Math.round(deal.totalPrice / deal.people), deal.isLive)} p. P.)`;
}

function formatApproxPrice(value: number) {
  return `ca. ${currency.format(value)}`;
}

function formatDisplayPrice(value: number, isLive: boolean) {
  return isLive ? currency.format(value) : formatApproxPrice(value);
}

function scoreLabel(score: number) {
  if (score >= 92) return "Top-Deal";
  if (score >= 86) return "Sehr stark";
  return "Solide";
}

export default function App() {
  const [search, setSearch] = useState<SearchState>(defaultSearch);
  const [activeTab, setActiveTab] = useState<"deals" | "flights" | "packages" | "wishlist" | "agents" | "activities">("deals");
  const [lastRun, setLastRun] = useState("Heute 07:00");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [liveDeals, setLiveDeals] = useState<Deal[]>([]);
  const [liveStatus, setLiveStatus] = useState<"fallback" | "loading" | "live" | "error">("fallback");
  const [flightSort, setFlightSort] = useState<FlightSort>("priceAsc");
  const [packageSort, setPackageSort] = useState<PackageSort>("packagePriceAsc");
  const [savedDealIds, setSavedDealIds] = useStoredList("reise-deal-finder-saved-deals");
  const [savedFlightIds, setSavedFlightIds] = useStoredList("reise-deal-finder-saved-flights");
  const [savedPackageIds, setSavedPackageIds] = useStoredList("reise-deal-finder-saved-packages");
  const [favoriteCityIds, setFavoriteCityIds] = useStoredList("reise-deal-finder-favorite-cities");

  const selectedCity = cities.find((city) => city.id === search.cityId) ?? cities[0];
  const fallbackDeals = useMemo(() => buildDeals(search).sort((a, b) => b.score - a.score), [search]);
  const deals = useMemo(() => (liveDeals.length > 0 ? liveDeals : fallbackDeals).sort((a, b) => b.score - a.score), [fallbackDeals, liveDeals]);
  const dateRecommendations = useMemo(() => recommendTravelDates(search), [search]);
  const flights = useMemo(() => sortFlights(buildFlights(search), flightSort), [flightSort, search]);
  const packageSearch = useMemo<SearchState>(() => ({ ...search, tripMode: "package", flightType: "roundTrip" }), [search]);
  const packageFlights = useMemo(() => buildFlights(packageSearch), [packageSearch]);
  const packageDeals = useMemo(() => buildDeals(packageSearch).sort((a, b) => a.totalPrice - b.totalPrice), [packageSearch]);
  const packages = useMemo(() => sortPackageItems(buildPackageItems(packageDeals, packageFlights), packageSort), [packageDeals, packageFlights, packageSort]);
  const alertSummary = useMemo(() => runDailyPriceCheck(deals), [deals]);
  const featuredDeal = deals[0];
  const activities = activitiesByCity[selectedCity.id] ?? activitiesByCity.lisbon;
  const savedDeals = deals.filter((deal) => savedDealIds.includes(deal.id));
  const savedFlights = flights.filter((flight) => savedFlightIds.includes(flight.id));
  const savedPackages = packages.filter((item) => savedPackageIds.includes(packageItemId(item)));
  const hasSavedItems = savedDeals.length > 0 || savedFlights.length > 0 || savedPackages.length > 0;

  useEffect(() => {
    let cancelled = false;
    setLiveStatus("loading");
    loadLiveDeals(search)
      .then((items) => {
        if (cancelled) return;
        setLiveDeals(items);
        setLiveStatus(items.length > 0 ? "live" : "fallback");
      })
      .catch(() => {
        if (cancelled) return;
        setLiveDeals([]);
        setLiveStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  function updateSearch<Key extends keyof SearchState>(key: Key, value: SearchState[Key]) {
    setSearch((current) => ({ ...current, [key]: value }));
  }

  function applyDateRecommendation(recommendation: DateRecommendation) {
    setSearch((current) => ({
      ...current,
      startDate: recommendation.startDate,
      endDate: current.flightType === "oneWay" ? current.endDate : recommendation.endDate,
      originAirport: recommendation.originAirport,
    }));
  }

  async function toggleAlerts() {
    const next = !search.alertsEnabled;
    if (next) await requestNotificationPermission();
    updateSearch("alertsEnabled", next);
  }

  function refreshAgents() {
    setLastRun(new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
    if (search.alertsEnabled && alertSummary.shouldPush) {
      sendBrowserNotification(alertSummary.headline, featuredDeal ? `${featuredDeal.title} ab ${formatApproxPrice(featuredDeal.totalPrice)}` : "Neue Reise-Deals verfügbar");
    }
  }

  function toggleSavedDeal(dealId: string) {
    setSavedDealIds((current) => toggleListValue(current, dealId));
  }

  function toggleSavedFlight(flightId: string) {
    setSavedFlightIds((current) => toggleListValue(current, flightId));
  }

  function toggleSavedPackage(packageId: string) {
    setSavedPackageIds((current) => toggleListValue(current, packageId));
  }

  function toggleFavoriteCity(cityId: string) {
    setFavoriteCityIds((current) => toggleListValue(current, cityId));
  }

  return (
    <main className="min-h-screen bg-[#090d14] text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <img className="absolute inset-0 h-full w-full object-cover opacity-35" src={selectedCity.heroImage} alt={selectedCity.name} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090d14]/45 via-[#090d14]/82 to-[#090d14]" />
        <div className="relative mx-auto flex min-h-[76vh] max-w-7xl flex-col px-4 py-5 sm:min-h-[88vh] sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
                <Plane size={22} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Jorge's Reise-Deal-Finder</p>
                <h1 className="text-xl font-semibold text-white sm:text-3xl">{selectedCity.name} Deals live vergleichen</h1>
              </div>
            </div>
            <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15" onClick={toggleAlerts} type="button">
              {search.alertsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              {search.alertsEnabled ? "Push aktiv" : "Push aus"}
            </button>
          </header>

          <div className="relative mx-auto mt-5 w-full max-w-6xl overflow-hidden rounded-xl border border-cyan-200/20 bg-[#07111f]/90 p-2 shadow-[0_24px_80px_rgba(8,13,20,0.55)] backdrop-blur">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,13,20,0.88),rgba(10,25,40,0.34)_48%,rgba(202,160,72,0.12))]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
            <img
              className="relative h-auto max-h-40 w-full rounded-lg object-cover opacity-95 mix-blend-screen contrast-110 saturate-110 sm:max-h-52"
              src={`${import.meta.env.BASE_URL}brand/jorge-reise-deal-finder-wide.png`}
              alt="Jorge's Reise-Deal-Finder"
            />
          </div>

          <div className="grid flex-1 items-end gap-7 pb-6 pt-8 sm:pt-12 lg:grid-cols-[1fr_460px]">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-1 text-sm font-semibold text-emerald-950">
                <Sparkles size={16} /> {alertSummary.headline}
              </p>
              <h2 className="text-4xl font-semibold leading-[1.02] text-white sm:text-7xl">{selectedCity.name} unter Budget finden</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                Live-Adapter, Preisverlauf, flexible Reisedaten, Gepäckfilter und Merkliste helfen dir, Deals schneller zu bewerten.
              </p>
              {featuredDeal && (
                <div className="mt-7 grid max-w-2xl grid-cols-3 gap-3">
                  <Metric label={search.tripMode === "flight" ? "Bester Flug" : "Bester Richtpreis"} value={formatDealPriceLabel(featuredDeal)} />
                  <Metric label={search.flightType === "oneWay" ? "Hinflug" : "Datum"} value={formatDateRange(featuredDeal)} />
                  <Metric label="Abflug" value={featuredDeal.originAirport} />
                </div>
              )}
            </div>

            <SearchPanel favoriteCityIds={favoriteCityIds} search={search} onChange={updateSearch} onToggleFavoriteCity={toggleFavoriteCity} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {[
              ["deals", "Deals"],
              ["flights", "Flüge"],
              ["packages", "Flug + Hotel"],
              ["wishlist", "Merkliste"],
              ["agents", "Agenten"],
              ["activities", "Aktivitäten"],
            ].map(([id, label]) => (
              <button className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === id ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`} key={id} onClick={() => setActiveTab(id as typeof activeTab)} type="button">
                {label}
              </button>
            ))}
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 hover:bg-white/10" onClick={refreshAgents} type="button">
            <RefreshCw size={16} /> Preise aktualisieren
          </button>
        </div>

        {activeTab === "deals" && (
          <>
            <LiveStatusBadge status={liveStatus} />
            <DateRecommendations flightType={search.flightType} items={dateRecommendations} onApply={applyDateRecommendation} />
            {deals.length === 0 ? (
              <EmptyPanel title="Keine Deals für diese Filter" text="Lockere Direktflug, Gepäck, Budget oder Reisedauer, um wieder Angebote zu sehen." />
            ) : (
              <div className="mt-7 grid gap-5 lg:grid-cols-3">
                {deals.map((deal) => (
                  <DealCard deal={deal} isSaved={savedDealIds.includes(deal.id)} key={deal.id} onOpen={setSelectedDeal} onToggleSave={toggleSavedDeal} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "flights" && <FlightsPanel flights={flights} people={search.people} savedFlightIds={savedFlightIds} sort={flightSort} onSortChange={setFlightSort} onToggleSave={toggleSavedFlight} />}

        {activeTab === "packages" && <FlightHotelPanel packages={packages} people={search.people} savedPackageIds={savedPackageIds} sort={packageSort} onSortChange={setPackageSort} onToggleSave={toggleSavedPackage} />}

        {activeTab === "wishlist" && (
          <div className="mt-7 space-y-8">
            {!hasSavedItems ? (
              <EmptyPanel title="Noch nichts gespeichert" text="Klicke auf das Lesezeichen an Deals, Flügen oder Flug+Hotel-Angeboten, um sie später zu vergleichen." />
            ) : (
              <>
                {savedDeals.length > 0 && (
                  <WishlistSection title="Gespeicherte Deals">
                    <div className="grid gap-5 lg:grid-cols-3">
                      {savedDeals.map((deal) => (
                        <DealCard deal={deal} isSaved={savedDealIds.includes(deal.id)} key={deal.id} removeMode onOpen={setSelectedDeal} onToggleSave={toggleSavedDeal} />
                      ))}
                    </div>
                  </WishlistSection>
                )}
                {savedFlights.length > 0 && (
                  <WishlistSection title="Gespeicherte Flüge">
                    <FlightsPanel compact flights={savedFlights} people={search.people} savedFlightIds={savedFlightIds} sort={flightSort} onSortChange={setFlightSort} onToggleSave={toggleSavedFlight} />
                  </WishlistSection>
                )}
                {savedPackages.length > 0 && (
                  <WishlistSection title="Gespeicherte Flug + Hotel-Angebote">
                    <FlightHotelPanel compact packages={savedPackages} people={search.people} savedPackageIds={savedPackageIds} sort={packageSort} onSortChange={setPackageSort} onToggleSave={toggleSavedPackage} />
                  </WishlistSection>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "agents" && <AgentsPanel lastRun={lastRun} />}

        {activeTab === "activities" && (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {activities.map((activity) => (
              <a className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-cyan-300" href={activity.url} key={activity.title} rel="noreferrer" target="_blank">
                <img className="h-40 w-full object-cover" src={activity.image} alt={activity.title} />
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{activity.kind}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{activity.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{activity.description}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">{activity.priceHint} <ExternalLink size={14} /></p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          isSaved={savedDealIds.includes(selectedDeal.id)}
          onApply={(changes) => {
            setSearch((current) => ({ ...current, ...changes }));
            setSelectedDeal(null);
          }}
          onClose={() => setSelectedDeal(null)}
          onToggleSave={toggleSavedDeal}
        />
      )}
    </main>
  );
}

type SearchPanelProps = {
  favoriteCityIds: string[];
  search: SearchState;
  onChange: <Key extends keyof SearchState>(key: Key, value: SearchState[Key]) => void;
  onToggleFavoriteCity: (cityId: string) => void;
};

function SearchPanel({ favoriteCityIds, search, onChange, onToggleFavoriteCity }: SearchPanelProps) {
  return (
    <form className="rounded-lg border border-white/15 bg-[#111827]/88 p-4 shadow-2xl backdrop-blur sm:p-5" onSubmit={(event) => event.preventDefault()}>
      <div className="mb-5 flex items-center gap-3">
        <Search className="text-cyan-200" size={20} />
        <h2 className="text-lg font-semibold text-white">Deal-Suche</h2>
      </div>
      <div className="flex items-end gap-2">
        <label className="block flex-1 text-sm font-medium text-slate-300" htmlFor="city">
          Zielstadt
          <select className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" id="city" value={search.cityId} onChange={(event) => onChange("cityId", event.target.value)}>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <button className={`grid h-12 w-12 place-items-center rounded-md border border-white/10 ${favoriteCityIds.includes(search.cityId) ? "bg-rose-300 text-rose-950" : "bg-black/30 text-slate-300"}`} onClick={() => onToggleFavoriteCity(search.cityId)} type="button" aria-label="Ziel favorisieren">
          <Heart size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
        {[
          ["package", "Flug + Hotel"],
          ["flight", "Nur Flug"],
        ].map(([value, label]) => (
          <button
            className={`h-10 rounded-md text-sm font-semibold transition ${search.tripMode === value ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}
            key={value}
            onClick={() => {
              onChange("tripMode", value as SearchState["tripMode"]);
              if (value === "package") onChange("flightType", "roundTrip");
            }}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
        {[
          ["roundTrip", "Hin & zurück"],
          ["oneWay", "nur Hinflug"],
        ].map(([value, label]) => (
          <button
            className={`h-10 rounded-md text-sm font-semibold transition ${search.flightType === value ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}
            key={value}
            onClick={() => {
              onChange("flightType", value as SearchState["flightType"]);
              if (value === "oneWay") onChange("tripMode", "flight");
            }}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-300" htmlFor="origin">
        Abflughafen
        <select className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" id="origin" value={search.originAirport} onChange={(event) => onChange("originAirport", event.target.value)}>
          {originAirports.map((airport) => (
            <option key={airport.code} value={airport.code}>
              {airport.name} ({airport.code})
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field icon={<CalendarDays size={16} />} label="Von" type="date" value={search.startDate} onChange={(value) => onChange("startDate", value)} />
        {search.flightType === "roundTrip" ? (
          <Field icon={<CalendarDays size={16} />} label="Bis" type="date" value={search.endDate} onChange={(value) => onChange("endDate", value)} />
        ) : (
          <div className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
            <span className="mb-2 flex items-center gap-2"><CalendarDays size={16} /> Rückflug</span>
            nicht benötigt
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field icon={<Wallet size={16} />} label="Budget" min={250} step={25} type="number" value={String(search.budget)} onChange={(value) => onChange("budget", Number(value))} />
        <Field icon={<Users size={16} />} label="Personen" min={1} max={6} type="number" value={String(search.people)} onChange={(value) => onChange("people", Number(value))} />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <SlidersHorizontal size={16} /> Filter
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Direktflug" checked={search.directOnly} onChange={(checked) => onChange("directOnly", checked)} />
          <Toggle label="Nur Wochenende" checked={search.weekendOnly} onChange={(checked) => onChange("weekendOnly", checked)} />
          <Select label="Reisedauer" value={search.durationFilter} onChange={(value) => onChange("durationFilter", value as SearchState["durationFilter"])} options={[["any", "egal"], ["short", "2-3 Nächte"], ["medium", "4-5 Nächte"], ["long", "7+ Nächte"]]} />
          <Select label="Gepäck" value={search.baggage} onChange={(value) => onChange("baggage", value as SearchState["baggage"])} options={[["personal", "Personal Item"], ["carryOn", "Handgepäck"], ["checked", "Aufgabegepäck"]]} />
          <Select label="Flexible Suche" value={search.flexibleSearch} onChange={(value) => onChange("flexibleSearch", value as SearchState["flexibleSearch"])} options={[["exact", "exaktes Datum"], ["july", "irgendwann im Juli"], ["longWeekend", "nächstes langes Wochenende"], ["under500", "unter 500 € p. P."]]} />
          <Select label="Datumstoleranz" value={String(search.dateFlexDays)} onChange={(value) => onChange("dateFlexDays", Number(value) as SearchState["dateFlexDays"])} options={[["0", "exakt"], ["1", "+/- 1 Tag"], ["2", "+/- 2 Tage"], ["3", "+/- 3 Tage"]]} />
          <Select label="Hinflug Uhrzeit" value={search.outboundTimeWindow} onChange={(value) => onChange("outboundTimeWindow", value as SearchState["outboundTimeWindow"])} options={[["any", "egal"], ["morning", "05-11 Uhr"], ["midday", "11-17 Uhr"], ["evening", "17-05 Uhr"]]} />
          {search.flightType === "roundTrip" && (
            <Select label="Rückflug Uhrzeit" value={search.returnTimeWindow} onChange={(value) => onChange("returnTimeWindow", value as SearchState["returnTimeWindow"])} options={[["any", "egal"], ["morning", "05-11 Uhr"], ["midday", "11-17 Uhr"], ["evening", "17-05 Uhr"]]} />
          )}
          <Field icon={<Hotel size={16} />} label="Hotelbewertung min." min={0} max={10} step={0.1} type="number" value={String(search.minHotelRating)} onChange={(value) => onChange("minHotelRating", Number(value))} />
        </div>
      </div>
    </form>
  );
}

function LiveStatusBadge({ status }: { status: "fallback" | "loading" | "live" | "error" }) {
  const label = status === "live" ? "Live-Daten aktiv" : status === "loading" ? "Live-Daten werden geprüft" : status === "error" ? "Live-API nicht erreichbar, Richtpreise aktiv" : "Richtpreise aktiv - Anbieterpreis prüfen";
  const Icon = status === "live" ? Wifi : WifiOff;
  return (
    <div className="mt-7 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
      <Icon size={16} className={status === "live" ? "text-emerald-200" : "text-amber-200"} />
      {label}
    </div>
  );
}

function DateRecommendations({ flightType, items, onApply }: { flightType: SearchState["flightType"]; items: DateRecommendation[]; onApply: (recommendation: DateRecommendation) => void }) {
  const best = items[0];
  const formatRecommendation = (item: DateRecommendation) =>
    flightType === "oneWay" ? formatShortDate(item.startDate) : `${formatShortDate(item.startDate)} - ${formatShortDate(item.endDate)}`;

  return (
    <section className="mt-5 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <CalendarCheck size={18} /> Günstigste Reisedaten
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{best ? `${formatRecommendation(best)} ab ${formatApproxPrice(best.totalPrice)}` : "Keine Empfehlung"}</h2>
        </div>
        {best && (
          <button className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-emerald-200" onClick={() => onApply(best)} type="button">
            Empfehlung übernehmen
          </button>
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {items.map((item) => (
          <button className="rounded-lg border border-white/10 bg-black/20 p-4 text-left transition hover:border-emerald-300 hover:bg-black/30" key={item.id} onClick={() => onApply(item)} type="button">
            <p className="text-sm font-semibold text-white">{formatRecommendation(item)}</p>
            <p className="mt-2 text-xl font-semibold text-emerald-200">{formatApproxPrice(item.totalPrice)}</p>
            <p className="mt-1 text-xs text-slate-400">{item.originName} ({item.originAirport}), ca. {item.savingPercent}% günstiger</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function DealCard({ deal, isSaved, removeMode = false, onOpen, onToggleSave }: { deal: Deal; isSaved: boolean; removeMode?: boolean; onOpen: (deal: Deal) => void; onToggleSave: (dealId: string) => void }) {
  const overBudget = deal.totalPrice > deal.budget;
  const saveLabel = removeMode && isSaved ? "Entfernen" : isSaved ? "Gespeichert" : "Speichern";
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#111827] shadow-xl transition hover:-translate-y-1 hover:border-cyan-300">
      <button className="w-full text-left" onClick={() => onOpen(deal)} type="button">
        <img className="h-48 w-full object-cover" src={deal.image} alt={deal.title} />
      </button>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <button className="text-left" onClick={() => onOpen(deal)} type="button">
            <p className="text-sm font-semibold text-cyan-200">{scoreLabel(deal.score)}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{deal.title}</h3>
          </button>
          <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 ${removeMode ? "px-3 text-sm font-semibold" : "w-10"} ${isSaved ? "bg-cyan-300 text-slate-950" : "bg-white/[0.04] text-slate-300"}`} onClick={() => onToggleSave(deal.id)} type="button" aria-label={saveLabel}>
            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            {removeMode && <span>{saveLabel}</span>}
          </button>
        </div>
        <span className={`mt-3 inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${overBudget ? "bg-amber-300 text-amber-950" : "bg-emerald-300 text-emerald-950"}`}>
          {overBudget ? "über Budget" : "im Budget"}
        </span>
        <button className="mt-5 w-full text-left" onClick={() => onOpen(deal)} type="button">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Info icon={<Plane size={16} />} label="Flug" value={formatDisplayPrice(deal.flightPrice, deal.isLive)} />
            <Info icon={<MapPin size={16} />} label="Abflug" value={deal.originAirport} />
            <Info icon={deal.tripMode === "flight" ? <ShieldCheck size={16} /> : <Hotel size={16} />} label={deal.tripMode === "flight" ? "Modus" : "Hotel"} value={deal.tripMode === "flight" ? "Nur Flug" : deal.hotelName ?? formatDisplayPrice(deal.hotelPrice, deal.isLive)} />
          </div>
          <PriceSparkline values={deal.priceHistory} />
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm text-slate-400">{formatDateRange(deal)}</p>
              <p className="mt-1 text-3xl font-semibold text-white">{formatDisplayPrice(deal.totalPrice, deal.isLive)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-200">{deal.priceDropPercent}% gefallen</p>
              <p className="mt-1 text-xs text-slate-400">Details öffnen</p>
            </div>
          </div>
        </button>
        {deal.tripMode === "package" && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <Hotel size={16} /> {deal.hotelName}
            </p>
            <p className="mt-1 text-sm text-slate-300">{deal.hotelDistrict} · {deal.hotelAddress}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {deal.hotelUrl && (
                <a className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10" href={deal.hotelUrl} rel="noreferrer" target="_blank">
                  Hotel direkt <ExternalLink size={13} />
                </a>
              )}
              {deal.hotelMapsUrl && (
                <a className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10" href={deal.hotelMapsUrl} rel="noreferrer" target="_blank">
                  Google Maps <ExternalLink size={13} />
                </a>
              )}
              {deal.packageUrl && (
                <a className="inline-flex items-center gap-1 rounded-md bg-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-950 hover:bg-emerald-200" href={deal.packageUrl} rel="noreferrer" target="_blank">
                  Komplettpaket prüfen <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function DealModal({
  deal,
  isSaved,
  onApply,
  onClose,
  onToggleSave,
}: {
  deal: Deal;
  isSaved: boolean;
  onApply: (changes: Partial<SearchState>) => void;
  onClose: () => void;
  onToggleSave: (dealId: string) => void;
}) {
  const [modalStartDate, setModalStartDate] = useState(deal.startDate);
  const [modalEndDate, setModalEndDate] = useState(deal.endDate);
  const [modalOrigin, setModalOrigin] = useState(deal.originAirport);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <article className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg border border-white/15 bg-[#111827] shadow-2xl">
        <img className="h-56 w-full object-cover" src={deal.image} alt={deal.title} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-200">{deal.originName} ({deal.originAirport}) nach {deal.destinationAirport}</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{deal.title}</h2>
            </div>
            <div className="flex gap-2">
              <button className={`rounded-md border border-white/10 p-2 ${isSaved ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"}`} onClick={() => onToggleSave(deal.id)} type="button" aria-label="Deal speichern">
                {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/10" onClick={onClose} type="button" aria-label="Schließen">
                x
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info icon={<CalendarDays size={16} />} label="Datum" value={formatDateRange(deal)} />
            <Info icon={<Plane size={16} />} label="Flug" value={formatDisplayPrice(deal.flightPrice, deal.isLive)} />
            <Info icon={<Wallet size={16} />} label="Preis" value={formatDealPriceLabel(deal)} />
          </div>
          <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
            <p className="mb-3 text-sm font-semibold text-cyan-100">Deal anpassen</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-slate-300">
                Hinflug
                <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" type="date" value={modalStartDate} onChange={(event) => setModalStartDate(event.target.value)} />
              </label>
              {deal.flightType === "roundTrip" ? (
                <label className="text-sm text-slate-300">
                  Rückflug
                  <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" type="date" value={modalEndDate} onChange={(event) => setModalEndDate(event.target.value)} />
                </label>
              ) : (
                <div className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                  Rückflug
                  <p className="mt-2 font-semibold text-white">nicht benötigt</p>
                </div>
              )}
              <label className="text-sm text-slate-300">
                Abflughafen
                <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" value={modalOrigin} onChange={(event) => setModalOrigin(event.target.value)}>
                  {originAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>{airport.name} ({airport.code})</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="mt-4 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200"
              onClick={() => onApply({ startDate: modalStartDate, endDate: modalEndDate, originAirport: modalOrigin })}
              type="button"
            >
              Auswahl übernehmen
            </button>
          </div>
          <PriceSparkline values={deal.priceHistory} large />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info icon={<LineChart size={16} />} label="Flugpreisquelle" value={deal.flightSource} />
            <Info icon={<RefreshCw size={16} />} label="Zuletzt geprüft" value={new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(deal.lastCheckedAt))} />
            <Info icon={<ShieldCheck size={16} />} label="Flugart" value={`${deal.flightType === "oneWay" ? "nur Hinflug" : "Hin & zurück"}, ${deal.directFlight ? "Direktflug" : "mit Umstieg"}`} />
            <Info icon={<Hotel size={16} />} label="Hotel" value={deal.tripMode === "flight" ? "nicht enthalten" : `${deal.hotelSource}, ${deal.hotelRefundable ? "stornierbar" : "nicht stornierbar"}`} />
          </div>
          {deal.tripMode === "package" && (
            <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                    <Hotel size={16} /> {deal.hotelName}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{deal.hotelDistrict}</p>
                  <p className="mt-1 text-sm text-slate-400">{deal.hotelAddress}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {formatDisplayPrice(deal.hotelPrice, deal.isLive)} Hotelanteil · Bewertung {deal.hotelRating.toFixed(1)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deal.hotelMapsUrl && (
                    <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={deal.hotelMapsUrl} rel="noreferrer" target="_blank">
                      Google Maps <ExternalLink size={16} />
                    </a>
                  )}
                  {deal.hotelUrl && (
                    <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={deal.hotelUrl} rel="noreferrer" target="_blank">
                      Hotel direkt <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-300">
            {deal.notes.map((note) => (
              <li className="rounded-md bg-white/[0.04] px-3 py-2" key={note}>{note}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200" href={deal.bookingUrl} rel="noreferrer" target="_blank">
              Flug suchen <ExternalLink size={16} />
            </a>
            {deal.hotelUrl && (
              <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={deal.hotelUrl} rel="noreferrer" target="_blank">
                Hotel suchen <ExternalLink size={16} />
              </a>
            )}
            {deal.packageUrl && (
                <a className="inline-flex items-center gap-2 rounded-lg bg-emerald-300 px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-emerald-200" href={deal.packageUrl} rel="noreferrer" target="_blank">
                  Booking-Angebot für {deal.hotelName} öffnen <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function FlightsPanel({
  flights,
  people,
  savedFlightIds,
  sort,
  compact = false,
  onSortChange,
  onToggleSave,
}: {
  flights: FlightOption[];
  people: number;
  savedFlightIds: string[];
  sort: FlightSort;
  compact?: boolean;
  onSortChange: (sort: FlightSort) => void;
  onToggleSave: (flightId: string) => void;
}) {
  if (flights.length === 0) {
    return <EmptyPanel title="Keine Flüge für diese Filter" text="Lockere Datumstoleranz, Uhrzeitfenster, Direktflug oder Gepäck, um wieder Flugoptionen zu sehen." />;
  }

  return (
    <div className="mt-7 space-y-4">
      {!compact && <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
            <Plane size={18} /> Flüge
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{flights.length} Optionen für deine Suche</h2>
          <p className="mt-2 text-sm text-slate-400">Richtpreise in der App. Der verbindliche Preis steht erst beim Anbieter.</p>
        </div>
        <label className="block min-w-64 text-sm font-medium text-slate-300" htmlFor="flight-sort">
          Sortierung
          <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" id="flight-sort" value={sort} onChange={(event) => onSortChange(event.target.value as FlightSort)}>
            <option value="priceAsc">Günstigstes Angebot zuerst</option>
            <option value="priceDesc">Teuerstes Angebot zuerst</option>
            <option value="departureAsc">Früheste Abflugzeit zuerst</option>
            <option value="directFirst">Direktflüge zuerst</option>
          </select>
        </label>
      </div>}

      <div className="grid gap-4">
        {flights.map((flight) => (
          <article className="rounded-lg border border-white/10 bg-[#111827] p-5 shadow-xl transition hover:border-cyan-300" key={flight.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-200">{flight.airline} · {flight.source}</p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {flight.originAirport} → {flight.destinationAirport}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {flight.flightType === "oneWay" ? "nur Hinflug" : "Hin & zurück"} · {flight.directFlight ? "Direktflug" : "mit Umstieg"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-semibold text-white">{formatApproxPrice(flight.pricePerPerson)} p. P.</p>
                <p className="mt-1 text-sm text-slate-400">{formatApproxPrice(flight.totalPrice)} gesamt</p>
                <button className={`mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold ${savedFlightIds.includes(flight.id) ? "bg-cyan-300 text-slate-950" : "bg-white/[0.04] text-slate-200 hover:bg-white/10"}`} onClick={() => onToggleSave(flight.id)} type="button">
                  {savedFlightIds.includes(flight.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {compact && savedFlightIds.includes(flight.id) ? "Entfernen" : savedFlightIds.includes(flight.id) ? "Gespeichert" : "Merken"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Info icon={<CalendarDays size={16} />} label="Hinflug" value={`${formatShortDate(flight.outboundDate)} · ${flight.outboundDeparture} - ${flight.outboundArrival}`} />
              <Info
                icon={<Timer size={16} />}
                label="Rückflug"
                value={flight.returnDate && flight.returnDeparture && flight.returnArrival ? `${formatShortDate(flight.returnDate)} · ${flight.returnDeparture} - ${flight.returnArrival}` : "nicht benötigt"}
              />
              <Info icon={<ShieldCheck size={16} />} label="Handgepäck" value={flight.includesCarryOn || flight.includesCheckedBag ? "inklusive" : "nicht inklusive"} />
              <Info icon={<Wallet size={16} />} label="Aufgabegepäck" value={flight.includesCheckedBag ? "inklusive" : "optional"} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-slate-400">Quelle: {flight.source}. Anbieter-Suche öffnet sich in einem neuen Tab; Preis dort prüfen.</p>
              <a className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200" href={flight.bookingUrl} rel="noreferrer" target="_blank">
                Flug suchen <ExternalLink size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function FlightHotelPanel({
  packages,
  people,
  savedPackageIds,
  sort,
  compact = false,
  onSortChange,
  onToggleSave,
}: {
  packages: PackageItem[];
  people: number;
  savedPackageIds: string[];
  sort: PackageSort;
  compact?: boolean;
  onSortChange: (sort: PackageSort) => void;
  onToggleSave: (packageId: string) => void;
}) {
  if (packages.length === 0) {
    return <EmptyPanel title="Keine Flug + Hotel-Angebote" text="Wähle Hin- und Rückflug, lockere Filter oder erhöhe das Budget, um Kombi-Angebote zu sehen." />;
  }

  return (
    <div className="mt-7 space-y-4">
      {!compact && <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
            <Hotel size={18} /> Flug + Hotel
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packages.length} Kombi-Angebote inklusive Hotel</h2>
          <p className="mt-2 text-sm text-slate-400">Vergleiche getrennte Flug-/Hotelsuche mit einem Komplettangebot aus einer Hand.</p>
        </div>
        <label className="block min-w-64 text-sm font-medium text-slate-300" htmlFor="package-sort">
          Sortierung
          <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" id="package-sort" value={sort} onChange={(event) => onSortChange(event.target.value as PackageSort)}>
            <option value="packagePriceAsc">Günstigstes Komplettangebot zuerst</option>
            <option value="packagePriceDesc">Teuerstes Komplettangebot zuerst</option>
            <option value="separateTotalAsc">Günstigste getrennte Suche zuerst</option>
            <option value="departureAsc">Früheste Abflugzeit zuerst</option>
            <option value="directFirst">Direktflüge zuerst</option>
          </select>
        </label>
      </div>}

      <div className="grid gap-5">
        {packages.map(({ deal, flight }) => {
          const packageId = packageItemId({ deal, flight });
          const totalPrice = flight.totalPrice + deal.hotelPrice;
          const pricePerPerson = Math.round(totalPrice / people);
          const packagePrice = packageOfferPrice(totalPrice);
          const packagePricePerPerson = Math.round(packagePrice / people);
          return (
            <article className="overflow-hidden rounded-lg border border-white/10 bg-[#111827] shadow-xl transition hover:border-cyan-300" key={`${deal.id}-${flight.id}`}>
              <div className="grid lg:grid-cols-[280px_1fr]">
                <img className="h-56 w-full object-cover lg:h-full" src={deal.image} alt={deal.title} />
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-cyan-200">{deal.flightSource} + {deal.hotelSource}</p>
                      <h3 className="mt-1 text-2xl font-semibold text-white">{deal.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">
                        {formatDateRange(deal)} · {deal.durationNights} Nächte · {deal.hotelRefundable ? "Hotel stornierbar" : "nicht stornierbar"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-semibold text-white">{formatApproxPrice(pricePerPerson)} p. P.</p>
                      <p className="mt-1 text-sm text-slate-400">{formatApproxPrice(totalPrice)} gesamt</p>
                      <button className={`mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold ${savedPackageIds.includes(packageId) ? "bg-cyan-300 text-slate-950" : "bg-white/[0.04] text-slate-200 hover:bg-white/10"}`} onClick={() => onToggleSave(packageId)} type="button">
                        {savedPackageIds.includes(packageId) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        {compact && savedPackageIds.includes(packageId) ? "Entfernen" : savedPackageIds.includes(packageId) ? "Gespeichert" : "Merken"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Info icon={<Plane size={16} />} label="Hinflug" value={`${flight.originAirport} → ${flight.destinationAirport}, ${formatShortDate(flight.outboundDate)} · ${flight.outboundDeparture} - ${flight.outboundArrival}`} />
                    <Info icon={<Timer size={16} />} label="Rückflug" value={flight.returnDate && flight.returnDeparture && flight.returnArrival ? `${formatShortDate(flight.returnDate)} · ${flight.returnDeparture} - ${flight.returnArrival}` : "nicht benötigt"} />
                    <Info icon={<ShieldCheck size={16} />} label="Flug/Gepäck" value={`${flight.directFlight ? "Direktflug" : "mit Umstieg"}, ${flight.includesCheckedBag ? "Aufgabegepäck" : flight.includesCarryOn ? "Handgepäck" : "Personal Item"}`} />
                    <Info icon={<Wallet size={16} />} label="Preisdetails" value={`${formatApproxPrice(flight.totalPrice)} Flug, ${formatApproxPrice(deal.hotelPrice)} Hotel`} />
                  </div>

                  <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                          <Hotel size={16} /> {deal.hotelName}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">{deal.hotelDistrict}</p>
                        <p className="mt-1 text-sm text-slate-400">{deal.hotelAddress}</p>
                        <p className="mt-2 text-sm text-slate-400">Bewertung {deal.hotelRating.toFixed(1)} · {deal.hotelSource}</p>
                      </div>
                      {deal.hotelMapsUrl && (
                        <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={deal.hotelMapsUrl} rel="noreferrer" target="_blank">
                          In Google Maps öffnen <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-semibold text-cyan-200">Getrennt suchen</p>
                      <p className="mt-1 text-xs text-slate-400">Flug und Hotel separat vergleichen.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200" href={flight.bookingUrl} rel="noreferrer" target="_blank">
                          Flug suchen <ExternalLink size={16} />
                        </a>
                        {deal.hotelUrl && (
                          <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={deal.hotelUrl} rel="noreferrer" target="_blank">
                            Hotel suchen <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3">
                      <p className="text-sm font-semibold text-emerald-200">Komplettangebot</p>
                      <p className="mt-1 text-xs text-slate-300">Flug + Hotel zusammen bei einem Anbieter prüfen.</p>
                      <p className="mt-3 text-4xl font-semibold leading-tight text-white">{formatApproxPrice(packagePricePerPerson)} p. P.</p>
                      <p className="mt-1 text-sm text-slate-300">{formatApproxPrice(packagePrice)} gesamt · Beim Anbieter prüfen</p>
                      {deal.packageUrl && (
                        <a className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-200" href={deal.packageUrl} rel="noreferrer" target="_blank">
                          Booking-Angebot für {deal.hotelName} öffnen <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function sortFlights(flights: FlightOption[], sort: FlightSort) {
  return [...flights].sort((a, b) => {
    if (sort === "priceDesc") return b.pricePerPerson - a.pricePerPerson;
    if (sort === "departureAsc") return toMinutes(a.outboundDeparture) - toMinutes(b.outboundDeparture);
    if (sort === "directFirst") return Number(b.directFlight) - Number(a.directFlight) || a.pricePerPerson - b.pricePerPerson;
    return a.pricePerPerson - b.pricePerPerson;
  });
}

function sortPackageItems(packages: PackageItem[], sort: PackageSort) {
  return [...packages].sort((a, b) => {
    const aSeparateTotal = a.flight.totalPrice + a.deal.hotelPrice;
    const bSeparateTotal = b.flight.totalPrice + b.deal.hotelPrice;
    const aPackagePrice = packageOfferPrice(aSeparateTotal);
    const bPackagePrice = packageOfferPrice(bSeparateTotal);

    if (sort === "packagePriceDesc") return bPackagePrice - aPackagePrice;
    if (sort === "separateTotalAsc") return aSeparateTotal - bSeparateTotal;
    if (sort === "departureAsc") return toMinutes(a.flight.outboundDeparture) - toMinutes(b.flight.outboundDeparture);
    if (sort === "directFirst") return Number(b.flight.directFlight) - Number(a.flight.directFlight) || aPackagePrice - bPackagePrice;
    return aPackagePrice - bPackagePrice;
  });
}

function buildPackageItems(deals: Deal[], flights: FlightOption[]): PackageItem[] {
  if (flights.length === 0) return [];
  return deals
    .filter((deal) => deal.tripMode === "package")
    .map((deal, index) => ({ deal, flight: flights[index % flights.length] }));
}

function packageItemId(item: PackageItem) {
  return `${item.deal.id}-${item.flight.id}`;
}

function packageOfferPrice(totalPrice: number) {
  return Math.max(totalPrice - Math.round(totalPrice * 0.07), totalPrice - 95);
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function AgentsPanel({ lastRun }: { lastRun: string }) {
  return (
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
            <h3 className="mt-1 text-xl font-semibold text-white">Täglich um 07:00 Uhr vergleichen</h3>
          </div>
          <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-slate-950">Letzter Lauf: {lastRun}</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-200">
          Browser-Push wird angefragt und ausgelöst, wenn ein Preis um mehr als 10 Prozent fällt oder ein neuer Deal auftaucht. Für Server-Push kann `VITE_DEAL_API_URL` später mit einem Backend verbunden werden.
        </p>
      </article>
    </div>
  );
}

function PriceSparkline({ values, large = false }: { values: number[]; large?: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 42 - ((value - min) / Math.max(1, max - min)) * 34;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className={`mt-4 rounded-md border border-white/10 bg-black/20 p-3 ${large ? "p-4" : ""}`}>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>7-Tage-Preisverlauf</span>
        <span>{currency.format(values[values.length - 1])}</span>
      </div>
      <svg className={large ? "h-24 w-full" : "h-14 w-full"} viewBox="0 0 100 46" role="img" aria-label="Preisverlauf">
        <polyline fill="none" points={points} stroke="#67e8f9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    </div>
  );
}

function WishlistSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </div>
  );
}

function Field({ icon, label, value, type, min, max, step, onChange }: { icon: ReactNode; label: string; value: string; type: string; min?: number; max?: number; step?: number; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      <span className="mb-2 flex items-center gap-2">{icon}{label}</span>
      <input className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" max={max} min={min} step={step} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <select className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-white" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-11 items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 text-sm text-slate-200">
      {label}
      <input checked={checked} className="h-4 w-4 accent-cyan-300" type="checkbox" onChange={(event) => onChange(event.target.checked)} />
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

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-3">
      <p className="flex items-center gap-2 text-slate-400">{icon}{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(new Date(date));
}

function useStoredList(key: string): [string[], Dispatch<SetStateAction<string[]>>] {
  const [items, setItems] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, key]);

  return [items, setItems];
}

function toggleListValue(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
}

function sendBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body });
}
