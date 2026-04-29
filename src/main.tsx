import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Papa from "papaparse";
import { ArrowLeft, ChevronDown, RefreshCw, Search } from "lucide-react";
import "./styles.css";

type Athlete = {
  id: string;
  bib: string;
  name: string;
  country: string;
  countryCode: string;
  year: string;
  birthDate: string;
  gender: string;
  distance: string;
  distanceColorClass: string;
  pb: string;
  pbSeconds: number;
  event: string;
  highlight: string;
  instagram: string;
  bio: string;
  profileUrl: string;
  image: string;
};

type Option = { value: string; label: string };
type SortKey = "pb" | "name" | "bib" | "country";

const GITHUB_CSV_URL = "https://raw.githubusercontent.com/davis-rukitis-nc/elite-2026/refs/heads/main/public/elite.csv";

const IOC_TO_ISO2: Record<string, string> = {
  AFG:"AF",ALB:"AL",ALG:"DZ",AND:"AD",ANG:"AO",ANT:"AG",ARG:"AR",ARM:"AM",ARU:"AW",ASA:"AS",AUS:"AU",AUT:"AT",AZE:"AZ",
  BAH:"BS",BAN:"BD",BAR:"BB",BDI:"BI",BEL:"BE",BEN:"BJ",BER:"BM",BHU:"BT",BIH:"BA",BIZ:"BZ",BLR:"BY",BOL:"BO",BOT:"BW",BRA:"BR",BRN:"BH",BRU:"BN",BUL:"BG",BUR:"BF",
  CAF:"CF",CAM:"KH",CAN:"CA",CAY:"KY",CGO:"CG",CHA:"TD",CHI:"CL",CHN:"CN",CIV:"CI",CMR:"CM",COD:"CD",COK:"CK",COL:"CO",COM:"KM",CPV:"CV",CRC:"CR",CRO:"HR",CUB:"CU",CYP:"CY",CZE:"CZ",
  DEN:"DK",DJI:"DJ",DMA:"DM",DOM:"DO",ECU:"EC",EGY:"EG",ERI:"ER",ESA:"SV",ESP:"ES",EST:"EE",ETH:"ET",FIJ:"FJ",FIN:"FI",FRA:"FR",FSM:"FM",
  GAB:"GA",GAM:"GM",GBR:"GB",GBS:"GW",GEO:"GE",GEQ:"GQ",GER:"DE",GHA:"GH",GRE:"GR",GRN:"GD",GUA:"GT",GUI:"GN",GUM:"GU",GUY:"GY",
  HAI:"HT",HKG:"HK",HON:"HN",HUN:"HU",INA:"ID",IND:"IN",IRI:"IR",IRL:"IE",IRQ:"IQ",ISL:"IS",ISR:"IL",ISV:"VI",ITA:"IT",
  JAM:"JM",JOR:"JO",JPN:"JP",KAZ:"KZ",KEN:"KE",KGZ:"KG",KIR:"KI",KOR:"KR",KOS:"XK",KSA:"SA",KUW:"KW",
  LAO:"LA",LAT:"LV",LBA:"LY",LBN:"LB",LBR:"LR",LCA:"LC",LES:"LS",LIE:"LI",LTU:"LT",LUX:"LU",
  MAD:"MG",MAR:"MA",MAS:"MY",MAW:"MW",MDA:"MD",MDV:"MV",MEX:"MX",MGL:"MN",MHL:"MH",MKD:"MK",MLI:"ML",MLT:"MT",MNE:"ME",MON:"MC",MOZ:"MZ",MRI:"MU",MTN:"MR",MYA:"MM",
  NAM:"NA",NCA:"NI",NED:"NL",NEP:"NP",NGR:"NG",NIG:"NE",NOR:"NO",NRU:"NR",NZL:"NZ",OMA:"OM",PAK:"PK",PAN:"PA",PAR:"PY",PER:"PE",PHI:"PH",PLE:"PS",PLW:"PW",PNG:"PG",POL:"PL",POR:"PT",PRK:"KP",PUR:"PR",QAT:"QA",
  ROU:"RO",RSA:"ZA",RUS:"RU",RWA:"RW",SAM:"WS",SEN:"SN",SEY:"SC",SGP:"SG",SKN:"KN",SLE:"SL",SLO:"SI",SMR:"SM",SOL:"SB",SOM:"SO",SRB:"RS",SRI:"LK",SSD:"SS",STP:"ST",SUD:"SD",SUI:"CH",SUR:"SR",SVK:"SK",SWE:"SE",SWZ:"SZ",SYR:"SY",
  TAN:"TZ",TZA:"TZ",THA:"TH",TJK:"TJ",TKM:"TM",TLS:"TL",TOG:"TG",TPE:"TW",TTO:"TT",TUN:"TN",TUR:"TR",TUV:"TV",
  UAE:"AE",UGA:"UG",UKR:"UA",URU:"UY",USA:"US",UZB:"UZ",VAN:"VU",VEN:"VE",VIE:"VN",VIN:"VC",YEM:"YE",ZAM:"ZM",ZIM:"ZW"
};

