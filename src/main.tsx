
import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Papa from 'papaparse'
import { ArrowUpDown, BadgeInfo, ExternalLink, Grid2X2, List, RefreshCw, Search, SlidersHorizontal, Sparkles, Trophy, X } from 'lucide-react'
import './styles.css'

type Runner = {
  bib: string
  athlete: string
  country: string
  countryCode: string
  year: string
  dob: string
  pb: string
  pbPlace: string
  distance: string
  gender: string
  image: string
  highlight: string
  instagram: string
  bio: string
  profileUrl: string
  sourceUrl: string
  tags: string[]
  raw: Record<string, string>
}

type ViewMode = 'cards' | 'table'
type SortKey = 'pb' | 'name' | 'country' | 'year'

const DEFAULT_CSV_URL = '/elite.csv'
const CSV_URL = import.meta.env.VITE_ELITE_CSV_URL || DEFAULT_CSV_URL

const distanceLabels: Record<string, string> = {
  '42KM': 'Marathon',
  '21KM': 'Half marathon',
  '10KM': '10 km',
  '5.7KM': '5.7 km',
  'Mile': 'DPD Mile',
}

const genderLabels: Record<string, string> = {
  M: 'Men',
  W: 'Women',
  F: 'Women',
  Male: 'Men',
  Female: 'Women',
}

const flagMap: Record<string, string> = {
  ETH: '🇪🇹',
  KEN: '🇰🇪',
  TAN: '🇹🇿',
  UGA: '🇺🇬',
  GER: '🇩🇪',
  RSA: '🇿🇦',
}

function clean(value: unknown): string {
  return String(value || '').trim()
}

function normalizeGender(value: string) {
  const v = value.toLowerCase()
  if (v === 'female' || v === 'w') return 'W'
  if (v === 'male' || v === 'm') return 'M'
  return value
}

function normalizeRow(row: Record<string, string>): Runner | null {
  const athlete = clean(row['Athlete'] || row['Name'] || row['Sportists'])
  const bib = clean(row['BIB Nr.'] || row['BIB'] || row['Nr.'])
  if (!athlete && !bib) return null

  const country = clean(row['Country'] || row['country'] || row['Valsts'])
  const countryCode = clean(row['Country Code'] || row['CountryCode'] || row['Code'])
  const tags = clean(row['Tags']).split(';').map((tag) => tag.trim()).filter(Boolean)

  return {
    bib,
    athlete,
    country,
    countryCode,
    year: clean(row['Year'] || row['Birth Year'] || row['Gads']),
    dob: clean(row['Date of birth'] || row['DOB'] || row['DateOfBirth']),
    pb: clean(row['Personal Best Time'] || row['PB'] || row['Personal Best']),
    pbPlace: clean(row['Personal Best City/Year'] || row['PB City/Year'] || row['City/Year']),
    distance: clean(row['Distance'] || row['Distance ']),
    gender: normalizeGender(clean(row['Gender'] || row['Dzimums'])),
    image: clean(row['Image'] || row['Photo'] || row['Attēls']),
    highlight: clean(row['Highlight'] || row['Note'] || row['Info']),
    instagram: clean(row['Instagram'] || row['IG']),
    bio: clean(row['Bio'] || row['Profile'] || row['Apraksts']),
    profileUrl: clean(row['Profile URL'] || row['ProfileUrl'] || row['World Athletics']),
    sourceUrl: clean(row['Source URL'] || row['SourceUrl'] || row['Source']),
    tags,
    raw: row,
  }
}

function timeToSeconds(time: string): number {
  if (!time || /debut|tbc/i.test(time)) return Number.POSITIVE_INFINITY
  const parts = time.split(':').map((p) => Number.parseFloat(p.replace(',', '.')))
  if (parts.some(Number.isNaN)) return Number.POSITIVE_INFINITY
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0]
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R'
}

function displayDistance(distance: string) {
  return distanceLabels[distance] || distance || 'Distance TBC'
}

function displayGender(gender: string) {
  return genderLabels[gender] || gender || 'Elite'
}

function countryFlag(runner: Runner) {
  const code = runner.countryCode || runner.country.slice(0, 3).toUpperCase()
  return flagMap[code] || '🌍'
}

