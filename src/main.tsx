import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Papa from "papaparse";
import "./styles.css";

type RawRow = Record<string, string | undefined>;

type Athlete = {
  bib: string;
  name: string;
  country: string;
  countryCode: string;
  year: string;
  birthDate: string;
  pb: string;
  pbEvent: string;
  distance: string;
  gender: string;
  image: string;
  highlight: string;
  instagram: string;
  bio: string;
  profileUrl: string;
  sourceUrl: string;
  tags: string[];
};

const CSV_URL =
  import.meta.env.VITE_ELITE_CSV_URL ||
  "https://raw.githubusercontent.com/davis-rukitis-nc/elite-2026/refs/heads/main/public/elite.csv";

const countryCodeMap: Record<string, string> = {
  Ethiopia: "ETH", Kenya: "KEN", Tanzania: "TAN", Uganda: "UGA", Germany: "GER", Eritrea: "ERI",
  Latvia: "LAT", Lithuania: "LTU", Estonia: "EST", Finland: "FIN", Sweden: "SWE", Norway: "NOR",
  Denmark: "DEN", Poland: "POL", Ukraine: "UKR", Morocco: "MAR", Rwanda: "RWA", Burundi: "BDI", "South Africa": "RSA",
  France: "FRA", Spain: "ESP", Italy: "ITA", Portugal: "POR", "United Kingdom": "GBR",
  USA: "USA", "United States": "USA"
};

const flagEmoji = (code: string) => {
  const normalized = code.trim().toUpperCase();
  const isoMap: Record<string, string> = {
    ETH: "ET", KEN: "KE", TAN: "TZ", UGA: "UG", GER: "DE", ERI: "ER", LAT: "LV", LTU: "LT",
    EST: "EE", FIN: "FI", SWE: "SE", NOR: "NO", DEN: "DK", POL: "PL", UKR: "UA", MAR: "MA", RSA: "ZA",
    RWA: "RW", BDI: "BI", FRA: "FR", ESP: "ES", ITA: "IT", POR: "PT", GBR: "GB", USA: "US"
  };
  const iso = isoMap[normalized] || normalized.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(iso)) return "";
  return iso.split("").map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397)).join("");
};

