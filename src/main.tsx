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
  birthYear: string;
  birthDate: string;
  gender: string;
  distance: string;
  distanceColorClass: string;
  pb: string;
  pbSeconds: number;
  pbEvent: string;
  pbYear: string;
  category: string;
  highlight: string;
  instagram: string;
  bio: string;
  profileUrl: string;
  image: string;
  tags: string[];
};

type Option = { value: string; label: string };
type SortKey = "distance_pb" | "pb" | "name" | "country" | "category" | "bib";
type Lang = "en" | "lv";

const GITHUB_CSV_URL = "https://raw.githubusercontent.com/davis-rukitis-nc/elite-2026/refs/heads/main/public/elite.csv";
const RRM_LOGO_URL = "https://rimirigamarathon.com/wp-content/uploads/2024/01/rrm-logo-white.svg";

const TEXT: Record<Lang, Record<string, string>> = {
  en: {
    search: "Search athlete, country, PB…",
    distance: "Distance",
    gender: "Gender",
    country: "Country",
    category: "Field",
    sort: "Sort",
    allDistances: "All distances",
    allGenders: "All",
    allCountries: "All countries",
    allCategories: "All fields",
    distancePb: "Distance + PB",
    fastestPb: "Fastest PB",
    name: "Name",
    loading: "Loading athletes…",
    showing: "Showing",
    of: "of",
    athletes: "athletes",
    refresh: "Refresh data",
    athlete: "Athlete",
    pb: "Personal best",
    race: "Race",
    profile: "Profile",
    tap: "Tap to view profile →",
    viewProfile: "View profile →",
    pbEvent: "PB event",
    pbYear: "PB year",
    dateOfBirth: "Date of birth",
    birthYear: "Birth year",
    field: "Field",
    tags: "Tags",
    worldAthletics: "World Athletics profile",
    instagram: "Instagram",
    closeProfile: "Close profile",
    noMatches: "No athletes match the selected filters.",
    men: "Men",
    women: "Women",
    born: "Born",
    bib: "BIB"
  },
  lv: {
    search: "Meklē sportistu, valsti, rekordu…",
    distance: "Distance",
    gender: "Dzimums",
    country: "Valsts",
    category: "Sastāvs",
    sort: "Kārtot",
    allDistances: "Visas distances",
    allGenders: "Visi",
    allCountries: "Visas valstis",
    allCategories: "Visi sastāvi",
    distancePb: "Distance + rekords",
    fastestPb: "Ātrākais rekords",
    name: "Vārds",
    loading: "Ielādē sportistus…",
    showing: "Rāda",
    of: "no",
    athletes: "sportistiem",
    refresh: "Atjaunot datus",
    athlete: "Sportists",
    pb: "Personiskais rekords",
    race: "Starts",
    profile: "Profils",
    tap: "Spied, lai skatītu profilu →",
    viewProfile: "Skatīt profilu →",
    pbEvent: "Rekorda sacensības",
    pbYear: "Rekorda gads",
    dateOfBirth: "Dzimšanas datums",
    birthYear: "Dzimšanas gads",
    field: "Sastāvs",
    tags: "Tegi",
    worldAthletics: "World Athletics profils",
    instagram: "Instagram",
    closeProfile: "Aizvērt profilu",
    noMatches: "Neviens sportists neatbilst izvēlētajiem filtriem.",
    men: "Vīrieši",
    women: "Sievietes",
    born: "Dz. gads",
    bib: "BIB"
  }
};

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
  "belgium":"BE","beļģija":"BE","ethiopia":"ET","etiopija":"ET","germany":"DE","vācija":"DE","israel":"IL","izraēla":"IL","japan":"JP","japāna":"JP","kenya":"KE","kenija":"KE","latvia":"LV","latvija":"LV","mexico":"MX","meksika":"MX","slovenia":"SI","slovēnija":"SI","south africa":"ZA","dienvidāfrikas republika":"ZA","tanzania":"TZ","tanzānija":"TZ","uganda":"UG","ugandā":"UG"
};