function App() {
  const [runners, setRunners] = useState<Runner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [distance, setDistance] = useState('all')
  const [gender, setGender] = useState('all')
  const [country, setCountry] = useState('all')
  const [sort, setSort] = useState<SortKey>('pb')
  const [view, setView] = useState<ViewMode>('cards')
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null)

  async function loadData(force = false) {
    setLoading(true)
    setError(null)
    try {
      const cacheKey = force ? Date.now() : new Date().toISOString().slice(0, 13)
      const url = CSV_URL.includes('?') ? `${CSV_URL}&v=${cacheKey}` : `${CSV_URL}?v=${cacheKey}`
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error(`CSV request failed: ${response.status}`)
      const text = await response.text()
      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const next = result.data.map(normalizeRow).filter(Boolean) as Runner[]
          setRunners(next)
          setUpdatedAt(new Date())
          setLoading(false)
        },
        error: (parseError: Error) => {
          setError(parseError.message)
          setLoading(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load athlete data.')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedRunner(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const options = useMemo(() => {
    return {
      distances: Array.from(new Set(runners.map((r) => r.distance).filter(Boolean))),
      genders: Array.from(new Set(runners.map((r) => r.gender).filter(Boolean))),
      countries: Array.from(new Set(runners.map((r) => r.country).filter(Boolean))).sort(),
    }
  }, [runners])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return runners
      .filter((runner) => distance === 'all' || runner.distance === distance)
      .filter((runner) => gender === 'all' || runner.gender === gender)
      .filter((runner) => country === 'all' || runner.country === country)
      .filter((runner) => {
        if (!q) return true
        return [runner.athlete, runner.country, runner.countryCode, runner.bib, runner.pb, runner.pbPlace, runner.highlight, runner.bio]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        if (sort === 'pb') return timeToSeconds(a.pb) - timeToSeconds(b.pb)
        if (sort === 'name') return a.athlete.localeCompare(b.athlete)
        if (sort === 'country') return a.country.localeCompare(b.country)
        return (a.year || '9999').localeCompare(b.year || '9999')
      })
  }, [runners, search, distance, gender, country, sort])

  const featured = useMemo(() => filtered.filter((r) => r.pb).slice(0, 4), [filtered])
  const countryCount = new Set(runners.map((r) => r.country).filter(Boolean)).size
  const fastest = runners.filter((r) => r.pb).sort((a, b) => timeToSeconds(a.pb) - timeToSeconds(b.pb))[0]

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> Rimi Riga Marathon</p>
          <h1>Elite field 2026</h1>
          <p>Explore the invited elite athletes, filter the line-up, and open runner profiles directly inside the embed.</p>
        </div>
        <div className="hero-stats">
          <Stat label="Athletes" value={runners.length || '—'} icon={<Trophy />} />
          <Stat label="Countries" value={countryCount || '—'} icon={<BadgeInfo />} />
          <Stat label="Fastest PB" value={fastest?.pb || '—'} icon={<ArrowUpDown />} />
        </div>
      </section>

      <section className="toolbar" aria-label="Elite runner filters">
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search athlete, country, PB..." />
        </div>

        <SelectBox label="Distance" value={distance} onChange={setDistance}>
          <option value="all">All distances</option>
          {options.distances.map((item) => <option key={item} value={item}>{displayDistance(item)}</option>)}
        </SelectBox>

        <SelectBox label="Gender" value={gender} onChange={setGender}>
          <option value="all">All</option>
          {options.genders.map((item) => <option key={item} value={item}>{displayGender(item)}</option>)}
        </SelectBox>

        <SelectBox label="Country" value={country} onChange={setCountry}>
          <option value="all">All countries</option>
          {options.countries.map((item) => <option key={item} value={item}>{item}</option>)}
        </SelectBox>

        <SelectBox label="Sort" value={sort} onChange={(value) => setSort(value as SortKey)}>
          <option value="pb">Best PB</option>
          <option value="name">Name</option>
          <option value="country">Country</option>
          <option value="year">Year</option>
        </SelectBox>

        <div className="view-toggle" aria-label="View mode">
          <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}><Grid2X2 size={17} /> Cards</button>
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><List size={17} /> Table</button>
        </div>
      </section>

      <section className="status-line">
        <div><SlidersHorizontal size={16} /> Showing <strong>{filtered.length}</strong> of <strong>{runners.length}</strong> athletes</div>
        <button className="ghost-button" onClick={() => loadData(true)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh data
        </button>
      </section>

      {updatedAt && <p className="updated">Data loaded {updatedAt.toLocaleString()}</p>}
      {error && <div className="error-box">{error}</div>}

      {featured.length > 0 && (
        <section className="featured-strip">
          {featured.map((runner, index) => (
            <button key={`${runner.athlete}-${index}`} className="featured-card" onClick={() => setSelectedRunner(runner)}>
              <span className="rank">#{index + 1}</span>
              <span>
                <strong>{runner.athlete}</strong>
                <p>{countryFlag(runner)} {runner.country} · {runner.pb}</p>
              </span>
            </button>
          ))}
        </section>
      )}

      {loading ? (
        <div className="loading-card">Loading elite field...</div>
      ) : view === 'cards' ? (
        <section className="card-grid">
          {filtered.map((runner) => (
            <RunnerCard key={`${runner.athlete}-${runner.pb}-${runner.distance}`} runner={runner} onClick={() => setSelectedRunner(runner)} />
          ))}
        </section>
      ) : (
        <RunnerTable runners={filtered} onSelect={setSelectedRunner} />
      )}

      {!loading && filtered.length === 0 && <div className="empty-card">No athletes match the selected filters.</div>}

      {selectedRunner && <ProfileModal runner={selectedRunner} onClose={() => setSelectedRunner(null)} />}
    </main>
  )
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div>
}