const COUNTRY_TO_ISO2: Record<string, string> = {
  "south africa":"ZA", "tanzania":"TZ", "ethiopia":"ET", "kenya":"KE", "uganda":"UG", "germany":"DE", "latvia":"LV", "eritrea":"ER", "united states":"US", "usa":"US", "united kingdom":"GB", "great britain":"GB"
};

function flagEmoji(countryCode: string, country = "") {
  const raw = (countryCode || "").trim().toUpperCase();
  let iso = "";
  if (/^[A-Z]{2}$/.test(raw)) iso = raw;
  else if (IOC_TO_ISO2[raw]) iso = IOC_TO_ISO2[raw];
  else iso = COUNTRY_TO_ISO2[country.trim().toLowerCase()] || "";
  if (!/^[A-Z]{2}$/.test(iso)) return "";
  return iso.split("").map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
}

function normalizeHeader(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) if (row[key] !== undefined && row[key].trim()) return row[key].trim();
  return "";
}
function parseTimeToSeconds(value: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parts = value.split(":").map((part) => Number(part.trim()));
  if (parts.some(Number.isNaN)) return Number.POSITIVE_INFINITY;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number.POSITIVE_INFINITY;
}
function distanceColorClass(distance: string) {
  const value = (distance || "").toLowerCase().replace(/\s+/g, "");
  if (value.includes("21") || value.includes("half")) return "distance-green";
  if (value.includes("10")) return "distance-blue";
  if (value.includes("6")) return "distance-orange";
  if (value.includes("42") || value.includes("marathon") || value.includes("mile")) return "distance-red";
  return "distance-purple";
}
function normalizeDistance(distance: string) {
  const value = distance.trim().toUpperCase().replace(/\s+/g, "");
  if (value === "42KM" || value === "42K" || value === "MARATHON") return "42KM";
  if (value === "21KM" || value === "21K" || value === "HALFMARATHON") return "21KM";
  if (value === "10KM" || value === "10K") return "10KM";
  if (value === "6KM" || value === "6K") return "6KM";
  if (value === "MILE") return "MILE";
  return distance || "—";
}
function normalizeGender(gender: string) {
  const value = gender.trim().toUpperCase();
  if (["M", "MALE", "MEN"].includes(value)) return "M";
  if (["W", "F", "FEMALE", "WOMEN"].includes(value)) return "W";
  return gender || "—";
}
function normalizeRow(input: Record<string, unknown>, index: number): Athlete {
  const row = Object.fromEntries(Object.entries(input).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]));
  const name = pick(row, ["athlete", "name", "runner", "athlete_name", "full_name"]);
  const bib = pick(row, ["bib_nr", "bib", "bib_number", "start_number", "number"]) || String(index + 1);
  const country = pick(row, ["country", "nationality", "nation"]);
  const countryCode = pick(row, ["country_code", "countrycode", "noc", "country_short", "iso", "code"]);
  const pb = pick(row, ["personal_best_time", "personal_best", "pb", "best_time", "time"]);
  const distance = normalizeDistance(pick(row, ["distance", "event_distance", "race"]));
  return {
    id: `${bib}-${name || index}`,
    bib, name, country, countryCode,
    year: pick(row, ["year", "birth_year", "born"]),
    birthDate: pick(row, ["date_of_birth", "birth_date", "dob"]),
    gender: normalizeGender(pick(row, ["gender", "sex"])),
    distance, distanceColorClass: distanceColorClass(distance),
    pb, pbSeconds: parseTimeToSeconds(pb),
    event: pick(row, ["personal_best_city_year", "pb_city_year", "personal_best_event", "event", "city_year"]),
    highlight: pick(row, ["highlight", "note"]),
    instagram: pick(row, ["instagram", "ig"]),
    bio: pick(row, ["bio", "biography"]),
    profileUrl: pick(row, ["profile_url", "world_athletics", "world_athletics_profile", "profile"]),
    image: pick(row, ["image", "image_url", "photo", "photo_url"])
  };
}