function useLang(): Lang {
  return window.location.pathname.toLowerCase().startsWith("/lv") ? "lv" : "en";
}

function tFactory(lang: Lang) {
  return (key: string) => TEXT[lang][key] || TEXT.en[key] || key;
}

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
  for (const key of keys) {
    if (row[key] !== undefined && row[key].trim()) return row[key].trim();
  }
  return "";
}

function parseTimeToSeconds(value: string) {
  if (!value || /debut|debija/i.test(value)) return Number.POSITIVE_INFINITY;
  const clean = value.replace(/^[*\s]+/, "").trim();
  const parts = clean.split(":").map((part) => Number(part.trim().replace(",", ".")));
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
  if (value.includes("42") || value === "marathon" || value.includes("mile")) return "distance-red";
  return "distance-purple";
}

function distanceOrder(distance: string) {
  const value = normalizeDistance(distance);
  const order: Record<string, number> = { "21KM": 1, "42KM": 2, "10KM": 3, "6KM": 4, "MILE": 5 };
  return order[value] || 99;
}

function normalizeDistance(distance: string) {
  const value = distance.trim().toUpperCase().replace(/\s+/g, "");
  if (["42KM", "42K", "MARATHON"].includes(value)) return "42KM";
  if (["21KM", "21K", "HALFMARATHON", "PUSMARATONS"].includes(value)) return "21KM";
  if (["10KM", "10K"].includes(value)) return "10KM";
  if (["6KM", "6K", "5.7KM"].includes(value)) return "6KM";
  if (["MILE", "1609M", "DPDMILE", "DPDJUDZE", "DPDJŪDZE"].includes(value)) return "MILE";
  return distance || "—";
}

function normalizeGender(gender: string) {
  const value = gender.trim().toUpperCase();
  if (["M", "MALE", "MEN", "VĪRIEŠI", "VIRIESI"].includes(value)) return "M";
  if (["W", "F", "FEMALE", "WOMEN", "SIEVIETES"].includes(value)) return "W";
  return gender || "—";
}

function genderLabel(gender: string, t: (key: string) => string) {
  if (gender === "M") return t("men");
  if (gender === "W") return t("women");
  return gender || "—";
}

function splitTags(value: string) {
  return value.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean);
}

function displayEvent(athlete: Athlete) {
  if (athlete.pbEvent && athlete.pbYear && !athlete.pbEvent.includes(athlete.pbYear)) return `${athlete.pbEvent} ${athlete.pbYear}`;
  if (athlete.pbEvent) return athlete.pbEvent;
  if (athlete.pbYear) return `PB year ${athlete.pbYear}`;
  return "—";
}

function normalizeRow(input: Record<string, unknown>, index: number): Athlete {
  const row = Object.fromEntries(Object.entries(input).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]));
  const name = pick(row, ["athlete", "name", "runner", "athlete_name", "full_name"]);
  const bib = pick(row, ["bib_nr", "bib", "bib_number", "start_number", "number"]);
  const country = pick(row, ["country", "nationality", "nation"]);
  const countryCode = pick(row, ["country_code", "countrycode", "noc", "country_short", "iso", "code"]);
  const pb = pick(row, ["personal_best_time", "personal_best", "pb", "best_time", "time"]);
  const distance = normalizeDistance(pick(row, ["distance", "event_distance", "race"]));
  const profileUrl = pick(row, ["profile_url", "world_athletics", "world_athletics_profile", "profile"]);
  const sourceUrl = pick(row, ["source_url", "source"]);
  const worldAthleticsProfile = profileUrl || (sourceUrl.includes("worldathletics.org/athletes/") ? sourceUrl : "");
  const birthYear = pick(row, ["birth_year", "born"]);
  const legacyYear = pick(row, ["year"]);
  const pbYear = pick(row, ["pb_year", "personal_best_year", "personal_best_record_year", "record_year"]);

  return {
    id: `${name || "athlete"}-${index}`,
    bib,
    name,
    country,
    countryCode,
    birthYear: birthYear || (pick(row, ["date_of_birth", "birth_date", "dob"]) ? legacyYear : ""),
    birthDate: pick(row, ["date_of_birth", "birth_date", "dob"]),
    gender: normalizeGender(pick(row, ["gender", "sex"])),
    distance,
    distanceColorClass: distanceColorClass(distance),
    pb,
    pbSeconds: parseTimeToSeconds(pb),
    pbEvent: pick(row, ["personal_best_event", "personal_best_city_year", "pb_city_year", "event", "city_year"]),
    pbYear: pbYear || (!birthYear && !pick(row, ["date_of_birth", "birth_date", "dob"]) ? legacyYear : ""),
    category: pick(row, ["category", "field", "group", "level"]),
    highlight: pick(row, ["highlight", "note"]),
    instagram: pick(row, ["instagram", "ig"]),
    bio: pick(row, ["bio", "biography"]),
    profileUrl: worldAthleticsProfile,
    image: pick(row, ["image", "image_url", "photo", "photo_url"]),
    tags: splitTags(pick(row, ["tags", "tag"]))
  };
}

