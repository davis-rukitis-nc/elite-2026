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
  tags: string[];
};

type Option = { value: string; label: string };
type SortKey = "pb" | "name" | "country" | "bib";

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
  "afghanistan":"AF","albania":"AL","algeria":"DZ","andorra":"AD","angola":"AO","argentina":"AR","armenia":"AM","australia":"AU","austria":"AT","azerbaijan":"AZ",
  "bahamas":"BS","bahrain":"BH","bangladesh":"BD","barbados":"BB","belarus":"BY","belgium":"BE","belize":"BZ","benin":"BJ","bhutan":"BT","bolivia":"BO","bosnia and herzegovina":"BA","botswana":"BW","brazil":"BR","bulgaria":"BG","burkina faso":"BF","burundi":"BI",
  "cambodia":"KH","cameroon":"CM","canada":"CA","cape verde":"CV","central african republic":"CF","chad":"TD","chile":"CL","china":"CN","colombia":"CO","comoros":"KM","congo":"CG","costa rica":"CR","croatia":"HR","cuba":"CU","cyprus":"CY","czech republic":"CZ","czechia":"CZ",
  "denmark":"DK","djibouti":"DJ","dominica":"DM","dominican republic":"DO","dr congo":"CD","ecuador":"EC","egypt":"EG","el salvador":"SV","eritrea":"ER","estonia":"EE","eswatini":"SZ","ethiopia":"ET",
  "fiji":"FJ","finland":"FI","france":"FR","gabon":"GA","gambia":"GM","georgia":"GE","germany":"DE","ghana":"GH","great britain":"GB","greece":"GR","grenada":"GD","guatemala":"GT","guinea":"GN","guinea-bissau":"GW","guyana":"GY",
  "haiti":"HT","honduras":"HN","hong kong":"HK","hungary":"HU","iceland":"IS","india":"IN","indonesia":"ID","iran":"IR","iraq":"IQ","ireland":"IE","israel":"IL","italy":"IT",
  "jamaica":"JM","japan":"JP","jordan":"JO","kazakhstan":"KZ","kenya":"KE","kosovo":"XK","kuwait":"KW","kyrgyzstan":"KG","latvia":"LV","lebanon":"LB","lesotho":"LS","liberia":"LR","libya":"LY","liechtenstein":"LI","lithuania":"LT","luxembourg":"LU",
  "madagascar":"MG","malawi":"MW","malaysia":"MY","maldives":"MV","mali":"ML","malta":"MT","mauritania":"MR","mauritius":"MU","mexico":"MX","moldova":"MD","monaco":"MC","mongolia":"MN","montenegro":"ME","morocco":"MA","mozambique":"MZ","myanmar":"MM",
  "namibia":"NA","nepal":"NP","netherlands":"NL","new zealand":"NZ","nicaragua":"NI","niger":"NE","nigeria":"NG","north macedonia":"MK","norway":"NO","oman":"OM","pakistan":"PK","panama":"PA","paraguay":"PY","peru":"PE","philippines":"PH","poland":"PL","portugal":"PT","qatar":"QA",
  "romania":"RO","rwanda":"RW","saudi arabia":"SA","senegal":"SN","serbia":"RS","seychelles":"SC","sierra leone":"SL","singapore":"SG","slovakia":"SK","slovenia":"SI","somalia":"SO","south africa":"ZA","south sudan":"SS","spain":"ES","sri lanka":"LK","sudan":"SD","sweden":"SE","switzerland":"CH","syria":"SY",
  "taiwan":"TW","tanzania":"TZ","thailand":"TH","togo":"TG","trinidad and tobago":"TT","tunisia":"TN","turkey":"TR","uganda":"UG","ukraine":"UA","united arab emirates":"AE","united kingdom":"GB","united states":"US","usa":"US","uruguay":"UY","uzbekistan":"UZ","venezuela":"VE","vietnam":"VN","yemen":"YE","zambia":"ZM","zimbabwe":"ZW"
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
  for (const key of keys) {
    if (row[key] !== undefined && row[key].trim()) return row[key].trim();
  }
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
  if (value.includes("42") || value === "marathon" || value.includes("mile")) return "distance-red";
  return "distance-purple";
}