function useOutsideClick<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function handle(event: MouseEvent) { if (ref.current && !ref.current.contains(event.target as Node)) onClose(); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  return ref;
}
function LogoMark() {
  return <img className="rrm-logo-img" src="/logo.svg" alt="Rimi Riga Marathon" loading="eager" decoding="async" onError={(event) => { event.currentTarget.src = "https://rimirigamarathon.com/wp-content/uploads/2024/01/rrm-logo-white.svg"; }} />;
}
function CustomSelect({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const selected = options.find((option) => option.value === value) || options[0];
  return <div className="select-wrap" ref={ref}>
    <button type="button" className="select-button" aria-expanded={open} onClick={() => setOpen((state) => !state)}>
      <span><span className="select-label">{label}</span><span>{selected?.label}</span></span><ChevronDown className="select-arrow" size={16} />
    </button>
    {open && <div className="select-menu">{options.map((option) => <button type="button" key={option.value} className={`select-item ${option.value === value ? "active" : ""}`} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>)}</div>}
  </div>;
}
function AthleteInitials({ athlete }: { athlete: Athlete }) {
  const initials = athlete.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  if (athlete.image) return <img className="avatar image" src={athlete.image} alt="" loading="lazy" />;
  return <span className="avatar">{initials || "RR"}</span>;
}
function ProfileModal({ athlete, onClose }: { athlete: Athlete; onClose: () => void }) {
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", onKeyDown); return () => document.removeEventListener("keydown", onKeyDown); }, [onClose]);
  const flag = flagEmoji(athlete.countryCode, athlete.country);
  return <div className="modal-layer" onMouseDown={onClose}><div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose} aria-label="Close profile">×</button>
    <div className="profile-head"><AthleteInitials athlete={athlete} /><div><p className="profile-kicker">BIB {athlete.bib} · {athlete.distance}</p><h2>{athlete.name}</h2><p className="profile-country">{flag ? `${flag} ` : ""}{athlete.country} · {athlete.gender}</p></div></div>
    <div className="profile-grid"><div><span>Personal best</span><strong>{athlete.pb || "—"}</strong></div><div><span>PB event</span><strong>{athlete.event || "—"}</strong></div><div><span>Year</span><strong>{athlete.year || "—"}</strong></div><div><span>Date of birth</span><strong>{athlete.birthDate || "—"}</strong></div></div>
    {(athlete.highlight || athlete.bio) && <div className="profile-copy">{athlete.highlight && <p className="highlight">{athlete.highlight}</p>}{athlete.bio && <p>{athlete.bio}</p>}</div>}
    {(athlete.profileUrl || athlete.instagram) && <div className="profile-links">{athlete.profileUrl && <a href={athlete.profileUrl} target="_blank" rel="noreferrer">World Athletics profile</a>}{athlete.instagram && <a href={athlete.instagram} target="_blank" rel="noreferrer">Instagram</a>}</div>}
  </div></div>;
}