const get = (row: RawRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const normalizeDistance = (distance: string) => {
  const value = distance.trim();
  const lower = value.toLowerCase();
  if (lower === "marathon" || value === "42KM" || value === "42K" || value === "42 km" || value === "42km") return "Marathon";
  if (lower === "half marathon" || value === "21KM" || value === "21K" || value === "21 km" || value === "21km") return "Half marathon";
  if (value === "10KM" || value === "10K" || value === "10 km" || value === "10km") return "10 km";
  if (value === "6KM" || value === "6K" || value === "6 km" || value === "6km") return "6 km";
  if (value === "5.7KM" || value === "5.7K" || value === "5.7 km") return "5.7 km";
  if (lower === "mile" || lower === "dpd jūdze") return "Mile";
  return value || "—";
};

const normalizeGender = (gender: string) => {
  const g = gender.trim().toUpperCase();
  if (["M", "MALE", "MEN"].includes(g)) return "Men";
  if (["W", "F", "FEMALE", "WOMEN"].includes(g)) return "Women";
  return gender || "—";
};

const distanceClass = (distance: string) => {
  const d = distance.toLowerCase();
  if (d.includes("marathon") && !d.includes("half")) return "distance-red";
  if (d.includes("42")) return "distance-red";
  if (d.includes("half") || d.includes("21")) return "distance-green";
  if (d.includes("10")) return "distance-blue";
  if (d.includes("6") || d.includes("5.7")) return "distance-orange";
  if (d.includes("mile")) return "distance-red";
  return "distance-purple";
};

const pbToSeconds = (pb: string) => {
  const clean = pb.trim();
  if (!clean || /debut/i.test(clean)) return Number.POSITIVE_INFINITY;
  const parts = clean.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return Number.POSITIVE_INFINITY;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
};

const parseTags = (value: string) => value.split(/[;,|]/).map((tag) => tag.trim()).filter(Boolean);

const rowToAthlete = (row: RawRow): Athlete => {
  const country = get(row, ["Country", "Nationality"]);
  const countryCode = get(row, ["Country Code", "Code", "NOC"]) || countryCodeMap[country] || country.slice(0, 3).toUpperCase();

  return {
    bib: get(row, ["BIB Nr.", "BIB", "Bib", "Bib Number"]),
    name: get(row, ["Athlete", "Name", "Runner"]),
    country,
    countryCode,
    year: get(row, ["Year", "Birth Year"]),
    birthDate: get(row, ["Date of birth", "Date Of Birth", "DOB"]),
    pb: get(row, ["Personal Best Time", "Personal Best", "PB"]),
    pbEvent: get(row, ["Personal Best City/Year", "Personal Best Event", "PB Event", "Event"]),
    distance: normalizeDistance(get(row, ["Distance", "Race"])),
    gender: normalizeGender(get(row, ["Gender", "Sex"])),
    image: get(row, ["Image", "Photo", "Image URL"]),
    highlight: get(row, ["Highlight", "Note"]),
    instagram: get(row, ["Instagram", "IG"]),
    bio: get(row, ["Bio", "Biography"]),
    profileUrl: get(row, ["Profile URL", "Profile", "World Athletics"]),
    sourceUrl: get(row, ["Source URL", "Source"]),
    tags: parseTags(get(row, ["Tags", "Tag"]))
  };
};

function CustomSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="select-wrap" ref={ref}>
      <span className="select-label">{label}</span>
      <button className="select-button" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span>{value}</span>
        <span className="select-arrow">⌄</span>
      </button>
      {open && (
        <div className="select-menu" role="listbox">
          {options.map((option) => (
            <button
              className={option === value ? "select-item active" : "select-item"}
              type="button"
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
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
  return <div className="avatar">{initials || "RR"}</div>;
}

function DistancePill({ distance }: { distance: string }) {
  return <span className={`distance-pill ${distanceClass(distance)}`}>{distance}</span>;
}

function TableView({ athletes, onOpen }: { athletes: Athlete[]; onOpen: (athlete: Athlete) => void }) {
  return (
    <div className="table-shell">
      <table className="elite-table">
        <thead>
          <tr className="top-head">
            <th>BIB</th>
            <th>Athlete</th>
            <th>Country</th>
            <th>Year</th>
            <th colSpan={2} className="pb-head">Personal Best</th>
            <th>Distance</th>
            <th>Gender</th>
          </tr>
          <tr className="sub-head">
            <th>№</th>
            <th>Name, Surname</th>
            <th>Flag / Code</th>
            <th>Birth year</th>
            <th>Time</th>
            <th>City / Year</th>
            <th>Race</th>
            <th>M / W</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => (
            <tr key={`${athlete.bib}-${athlete.name}`} onClick={() => onOpen(athlete)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onOpen(athlete)}>
              <td>{athlete.bib || "—"}</td>
              <td className="name-cell">{athlete.name}</td>
              <td>{flagEmoji(athlete.countryCode)} <span>{athlete.countryCode || athlete.country}</span></td>
              <td>{athlete.year || "—"}</td>
              <td className="pb-time">{athlete.pb || "—"}</td>
              <td>{athlete.pbEvent || "—"}</td>
              <td><DistancePill distance={athlete.distance} /></td>
              <td>{athlete.gender}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCard({ athlete, onOpen }: { athlete: Athlete; onOpen: (athlete: Athlete) => void }) {
  return (
    <button className="mobile-card" type="button" onClick={() => onOpen(athlete)}>
      <div className="mobile-card-top">
        <div className="mobile-bib">BIB {athlete.bib || "—"}</div>
        <DistancePill distance={athlete.distance} />
      </div>

      <div className="mobile-athlete-line">
        <AthleteInitials athlete={athlete} />
        <div>
          <h3>{athlete.name}</h3>
          <p>{flagEmoji(athlete.countryCode)} {athlete.country || athlete.countryCode} · {athlete.gender} · {athlete.year || "—"}</p>
        </div>
      </div>

      <div className="mobile-pb-box">
        <span>Personal Best</span>
        <strong>{athlete.pb || "—"}</strong>
        <small>{athlete.pbEvent || "—"}</small>
      </div>

      <div className="tap-hint">Tap for profile</div>
    </button>
  );
}

function AthleteModal({ athlete, onClose }: { athlete: Athlete; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <div className="profile-modal" role="dialog" aria-modal="true" aria-label={`${athlete.name} profile`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close profile">×</button>

        <div className="profile-head">
          <AthleteInitials athlete={athlete} />
          <div>
            <p className="profile-kicker">BIB {athlete.bib || "—"} · {athlete.distance}</p>
            <h2>{athlete.name}</h2>
            <p className="profile-country">{flagEmoji(athlete.countryCode)} {athlete.country || athlete.countryCode} · {athlete.gender}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div><span>Personal best</span><strong>{athlete.pb || "—"}</strong></div>
          <div><span>Event</span><strong>{athlete.pbEvent || "—"}</strong></div>
          <div><span>Birth year</span><strong>{athlete.year || "—"}</strong></div>
          <div><span>Date of birth</span><strong>{athlete.birthDate || "—"}</strong></div>
        </div>

        {(athlete.highlight || athlete.bio) && (
          <div className="profile-copy">
            {athlete.highlight && <p className="highlight">{athlete.highlight}</p>}
            {athlete.bio && <p>{athlete.bio}</p>}
          </div>
        )}

        <div className="tags">
          <DistancePill distance={athlete.distance} />
          {athlete.tags.map((tag) => <span className="tag-pill" key={tag}>{tag}</span>)}
        </div>

        {(athlete.profileUrl || athlete.sourceUrl || athlete.instagram) && (
          <div className="profile-links">
            {(athlete.profileUrl || athlete.sourceUrl) && (
              <a href={athlete.profileUrl || athlete.sourceUrl} target="_blank" rel="noreferrer">World Athletics profile</a>
            )}
            {athlete.instagram && <a href={athlete.instagram} target="_blank" rel="noreferrer">Instagram</a>}
          </div>
        )}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <img
      className="rrm-logo-img"
      src="/logo.svg"
      alt="Rimi Riga Marathon"
      loading="eager"
      decoding="async"
    />
  );
}


function App() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [distance, setDistance] = useState("All distances");
  const [gender, setGender] = useState("All");
  const [country, setCountry] = useState("All countries");
  const [sort, setSort] = useState("Best PB");
  const [selected, setSelected] = useState<Athlete | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const separator = CSV_URL.includes("?") ? "&" : "?";
      const response = await fetch(`${CSV_URL}${separator}v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
      const text = await response.text();
      const parsed = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
      const rows = parsed.data.map(rowToAthlete).filter((athlete) => athlete.name);
      setAthletes(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load CSV data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const distances = useMemo(() => ["All distances", ...Array.from(new Set(athletes.map((athlete) => athlete.distance).filter(Boolean)))], [athletes]);
  const countries = useMemo(() => ["All countries", ...Array.from(new Set(athletes.map((athlete) => athlete.countryCode || athlete.country).filter(Boolean))).sort()], [athletes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return athletes
      .filter((athlete) => {
        const matchesQuery = !q || [athlete.name, athlete.country, athlete.countryCode, athlete.bib, athlete.pb, athlete.pbEvent].join(" ").toLowerCase().includes(q);
        const matchesDistance = distance === "All distances" || athlete.distance === distance;
        const matchesGender = gender === "All" || athlete.gender === gender;
        const countryValue = athlete.countryCode || athlete.country;
        const matchesCountry = country === "All countries" || countryValue === country;
        return matchesQuery && matchesDistance && matchesGender && matchesCountry;
      })
      .sort((a, b) => {
        if (sort === "Name") return a.name.localeCompare(b.name);
        if (sort === "Country") return (a.countryCode || a.country).localeCompare(b.countryCode || b.country);
        if (sort === "Best PB") return pbToSeconds(a.pb) - pbToSeconds(b.pb);
        if (sort === "Distance") return a.distance.localeCompare(b.distance);
        return Number(a.bib || 9999) - Number(b.bib || 9999);
      });
  }, [athletes, query, distance, gender, country, sort]);

  return (
    <>
      <header className="standalone-bar">
        <a href="https://rimirigamarathon.com/" target="_blank" rel="noreferrer" aria-label="Open Rimi Riga Marathon">
          <span className="top-arrow" aria-hidden="true">←</span>
          <LogoMark />
        </a>
      </header>

      <main className="app">
        <section className="toolbar" aria-label="Elite runner filters">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search athlete, country, BIB…" />
          </div>

          <div className="filters">
            <CustomSelect label="Distance" value={distance} options={distances} onChange={setDistance} />
            <CustomSelect label="Gender" value={gender} options={["All", "Men", "Women"]} onChange={setGender} />
            <CustomSelect label="Country" value={country} options={countries} onChange={setCountry} />
            <CustomSelect label="Sort" value={sort} options={["Best PB", "BIB", "Name", "Country", "Distance"]} onChange={setSort} />
          </div>
        </section>

        <div className="list-head">
          <span>{loading ? "Loading athletes…" : `Showing ${filtered.length} of ${athletes.length} athletes`}</span>
          <button type="button" onClick={loadData}>Refresh data</button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="desktop-view">
          <TableView athletes={filtered} onOpen={setSelected} />
        </div>

        <div className="mobile-view">
          {filtered.map((athlete) => <MobileCard key={`${athlete.bib}-${athlete.name}`} athlete={athlete} onOpen={setSelected} />)}
        </div>

        {!loading && filtered.length === 0 && <p className="empty">No athletes match the selected filters.</p>}
        {selected && <AthleteModal athlete={selected} onClose={() => setSelected(null)} />}
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