function useOutsideClick<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  return ref;
}

function LogoMark() {
  return <img className="rrm-logo-img" src={RRM_LOGO_URL} alt="Rimi Riga Marathon" loading="eager" decoding="async" />;
}

function CustomSelect({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div className="select-wrap" ref={ref}>
      <button type="button" className="select-button" aria-expanded={open} onClick={() => setOpen((state) => !state)}>
        <span className="select-copy">
          <span className="select-label">{label}</span>
          <span className="select-value">{selected?.label}</span>
        </span>
        <ChevronDown className="select-arrow" size={16} />
      </button>
      {open && (
        <div className="select-menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`select-item ${option.value === value ? "active" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AthleteInitials({ athlete }: { athlete: Athlete }) {
  const initials = athlete.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  if (athlete.image) return <img className="avatar image" src={athlete.image} alt="" loading="lazy" />;
  return <span className="avatar">{initials || "RR"}</span>;
}

function CountryLine({ athlete }: { athlete: Athlete }) {
  const flag = flagEmoji(athlete.countryCode, athlete.country);
  return <>{flag ? `${flag} ` : ""}{athlete.country || "—"}</>;
}

function ProfileModal({ athlete, onClose, hasBibNumbers, t }: { athlete: Athlete; onClose: () => void; hasBibNumbers: boolean; t: (key: string) => string }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label={t("closeProfile")}>×</button>
        <div className="profile-head">
          <AthleteInitials athlete={athlete} />
          <div>
            <p className="profile-kicker">{hasBibNumbers && athlete.bib ? `${t("bib")} ${athlete.bib} · ` : ""}{athlete.distance}</p>
            <h2>{athlete.name}</h2>
            <p className="profile-country"><CountryLine athlete={athlete} /> · {genderLabel(athlete.gender, t)}{athlete.category ? ` · ${athlete.category}` : ""}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div><span>{t("pb")}</span><strong>{athlete.pb || "—"}</strong></div>
          <div><span>{t("pbEvent")}</span><strong>{displayEvent(athlete)}</strong></div>
          <div><span>{t("field")}</span><strong>{athlete.category || "—"}</strong></div>
          <div><span>{athlete.birthDate ? t("dateOfBirth") : t("birthYear")}</span><strong>{athlete.birthDate || athlete.birthYear || "—"}</strong></div>
        </div>

        {(athlete.highlight || athlete.bio) && (
          <div className="profile-copy">
            {athlete.highlight && <p className="highlight">{athlete.highlight}</p>}
            {athlete.bio && <p>{athlete.bio}</p>}
          </div>
        )}

        {athlete.tags.length > 0 && (
          <div className="tags" aria-label={t("tags")}>
            {athlete.tags.map((tag) => <span className="tag-pill" key={tag}>{tag}</span>)}
          </div>
        )}

        {(athlete.profileUrl || athlete.instagram) && (
          <div className="profile-links">
            {athlete.profileUrl && <a href={athlete.profileUrl} target="_blank" rel="noreferrer">{t("worldAthletics")}</a>}
            {athlete.instagram && <a href={athlete.instagram} target="_blank" rel="noreferrer">{t("instagram")}</a>}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const lang = useLang();
  const t = tFactory(lang);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [distance, setDistance] = useState("all");
  const [gender, setGender] = useState("all");
  const [country, setCountry] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("distance_pb");
  const [selected, setSelected] = useState<Athlete | null>(null);

  const hasBibNumbers = athletes.some((athlete) => athlete.bib.trim() !== "");

  const loadData = async (fresh = false) => {
    setLoading(true);
    setError("");
    const cache = fresh ? `?v=${Date.now()}` : "";
    const sources = [`${GITHUB_CSV_URL}${cache}`, `/elite.csv${cache}`];

    for (const source of sources) {
      try {
        const response = await fetch(source, { cache: fresh ? "no-store" : "default" });
        if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
        const text = await response.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: text.slice(0, 500).includes(";") ? ";" : ","
        });

        setAthletes(parsed.data.map(normalizeRow).filter((athlete) => athlete.name));
        setLoading(false);
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load CSV.");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      try {
        window.parent.postMessage({ type: "rrm-widget-height", id: "elite-2026", height }, "*");
      } catch {}
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    window.addEventListener("resize", sendHeight);
    const timer = window.setTimeout(sendHeight, 100);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sendHeight);
      window.clearTimeout(timer);
    };
  }, [athletes.length, selected, loading, query, distance, gender, country, category, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return athletes
      .filter((athlete) => {
        const searchable = [athlete.name, athlete.country, athlete.countryCode, athlete.pb, displayEvent(athlete), athlete.distance, athlete.gender, athlete.birthYear, athlete.category, ...athlete.tags].join(" ").toLowerCase();
        return (!q || searchable.includes(q)) &&
          (distance === "all" || athlete.distance === distance) &&
          (gender === "all" || athlete.gender === gender) &&
          (country === "all" || athlete.country === country) &&
          (category === "all" || athlete.category === category);
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "country") return a.country.localeCompare(b.country) || distanceOrder(a.distance) - distanceOrder(b.distance) || a.pbSeconds - b.pbSeconds;
        if (sort === "category") return a.category.localeCompare(b.category) || distanceOrder(a.distance) - distanceOrder(b.distance) || a.pbSeconds - b.pbSeconds;
        if (sort === "bib") return Number(a.bib || 999999) - Number(b.bib || 999999);
        if (sort === "pb") return a.pbSeconds - b.pbSeconds || a.name.localeCompare(b.name);
        return distanceOrder(a.distance) - distanceOrder(b.distance) || a.pbSeconds - b.pbSeconds || a.name.localeCompare(b.name);
      });
  }, [athletes, query, distance, gender, country, category, sort]);

  const distances: Option[] = [{ value: "all", label: t("allDistances") }, ...Array.from(new Set(athletes.map((a) => a.distance))).filter(Boolean).sort((a,b) => distanceOrder(a) - distanceOrder(b)).map((item) => ({ value: item, label: item }))];
  const genders: Option[] = [{ value: "all", label: t("allGenders") }, ...Array.from(new Set(athletes.map((a) => a.gender))).filter(Boolean).map((item) => ({ value: item, label: genderLabel(item, t) }))];
  const countries: Option[] = [{ value: "all", label: t("allCountries") }, ...Array.from(new Set(athletes.map((a) => a.country))).filter(Boolean).sort().map((item) => ({ value: item, label: item }))];
  const categories: Option[] = [{ value: "all", label: t("allCategories") }, ...Array.from(new Set(athletes.map((a) => a.category))).filter(Boolean).sort().map((item) => ({ value: item, label: item }))];
  const sortOptions: Option[] = [
    { value: "distance_pb", label: t("distancePb") },
    { value: "pb", label: t("fastestPb") },
    { value: "name", label: t("name") },
    { value: "country", label: t("country") },
    { value: "category", label: t("field") },
    ...(hasBibNumbers ? [{ value: "bib", label: t("bib") }] : [])
  ];

  return (
    <>
      <header className="standalone-bar">
        <a className="standalone-link" href="https://rimirigamarathon.com" aria-label="Go to Rimi Riga Marathon website">
          <span className="back-arrow"><ArrowLeft size={17} strokeWidth={2.4} /></span>
          <span className="logo-wrap"><LogoMark /></span>
        </a>
      </header>

      <main className="app">
        <section className="toolbar" aria-label="Elite runner filters">
          <div className="search-wrap">
            <Search className="search-icon" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} />
          </div>
          <div className="filters">
            <CustomSelect label={t("distance")} value={distance} options={distances} onChange={setDistance} />
            <CustomSelect label={t("gender")} value={gender} options={genders} onChange={setGender} />
            <CustomSelect label={t("country")} value={country} options={countries} onChange={setCountry} />
            <CustomSelect label={t("sort")} value={sort} options={sortOptions} onChange={(value) => setSort(value as SortKey)} />
          </div>
          <div className="category-row">
            <CustomSelect label={t("category")} value={category} options={categories} onChange={setCategory} />
          </div>
        </section>

        <div className="list-head">
          <span>{loading ? t("loading") : `${t("showing")} ${filtered.length} ${t("of")} ${athletes.length} ${t("athletes")}`}</span>
          <button type="button" onClick={() => void loadData(true)}><RefreshCw size={13} /> {t("refresh")}</button>
        </div>
        {error && <p className="error">{error}</p>}

        <div className="desktop-view">
          <div className={`runner-table ${hasBibNumbers ? "has-bib" : "no-bib"}`}>
            <div className="runner-head" role="row">
              {hasBibNumbers && <span>{t("bib")}</span>}
              <span>{t("athlete")}</span>
              <span>{t("pb")}</span>
              <span>{t("race")}</span>
            </div>
            {filtered.map((athlete) => (
              <button type="button" className="runner-row" key={athlete.id} onClick={() => setSelected(athlete)}>
                {hasBibNumbers && <span className="bib-cell">{athlete.bib || "—"}</span>}
                <span className="athlete-cell">
                  <span className="name-cell">{athlete.name}</span>
                  <span className="athlete-country"><CountryLine athlete={athlete} /></span>
                  <span className="table-meta">
                    <span className="table-chip">{genderLabel(athlete.gender, t)}</span>
                    {athlete.category && <span className="table-chip">{athlete.category}</span>}
                    {athlete.birthYear && <span className="table-chip">{t("born")} {athlete.birthYear}</span>}
                  </span>
                </span>
                <span className="pb-cell">
                  <strong className="pb-time">{athlete.pb || "—"}</strong>
                  <span className="pb-event">{displayEvent(athlete)}</span>
                </span>
                <span className="race-cell">
                  <span className={`distance-pill ${athlete.distanceColorClass}`}>{athlete.distance}</span>
                  <span className="profile-cue">{t("viewProfile")}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mobile-view">
          {filtered.map((athlete) => (
            <button type="button" key={athlete.id} className="mobile-card" onClick={() => setSelected(athlete)}>
              <div className="mobile-card-top">
                {hasBibNumbers && <span className="mobile-bib">{t("bib")} {athlete.bib || "—"}</span>}
                {athlete.category && <span className="mobile-category">{athlete.category}</span>}
                <span className={`distance-pill ${athlete.distanceColorClass}`}>{athlete.distance}</span>
              </div>
              <div className="mobile-athlete-line">
                <AthleteInitials athlete={athlete} />
                <div>
                  <h3>{athlete.name}</h3>
                  <p><CountryLine athlete={athlete} /> · {genderLabel(athlete.gender, t)}</p>
                </div>
              </div>
              <div className="mobile-pb-box">
                <span>{t("pb")}</span>
                <strong>{athlete.pb || "—"}</strong>
                <small>{displayEvent(athlete)}</small>
              </div>
              <div className="tap-hint">{t("tap")}</div>
            </button>
          ))}
        </div>

        {!loading && filtered.length === 0 && <p className="empty">{t("noMatches")}</p>}
      </main>

      {selected && <ProfileModal athlete={selected} hasBibNumbers={hasBibNumbers} t={t} onClose={() => setSelected(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