function App() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [distance, setDistance] = useState("all");
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("all");
  const [sort, setSort] = useState<SortKey>("pb");
  const [selected, setSelected] = useState<Athlete | null>(null);

  const loadData = async (fresh = false) => {
    setLoading(true); setError("");
    const cache = fresh ? `?v=${Date.now()}` : "";
    const sources = [`${GITHUB_CSV_URL}${cache}`, `/elite.csv${cache}`];
    for (const source of sources) {
      try {
        const response = await fetch(source, { cache: fresh ? "no-store" : "default" });
        if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
        const text = await response.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, delimiter: text.includes(";") ? ";" : "," });
        setAthletes(parsed.data.map(normalizeRow).filter((athlete) => athlete.name));
        setLoading(false); return;
      } catch (err) { setError(err instanceof Error ? err.message : "Could not load CSV."); }
    }
    setLoading(false);
  };
  useEffect(() => { void loadData(); }, []);
  useEffect(() => {
    const sendHeight = () => { const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight); try { window.parent.postMessage({ type: "rrm-widget-height", id: "elite-2026", height }, "*"); } catch {} };
    const observer = new ResizeObserver(sendHeight); observer.observe(document.body); window.addEventListener("resize", sendHeight); const timer = window.setTimeout(sendHeight, 100);
    return () => { observer.disconnect(); window.removeEventListener("resize", sendHeight); window.clearTimeout(timer); };
  }, [athletes.length, selected, loading]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return athletes.filter((athlete) => {
      const matchesQuery = !q || [athlete.name, athlete.country, athlete.countryCode, athlete.pb, athlete.event, athlete.distance].join(" ").toLowerCase().includes(q);
      return matchesQuery && (distance === "all" || athlete.distance === distance) && (gender === "all" || athlete.gender === gender) && (country === "all" || athlete.country === country);
    }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "bib" ? Number(a.bib || 9999) - Number(b.bib || 9999) : sort === "country" ? a.country.localeCompare(b.country) : a.pbSeconds - b.pbSeconds);
  }, [athletes, query, distance, gender, country, sort]);

  const distances: Option[] = [{ value: "all", label: "All distances" }, ...Array.from(new Set(athletes.map((a) => a.distance))).filter(Boolean).map((item) => ({ value: item, label: item }))];
  const genders: Option[] = [{ value: "all", label: "All" }, ...Array.from(new Set(athletes.map((a) => a.gender))).filter(Boolean).map((item) => ({ value: item, label: item }))];
  const countries: Option[] = [{ value: "all", label: "All countries" }, ...Array.from(new Set(athletes.map((a) => a.country))).filter(Boolean).sort().map((item) => ({ value: item, label: item }))];

  return <>
    <header className="standalone-bar"><a className="standalone-link" href="https://rimirigamarathon.com" aria-label="Go to Rimi Riga Marathon website"><span className="back-arrow"><ArrowLeft size={16} strokeWidth={2.4} /></span><span className="logo-wrap"><LogoMark /></span></a></header>
    <main className="app">
      <section className="toolbar"><div className="search-wrap"><Search className="search-icon" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search athlete, country, PB…" /></div><div className="filters"><CustomSelect label="Distance" value={distance} options={distances} onChange={setDistance} /><CustomSelect label="Gender" value={gender} options={genders} onChange={setGender} /><CustomSelect label="Country" value={country} options={countries} onChange={setCountry} /><CustomSelect label="Sort" value={sort} options={[{ value: "pb", label: "Fastest PB" }, { value: "name", label: "Name" }, { value: "bib", label: "BIB" }, { value: "country", label: "Country" }]} onChange={(value) => setSort(value as SortKey)} /></div></section>
      <div className="list-head"><span>{loading ? "Loading athletes…" : `Showing ${filtered.length} of ${athletes.length} athletes`}</span><button type="button" onClick={() => void loadData(true)}><RefreshCw size={13} /> Refresh data</button></div>
      {error && <p className="error">{error}</p>}
      <div className="desktop-view"><div className="table-shell"><table className="elite-table"><thead><tr><th>BIB</th><th>Athlete</th><th>Personal best</th><th>Race</th></tr></thead><tbody>{filtered.map((athlete) => { const flag = flagEmoji(athlete.countryCode, athlete.country); return <tr key={athlete.id} onClick={() => setSelected(athlete)}><td className="bib-cell">{athlete.bib || "—"}</td><td><div className="athlete-cell"><div className="name-cell">{athlete.name}</div><div className="table-meta"><span className="table-chip">{flag ? `${flag} ` : ""}{athlete.country || "—"}</span><span className="table-chip">{athlete.gender}</span><span className="table-chip">{athlete.year || "—"}</span></div></div></td><td><div className="pb-cell"><strong className="pb-time">{athlete.pb || "—"}</strong><span className="pb-event">{athlete.event || "—"}</span></div></td><td><div className="race-cell"><span className={`distance-pill ${athlete.distanceColorClass}`}>{athlete.distance}</span><span className="profile-cue">Profile →</span></div></td></tr>; })}</tbody></table></div></div>
      <div className="mobile-view">{filtered.map((athlete) => { const flag = flagEmoji(athlete.countryCode, athlete.country); return <button type="button" key={athlete.id} className="mobile-card" onClick={() => setSelected(athlete)}><div className="mobile-card-top"><span className="mobile-bib">BIB {athlete.bib || "—"}</span><span className={`distance-pill ${athlete.distanceColorClass}`}>{athlete.distance}</span></div><div className="mobile-athlete-line"><AthleteInitials athlete={athlete} /><div><h3>{athlete.name}</h3><p>{flag ? `${flag} ` : ""}{athlete.country} · {athlete.gender} · {athlete.year || "—"}</p></div></div><div className="mobile-pb-box"><span>Personal Best</span><strong>{athlete.pb || "—"}</strong><small>{athlete.event || "—"}</small></div><div className="tap-hint">Tap to view profile →</div></button>; })}</div>
      {!loading && filtered.length === 0 && <p className="empty">No athletes match the selected filters.</p>}
    </main>
    {selected && <ProfileModal athlete={selected} onClose={() => setSelected(null)} />}
  </>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