function SelectBox({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="select-box">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  )
}

function Avatar({ runner, large = false }: { runner: Runner; large?: boolean }) {
  return (
    <div className={large ? 'avatar avatar-large' : 'avatar'}>
      {runner.image ? <img src={runner.image} alt="" /> : <span>{initials(runner.athlete)}</span>}
    </div>
  )
}

function RunnerCard({ runner, onClick }: { runner: Runner; onClick: () => void }) {
  return (
    <button className="runner-card" onClick={onClick}>
      <div className="card-topline">
        <Avatar runner={runner} />
        <span className="pill">{displayDistance(runner.distance)}</span>
      </div>
      <h2>{runner.athlete}</h2>
      <p className="country">{countryFlag(runner)} {runner.country}{runner.countryCode ? ` · ${runner.countryCode}` : ''}</p>
      <div className="metric-row">
        <span><small>PB</small><strong>{runner.pb || 'TBC'}</strong></span>
        <span><small>Gender</small><strong>{displayGender(runner.gender)}</strong></span>
        <span><small>Year</small><strong>{runner.year || '—'}</strong></span>
      </div>
      {runner.pbPlace && <p className="pb-place">{runner.pbPlace}</p>}
      {runner.highlight && <p className="highlight">{runner.highlight}</p>}
      <span className="open-profile">Open profile</span>
    </button>
  )
}

function RunnerTable({ runners, onSelect }: { runners: Runner[]; onSelect: (runner: Runner) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Athlete</th><th>Country</th><th>Distance</th><th>PB</th><th>Event</th><th></th></tr></thead>
        <tbody>
          {runners.map((runner) => (
            <tr key={`${runner.athlete}-${runner.pb}`} onClick={() => onSelect(runner)}>
              <td><strong>{runner.athlete}</strong></td>
              <td>{countryFlag(runner)} {runner.country}</td>
              <td>{displayDistance(runner.distance)}</td>
              <td>{runner.pb || 'TBC'}</td>
              <td>{runner.pbPlace || '—'}</td>
              <td><span className="table-link">Profile</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProfileModal({ runner, onClose }: { runner: Runner; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-label={`${runner.athlete} profile`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close profile"><X size={20} /></button>
        <div className="profile-hero">
          <Avatar runner={runner} large />
          <div>
            <span className="profile-kicker">{displayDistance(runner.distance)} · {displayGender(runner.gender)}</span>
            <h2>{runner.athlete}</h2>
            <p>{countryFlag(runner)} {runner.country}{runner.countryCode ? ` · ${runner.countryCode}` : ''}</p>
          </div>
        </div>

        <div className="profile-metrics">
          <span><small>Personal best</small><strong>{runner.pb || 'TBC'}</strong></span>
          <span><small>PB event</small><strong>{runner.pbPlace || '—'}</strong></span>
          <span><small>Birth year</small><strong>{runner.year || '—'}</strong></span>
          {runner.bib && <span><small>BIB</small><strong>{runner.bib}</strong></span>}
        </div>

        {runner.highlight && <div className="profile-highlight">{runner.highlight}</div>}
        {runner.bio && <p className="profile-bio">{runner.bio}</p>}

        {runner.tags.length > 0 && <div className="tag-row">{runner.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}

        <div className="profile-actions">
          {runner.profileUrl && <a href={runner.profileUrl} target="_blank" rel="noreferrer">Athlete profile <ExternalLink size={15} /></a>}
          {runner.instagram && <a href={runner.instagram} target="_blank" rel="noreferrer">Instagram <ExternalLink size={15} /></a>}
          {runner.sourceUrl && <a href={runner.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={15} /></a>}
        </div>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