function normalizeDistance(distance: string) {
  const value = distance.trim().toUpperCase().replace(/\s+/g, "");
  if (value === "42KM" || value === "42K" || value === "MARATHON") return "42KM";
  if (value === "21KM" || value === "21K" || value === "HALFMARATHON") return "21KM";
  if (value === "10KM" || value === "10K") return "10KM";
  if (value === "6KM" || value === "6K") return "6KM";
  if (value === "MILE" || value === "1609M") return "MILE";
  return distance || "—";
}

function normalizeGender(gender: string) {
  const value = gender.trim().toUpperCase();
  if (["M", "MALE", "MEN"].includes(value)) return "M";
  if (["W", "F", "FEMALE", "WOMEN"].includes(value)) return "W";
  return gender || "—";
}

function genderLabel(gender: string) {
  if (gender === "M") return "Men";
  if (gender === "W") return "Women";
  return gender || "—";
}

function splitTags(value: string) {
  return value.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean);
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

  return {
    id: `${name || "athlete"}-${index}`,
    bib,
    name,
    country,
    countryCode,
    year: pick(row, ["year", "birth_year", "born"]),
    birthDate: pick(row, ["date_of_birth", "birth_date", "dob"]),
    gender: normalizeGender(pick(row, ["gender", "sex"])),
    distance,
    distanceColorClass: distanceColorClass(distance),
    pb,
    pbSeconds: parseTimeToSeconds(pb),
    event: pick(row, ["personal_best_city_year", "pb_city_year", "personal_best_event", "event", "city_year"]),
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
  return (
    <img
      className="rrm-logo-img"
      src="/logo.svg"
      alt="Rimi Riga Marathon"
      loading="eager"
      decoding="async"
      onError={(event) => {
        event.currentTarget.src = "https://rimirigamarathon.com/wp-content/uploads/2024/01/rrm-logo-white.svg";
      }}
    />
  );
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

function ProfileModal({ athlete, onClose, hasBibNumbers }: { athlete: Athlete; onClose: () => void; hasBibNumbers: boolean }) {
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
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close profile">×</button>
        <div className="profile-head">
          <AthleteInitials athlete={athlete} />
          <div>
            <p className="profile-kicker">{hasBibNumbers && athlete.bib ? `BIB ${athlete.bib} · ` : ""}{athlete.distance}</p>
            <h2>{athlete.name}</h2>
            <p className="profile-country"><CountryLine athlete={athlete} /> · {genderLabel(athlete.gender)}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div><span>Personal best</span><strong>{athlete.pb || "—"}</strong></div>
          <div><span>PB event</span><strong>{athlete.event || "—"}</strong></div>
          <div><span>Year</span><strong>{athlete.year || "—"}</strong></div>
          <div><span>Date of birth</span><strong>{athlete.birthDate || "—"}</strong></div>
        </div>

        {(athlete.highlight || athlete.bio) && (
          <div className="profile-copy">
            {athlete.highlight && <p className="highlight">{athlete.highlight}</p>}
            {athlete.bio && <p>{athlete.bio}</p>}
          </div>
        )}

        {athlete.tags.length > 0 && (
          <div className="tags" aria-label="Athlete tags">
            {athlete.tags.map((tag) => <span className="tag-pill" key={tag}>{tag}</span>)}
          </div>
        )}

        {(athlete.profileUrl || athlete.instagram) && (
          <div className="profile-links">
            {athlete.profileUrl && <a href={athlete.profileUrl} target="_blank" rel="noreferrer">World Athletics profile</a>}
            {athlete.instagram && <a href={athlete.instagram} target="_blank" rel="noreferrer">Instagram</a>}
          </div>
        )}
      </div>
    </div>
  );
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
  }, [athletes.length, selected, loading, query, distance, gender, country, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return athletes
      .filter((athlete) => {
        const searchable = [athlete.name, athlete.country, athlete.countryCode, athlete.pb, athlete.event, athlete.distance, athlete.gender, athlete.year].join(" ").toLowerCase();
        return (!q || searchable.includes(q)) &&
          (distance === "all" || athlete.distance === distance) &&
          (gender === "all" || athlete.gender === gender) &&
          (country === "all" || athlete.country === country);
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "country") return a.country.localeCompare(b.country) || a.pbSeconds - b.pbSeconds;
        if (sort === "bib") return Number(a.bib || 999999) - Number(b.bib || 999999);
        return a.pbSeconds - b.pbSeconds || a.name.localeCompare(b.name);
      });
  }, [athletes, query, distance, gender, country, sort]);

  const distances: Option[] = [{ value: "all", label: "All distances" }, ...Array.from(new Set(athletes.map((a) => a.distance))).filter(Boolean).map((item) => ({ value: item, label: item }))];
  const genders: Option[] = [{ value: "all", label: "All" }, ...Array.from(new Set(athletes.map((a) => a.gender))).filter(Boolean).map((item) => ({ value: item, label: genderLabel(item) }))];
  const countries: Option[] = [{ value: "all", label: "All countries" }, ...Array.from(new Set(athletes.map((a) => a.country))).filter(Boolean).sort().map((item) => ({ value: item, label: item }))];
  const sortOptions: Option[] = [
    { value: "pb", label: "Fastest PB" },
    { value: "name", label: "Name" },
    { value: "country", label: "Country" },
    ...(hasBibNumbers ? [{ value: "bib", label: "BIB" }] : [])
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
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search athlete, country, PB…" />
          </div>
          <div className="filters">
            <CustomSelect label="Distance" value={distance} options={distances} onChange={setDistance} />
            <CustomSelect label="Gender" value={gender} options={genders} onChange={setGender} />
            <CustomSelect label="Country" value={country} options={countries} onChange={setCountry} />
            <CustomSelect label="Sort" value={sort} options={sortOptions} onChange={(value) => setSort(value as SortKey)} />
          </div>
        </section>

        <div className="list-head">
          <span>{loading ? "Loading athletes…" : `Showing ${filtered.length} of ${athletes.length} athletes`}</span>
          <button type="button" onClick={() => void loadData(true)}><RefreshCw size={13} /> Refresh data</button>
        </div>
        {error && <p className="error">{error}</p>}

        <div className="desktop-view">
          <div className="table-shell">
            <table className={`elite-table ${hasBibNumbers ? "has-bib" : "no-bib"}`}>
              <thead>
                <tr>
                  {hasBibNumbers && <th className="col-bib">BIB</th>}
                  <th className="col-athlete">Athlete</th>
                  <th className="col-pb">Personal best</th>
                  <th className="col-race">Race</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((athlete) => (
                  <tr key={athlete.id} onClick={() => setSelected(athlete)}>
                    {hasBibNumbers && <td className="bib-cell">{athlete.bib || "—"}</td>}
                    <td>
                      <div className="athlete-cell">
                        <div className="name-cell">{athlete.name}</div>
                        <div className="athlete-country"><CountryLine athlete={athlete} /></div>
                        <div className="table-meta">
                          <span className="table-chip">{genderLabel(athlete.gender)}</span>
                          <span className="table-chip">Born {athlete.year || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="pb-cell">
                        <strong className="pb-time">{athlete.pb || "—"}</strong>
                        <span className="pb-event">{athlete.event || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="race-cell">
                        <span className={`distance-pill ${athlete.distanceColorClass}`}>{athlete.distance}</span>
                        <span className="profile-cue">Profile →</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mobile-view">
          {filtered.map((athlete) => (
            <button type="button" key={athlete.id} className="mobile-card" onClick={() => setSelected(athlete)}>
              <div className="mobile-card-top">
                {hasBibNumbers && <span className="mobile-bib">BIB {athlete.bib || "—"}</span>}
                <span className={`distance-pill ${athlete.distanceColorClass}`}>{athlete.distance}</span>
              </div>
              <div className="mobile-athlete-line">
                <AthleteInitials athlete={athlete} />
                <div>
                  <h3>{athlete.name}</h3>
                  <p><CountryLine athlete={athlete} /> · {genderLabel(athlete.gender)} · {athlete.year || "—"}</p>
                </div>
              </div>
              <div className="mobile-pb-box">
                <span>Personal Best</span>
                <strong>{athlete.pb || "—"}</strong>
                <small>{athlete.event || "—"}</small>
              </div>
              <div className="tap-hint">Tap to view profile →</div>
            </button>
          ))}
        </div>

        {!loading && filtered.length === 0 && <p className="empty">No athletes match the selected filters.</p>}
      </main>

      {selected && <ProfileModal athlete={selected} hasBibNumbers={hasBibNumbers} onClose={() => setSelected(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
