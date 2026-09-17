import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Baby,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Database,
  Facebook,
  FileCheck2,
  HeartHandshake,
  History,
  Info,
  LayoutDashboard,
  Leaf,
  Link2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Ruler,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  TableProperties,
  UserRound,
  Weight,
  X,
  type LucideIcon,
} from 'lucide-react'
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, ApiRecord, asList, asRecord, booleanValue, endpoints, numberValue, text } from './api'

type Route = '/' | '/login' | '/register' | '/panduan' | '/architecture' | '/app'

type Notice = { kind: 'success' | 'error' | 'info'; message: string } | null

const routes: Route[] = ['/', '/login', '/register', '/panduan', '/architecture', '/app']

function currentRoute(): Route {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  return routes.includes(path as Route) ? path as Route : '/'
}

function valueFrom(record: ApiRecord, keys: string[], fallback = '—'): string {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') return text(record[key], fallback)
  }
  return fallback
}

function listFrom(record: ApiRecord, keys: string[]): ApiRecord[] {
  for (const key of keys) {
    if (Array.isArray(record[key])) return asList(record[key])
  }
  return []
}

function formatDate(value: unknown, withTime = false): string {
  if (!value) return 'Waktu belum tersedia'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return text(value, 'Waktu belum tersedia')
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function statusInfo(value: unknown): { label: string; tone: string } {
  const status = text(value, 'unknown').toLowerCase()
  if (['completed', 'success', 'succeeded', 'done', 'linked', 'active'].includes(status)) return { label: status === 'linked' ? 'Terhubung' : 'Selesai', tone: 'success' }
  if (['failed', 'error', 'blocked'].includes(status)) return { label: status === 'blocked' ? 'Dihentikan kebijakan' : 'Gagal', tone: 'danger' }
  if (['running', 'processing', 'claimed'].includes(status)) return { label: 'Sedang berjalan', tone: 'working' }
  if (['queued', 'pending'].includes(status)) return { label: 'Menunggu', tone: 'neutral' }
  return { label: text(value, 'Belum diketahui'), tone: 'neutral' }
}

function Link({ to, className = '', children, onNavigate }: { to: Route; className?: string; children: ReactNode; onNavigate?: () => void }) {
  return <a className={className} href={to} onClick={(event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    onNavigate?.()
  }}>{children}</a>
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`brand ${inverse ? 'brand-inverse' : ''}`}>
    <span className="brand-mark"><ShieldCheck size={22} strokeWidth={2.2} /></span>
    <span>Nutri<span>Shield</span></span>
  </Link>
}

function Header({ user, onLogout }: { user: ApiRecord | null; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="container nav-wrap">
      <Brand />
      <button className="icon-button mobile-menu" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Navigasi utama">
        <Link to="/" onNavigate={() => setOpen(false)}>Beranda</Link>
        <Link to="/panduan" onNavigate={() => setOpen(false)}>Panduan kanal</Link>
        <Link to="/architecture" onNavigate={() => setOpen(false)}>Cara kerja</Link>
        {user ? <>
          <Link to="/app" className="button button-small" onNavigate={() => setOpen(false)}><LayoutDashboard size={17} /> Dashboard</Link>
          <button className="button button-ghost button-small" onClick={() => void onLogout()}><LogOut size={17} /> Keluar</button>
        </> : <>
          <Link to="/login" className="nav-login" onNavigate={() => setOpen(false)}>Masuk</Link>
          <Link to="/register" className="button button-small" onNavigate={() => setOpen(false)}>Mulai mencatat <ArrowRight size={16} /></Link>
        </>}
      </nav>
    </div>
  </header>
}

function Footer() {
  return <footer className="footer">
    <div className="container footer-grid">
      <div className="footer-brand">
        <Brand inverse />
        <p>Pendamping keluarga untuk mencatat pertumbuhan anak, memahami informasi yang tersedia, dan menyiapkan tindak lanjut yang dapat ditelusuri.</p>
        <span className="footer-sandbox"><Sprout size={16} /> Prototipe sandbox lokal</span>
      </div>
      <div>
        <h3>Produk</h3>
        <Link to="/app">Dashboard</Link>
        <Link to="/architecture">Arsitektur</Link>
        <Link to="/architecture">Transparansi data</Link>
        <Link to="/panduan">Panduan bot</Link>
      </div>
      <div>
        <h3>Dukungan & kepercayaan</h3>
        <span>Bantuan <small>Draf</small></span>
        <span>Privasi <small>Draf</small></span>
        <span>Ketentuan <small>Draf</small></span>
        <span>Status sistem <small>Draf</small></span>
      </div>
      <div>
        <h3>Sumber data</h3>
        <p>Panganku/TKPI, daftar BPOM, dan Open Food Facts. Lisensi serta ketentuan sumber tetap berlaku pada data terkait.</p>
      </div>
    </div>
    <div className="container footer-bottom">
      <p><strong>Penting:</strong> prototipe ini tidak terhubung ke domain utama. Informasi bukan diagnosis dan tidak memberi dosis obat atau suplemen.</p>
      <span>NutriShield v2 · 2026</span>
    </div>
  </footer>
}

function PublicLayout({ user, onLogout, children }: { user: ApiRecord | null; onLogout: () => Promise<void>; children: ReactNode }) {
  return <div className="page-shell"><Header user={user} onLogout={onLogout} /><main>{children}</main><Footer /></div>
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow"><Leaf size={15} />{children}</span>
}

function Landing({ user, onLogout }: { user: ApiRecord | null; onLogout: () => Promise<void> }) {
  return <PublicLayout user={user} onLogout={onLogout}>
    <section className="hero">
      <div className="hero-texture" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <Eyebrow>Catatan keluarga yang lebih tenang</Eyebrow>
          <h1>Pahami tumbuh kembang anak, <em>satu catatan</em> setiap hari.</h1>
          <p className="hero-lead">Simpan profil dan pengukuran, cari informasi pangan, lalu ajukan pertanyaan dengan jawaban yang sumber dan prosesnya dapat ditelusuri.</p>
          <div className="hero-actions">
            <Link to={user ? '/app' : '/register'} className="button button-large">{user ? 'Buka dashboard' : 'Mulai secara gratis'} <ArrowRight size={19} /></Link>
            <Link to="/architecture" className="button button-secondary button-large">Lihat cara kerja</Link>
          </div>
          <p className="hero-note"><ShieldCheck size={17} /> Data keluarga dipisahkan per akun. Bukan alat diagnosis.</p>
        </div>
        <div className="hero-visual" aria-label="Pratinjau catatan keluarga NutriShield">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="preview-card preview-main">
            <div className="preview-head"><div><span>Ringkasan hari ini</span><strong>Selamat pagi, Ibu</strong></div><span className="mini-avatar"><UserRound size={18} /></span></div>
            <div className="child-preview"><span className="child-avatar"><Baby /></span><div><strong>Catatan anak</strong><small>Profil tersimpan aman</small></div><span className="tag tag-soft">Aktif</span></div>
            <div className="preview-stats">
              <div><Weight size={19} /><strong>Catat berat</strong><small>Simpan saat diukur</small></div>
              <div><Ruler size={19} /><strong>Catat tinggi</strong><small>Riwayat terurut</small></div>
            </div>
            <div className="assistant-preview"><span><Sparkles size={18} /></span><div><strong>Tanya pendamping keluarga</strong><p>Jawaban sederhana dengan jejak proses.</p></div><ArrowRight size={18} /></div>
          </div>
          <div className="floating-card floating-food"><Leaf size={19} /><div><strong>Data pangan</strong><small>Kelayakan terlihat</small></div></div>
          <div className="floating-card floating-trace"><Check size={18} /><div><strong>Dapat ditelusuri</strong><small>Setiap aktivitas dicatat</small></div></div>
        </div>
      </div>
    </section>

    <section className="trust-strip" aria-label="Prinsip NutriShield"><div className="container trust-items">
      <span><LockKeyhole /> Sesi aman via cookie</span><span><FileCheck2 /> Sumber data terlihat</span><span><HeartHandshake /> Bahasa ramah keluarga</span><span><Activity /> Tindak lanjut tercatat</span>
    </div></section>

    <section className="section how-section">
      <div className="container">
        <div className="section-heading split-heading"><div><Eyebrow>Alur sehari-hari</Eyebrow><h2>Dari catatan menjadi langkah yang lebih jelas.</h2></div><p>NutriShield memisahkan data keluarga, pemeriksaan kualitas, dan penjelasan agar Anda dapat memahami dasar setiap jawaban.</p></div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><div className="feature-icon"><Baby /></div><h3>Buat profil anak</h3><p>Catat nama panggilan, tanggal lahir, dan informasi yang diperlukan. Anda mengendalikan data yang disimpan.</p></article>
          <article className="step-card step-featured"><span className="step-number">02</span><div className="feature-icon"><ClipboardCheck /></div><h3>Simpan pengukuran</h3><p>Masukkan hasil ukur apa adanya. Sistem memeriksa kelengkapan dan mencatat waktu tindak lanjut.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="feature-icon"><MessageCircle /></div><h3>Tanyakan hal praktis</h3><p>Dapatkan penjelasan sederhana. Buka jejak teknis hanya saat Anda ingin memeriksanya.</p></article>
        </div>
      </div>
    </section>

    <section className="section evidence-section"><div className="container evidence-grid">
      <div className="evidence-panel">
        <div className="data-stack" aria-hidden="true"><span>RAW</span><span>NORMALISASI</span><span>KANONIKAL</span></div>
        <div className="quality-card"><Database size={25} /><strong>Data bukan sekadar jumlah</strong><p>Kelengkapan, asal, verifikasi, dan kelayakan pemakaian disimpan terpisah.</p></div>
      </div>
      <div className="evidence-copy"><Eyebrow>Transparansi sejak awal</Eyebrow><h2>Jawaban baik dimulai dari data yang jujur.</h2><p>Nilai kosong tetap disebut belum diketahui—tidak diubah menjadi nol. Produk dengan nama serupa tidak otomatis digabung. Hanya data yang lolos aturan kelayakan yang dapat digunakan agen.</p><ul className="check-list"><li><Check /> Sumber dan versi data tercatat</li><li><Check /> Proses agen memiliki ID korelasi</li><li><Check /> Kebijakan keselamatan dapat menghentikan alur</li></ul><Link to="/architecture" className="text-link">Pelajari arsitektur data <ArrowRight size={17} /></Link></div>
    </div></section>

    <section className="section channel-section"><div className="container channel-callout">
      <div><Eyebrow>Akses sesuai kebiasaan</Eyebrow><h2>Gunakan web, lanjutkan lewat Telegram.</h2><p>Hubungkan akun dengan kode sekali pakai dari dashboard. Facebook Page/Messenger disertakan sebagai panduan kesiapan kanal, bukan status integrasi aktif.</p><Link to="/panduan" className="button button-light">Lihat panduan kanal <ArrowRight size={18} /></Link></div>
      <div className="phone-frame"><div className="phone-top" /><div className="chat-header"><span className="bot-avatar"><Bot /></span><div><strong>NutriShield Bot</strong><small>kanal tertaut</small></div></div><div className="bubble bot-bubble">Halo. Saya dapat membantu melihat catatan keluarga yang sudah Anda izinkan.</div><div className="bubble user-bubble">Apa yang perlu saya lengkapi?</div><div className="bubble bot-bubble">Saya akan memeriksa profil dan menjelaskan data yang masih kosong.</div></div>
    </div></section>

    <section className="section final-cta"><div className="container final-cta-box"><div><span className="eyebrow light"><Sprout size={15} />Mulai perlahan</span><h2>Satu tempat untuk catatan yang lebih tertata.</h2><p>Daftar, buat profil pertama, lalu biarkan setiap tindak lanjut tersimpan dengan jejak yang jelas.</p></div><Link to={user ? '/app' : '/register'} className="button button-terracotta button-large">{user ? 'Ke dashboard' : 'Buat akun keluarga'} <ArrowRight size={19} /></Link></div></section>
  </PublicLayout>
}

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null
  return <div className={`notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.kind === 'success' ? <Check /> : notice.kind === 'error' ? <AlertCircle /> : <Info />}<span>{notice.message}</span></div>
}

function AuthPage({ mode, user, onAuth, onLogout }: { mode: 'login' | 'register'; user: ApiRecord | null; onAuth: (user: ApiRecord) => void; onLogout: () => Promise<void> }) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true); setNotice(null)
    try {
      const raw = isRegister ? await endpoints.register(name.trim(), email.trim(), password, consent) : await endpoints.login(email.trim(), password)
      const data = asRecord(raw)
      const receivedUser = asRecord(data.user)
      onAuth(receivedUser)
      window.history.pushState({}, '', '/app')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Permintaan belum berhasil.' })
    } finally { setLoading(false) }
  }

  if (user) return <PublicLayout user={user} onLogout={onLogout}><section className="auth-section"><div className="auth-already"><Check /><h1>Anda sudah masuk</h1><p>Lanjutkan ke ruang catatan keluarga Anda.</p><Link to="/app" className="button">Buka dashboard <ArrowRight size={18} /></Link></div></section></PublicLayout>

  return <PublicLayout user={user} onLogout={onLogout}>
    <section className="auth-section">
      <div className="auth-shell">
        <div className="auth-story">
          <Eyebrow>{isRegister ? 'Mulai dengan aman' : 'Selamat datang kembali'}</Eyebrow>
          <h1>{isRegister ? 'Catatan keluarga, dalam kendali Anda.' : 'Lanjutkan catatan keluarga Anda.'}</h1>
          <p>{isRegister ? 'Buat akun untuk menyimpan profil anak, pengukuran, dan riwayat penjelasan dalam satu ruang.' : 'Masuk dengan akun yang sudah Anda buat. Kami tidak menyediakan akun demo atau kredensial bawaan.'}</p>
          <div className="auth-benefits"><div><ShieldCheck /><span><strong>Terpisah per akun</strong><small>Data hanya tersedia pada sesi keluarga Anda.</small></span></div><div><History /><span><strong>Riwayat nyata</strong><small>Aktivitas tampil setelah benar-benar diproses.</small></span></div><div><HeartHandshake /><span><strong>Batas yang jelas</strong><small>Bukan diagnosis atau pengganti tenaga kesehatan.</small></span></div></div>
        </div>
        <div className="auth-card">
          <Link to="/" className="back-link"><ArrowLeft size={17} /> Kembali ke beranda</Link>
          <div className="auth-title"><h2>{isRegister ? 'Buat akun keluarga' : 'Masuk ke NutriShield'}</h2><p>{isRegister ? 'Isi data Anda untuk membuat ruang pribadi.' : 'Gunakan email dan kata sandi Anda.'}</p></div>
          <NoticeBar notice={notice} />
          <form onSubmit={submit} className="form-stack">
            {isRegister && <label>Nama Anda<span>Digunakan untuk sapaan</span><input autoComplete="name" required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Rani" /></label>}
            <label>Alamat email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" /></label>
            <label>Kata sandi<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 10 : 1} value={password} onChange={e => setPassword(e.target.value)} placeholder={isRegister ? 'Minimal 10 karakter' : 'Kata sandi Anda'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Sembunyikan' : 'Lihat'}</button></div></label>
            {isRegister && <label className="consent-row"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>Saya menyetujui pemrosesan data yang saya masukkan untuk menyediakan catatan keluarga pada prototipe ini. NutriShield bukan layanan diagnosis atau pemberi dosis obat.</span></label>}
            <button className="button button-wide" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" /> Memproses…</> : <>{isRegister ? 'Buat akun saya' : 'Masuk'} <ArrowRight size={18} /></>}</button>
          </form>
          <p className="auth-switch">{isRegister ? 'Sudah memiliki akun?' : 'Belum punya akun?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Masuk di sini' : 'Daftar sekarang'}</Link></p>
        </div>
      </div>
    </section>
  </PublicLayout>
}

function ChannelMockup({ type }: { type: 'telegram' | 'facebook' }) {
  const telegram = type === 'telegram'
  return <div className={`channel-mockup ${telegram ? 'telegram' : 'facebook'}`}>
    <div className="mock-browser"><i /><i /><i /><span>{telegram ? 'Telegram' : 'Messenger'}</span></div>
    <div className="mock-content">
      <div className="mock-profile">{telegram ? <Send /> : <Facebook />}<div><strong>{telegram ? 'NutriShield Bot' : 'NutriShield Page'}</strong><small>{telegram ? 'Bot' : 'Messenger'}</small></div></div>
      <div className="mock-chat left">{telegram ? 'Kirim /link beserta kode dari dashboard.' : 'Integrasi belum dinyatakan aktif pada sandbox ini.'}</div>
      <div className="mock-chat right">{telegram ? '/link ••••••' : 'Baik, saya akan melihat panduan dulu.'}</div>
      <div className="mock-input"><span>Tulis pesan…</span><Send size={17} /></div>
    </div>
  </div>
}

function Guide({ user, onLogout }: { user: ApiRecord | null; onLogout: () => Promise<void> }) {
  return <PublicLayout user={user} onLogout={onLogout}>
    <section className="page-hero compact"><div className="container centered"><Eyebrow>Panduan kanal</Eyebrow><h1>Tetap terhubung melalui kanal yang akrab.</h1><p>Gunakan kode sekali pakai untuk menghubungkan Telegram. Pelajari juga kesiapan Facebook Page/Messenger tanpa menganggap integrasinya sudah aktif.</p></div></section>
    <section className="section guide-section"><div className="container guide-grid">
      <article className="guide-card">
        <div className="guide-title"><span className="channel-icon telegram-icon"><Send /></span><div><span className="tag tag-soft">Tersedia bila bot dikonfigurasi</span><h2>Telegram</h2></div></div>
        <ChannelMockup type="telegram" />
        <ol className="instruction-list"><li><span>1</span><div><strong>Buka dashboard web</strong><p>Masuk dengan akun Anda, lalu buka kartu “Hubungkan Telegram”.</p></div></li><li><span>2</span><div><strong>Buat kode tautan</strong><p>Kode bersifat singkat, sekali pakai, dan memiliki batas waktu.</p></div></li><li><span>3</span><div><strong>Kirim ke bot</strong><p>Ketik <code>/link KODE</code> di percakapan bot yang ditampilkan oleh sistem.</p></div></li><li><span>4</span><div><strong>Periksa status</strong><p>Kembali ke dashboard. Status hanya berubah jika backend mengonfirmasi tautan.</p></div></li></ol>
        <Link to={user ? '/app' : '/login'} className="button button-wide">{user ? 'Buka pengaturan Telegram' : 'Masuk untuk membuat kode'} <ArrowRight size={18} /></Link>
      </article>
      <article className="guide-card muted-guide">
        <div className="guide-title"><span className="channel-icon facebook-icon"><Facebook /></span><div><span className="tag tag-draft">Panduan kesiapan</span><h2>Facebook Page / Messenger</h2></div></div>
        <ChannelMockup type="facebook" />
        <div className="status-callout"><Info /><div><strong>Tidak ada status palsu</strong><p>Spesifikasi sandbox saat ini tidak menyediakan endpoint penghubung Facebook. Bagian ini menjelaskan alur yang diperlukan jika kanal dikembangkan nanti.</p></div></div>
        <ol className="instruction-list"><li><span>1</span><div><strong>Temukan Page resmi</strong><p>Pastikan nama, alamat Page, dan tanda identitas diterbitkan oleh pengelola resmi.</p></div></li><li><span>2</span><div><strong>Mulai dari web</strong><p>Pengaitan identitas seharusnya dimulai dari sesi web yang sudah terautentikasi.</p></div></li><li><span>3</span><div><strong>Berikan persetujuan</strong><p>Pengiriman eksternal memerlukan identitas tertaut dan persetujuan yang tercatat.</p></div></li></ol>
      </article>
    </div></section>
    <section className="safe-channel"><div className="container safe-grid"><ShieldCheck /><div><h2>Jaga kode Anda</h2><p>Jangan membagikan kode tautan di grup atau unggahan publik. NutriShield tidak meminta kata sandi lewat chat. Pengguna yang belum tertaut hanya semestinya menerima panduan umum.</p></div><Link to="/architecture" className="text-link">Lihat kebijakan kanal <ArrowRight size={17} /></Link></div></section>
  </PublicLayout>
}

const fallbackDomains = [
  { title: 'Identitas & privasi', icon: LockKeyhole, tables: ['users', 'sessions', 'child_profiles', 'consents', 'channel_identities', 'channel_link_codes'] },
  { title: 'Catatan keluarga', icon: Baby, tables: ['measurements', 'daily_logs'] },
  { title: 'Danau data pangan', icon: Database, tables: ['food_sources', 'raw_food_records', 'canonical_foods', 'food_aliases', 'food_nutrients', 'normalization_issues'] },
  { title: 'Aktivitas agen', icon: Bot, tables: ['agent_jobs', 'agent_runs', 'agent_steps', 'agent_actions', 'schedules', 'audit_events'] },
]

const fallbackStages = ['Observer', 'Data Quality', 'Safety Policy', 'Food Retriever', 'Planner', 'Family Explainer', 'Output Guard', 'Action Recorder']

function Architecture({ user, onLogout }: { user: ApiRecord | null; onLogout: () => Promise<void> }) {
  const [remote, setRemote] = useState<ApiRecord | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { endpoints.architecture().then(value => setRemote(asRecord(value))).catch(() => setError(true)) }, [])
  const remoteStages = remote ? listFrom(asRecord(remote.agent), ['stages']) : []
  const stages = remoteStages.length ? remoteStages.map(item => valueFrom(item, ['name', 'stage', 'title'])) : fallbackStages
  return <PublicLayout user={user} onLogout={onLogout}>
    <section className="page-hero architecture-hero"><div className="container architecture-intro"><div><Eyebrow>Arsitektur yang dapat diperiksa</Eyebrow><h1>Dari data mentah ke jawaban yang bertanggung jawab.</h1></div><p>Setiap lapisan memiliki tugas jelas. Jejak proses berasal dari aktivitas sebenarnya—tanpa latensi, bukti, atau status buatan.</p></div></section>
    <section className="section architecture-section"><div className="container">
      {error && <div className="inline-info"><Info /> Metadata langsung belum tersedia; diagram berikut menjelaskan rancangan yang ditetapkan spesifikasi.</div>}
      <div className="section-heading"><Eyebrow>Alur data pangan</Eyebrow><h2>Broad in, quality-gated out.</h2><p>Semua catatan sumber tetap dapat dicari, tetapi hanya entitas yang memenuhi aturan eksplisit dapat dipakai dalam perencanaan.</p></div>
      <div className="pipeline" aria-label="Alur normalisasi data pangan"><div><span>01</span><Database /><strong>Raw records</strong><small>Payload sumber disimpan utuh</small></div><ArrowRight /><div><span>02</span><ClipboardCheck /><strong>Normalisasi</strong><small>Nama, kode, tipe, dan isu</small></div><ArrowRight /><div><span>03</span><TableProperties /><strong>Canonical foods</strong><small>Entitas digabung konservatif</small></div><ArrowRight /><div><span>04</span><ShieldCheck /><strong>Eligibility gate</strong><small>Discovery, comparison, planning</small></div></div>
      <div className="domain-grid">{fallbackDomains.map(domain => { const Icon = domain.icon; return <article className="domain-card" key={domain.title}><div><span className="feature-icon"><Icon /></span><h3>{domain.title}</h3></div><div className="table-list">{domain.tables.map(table => <code key={table}>{table}</code>)}</div></article> })}</div>
    </div></section>
    <section className="section agent-section"><div className="container"><div className="section-heading split-heading"><div><Eyebrow>Koordinator berbasis peristiwa</Eyebrow><h2>Delapan tahap, satu jejak audit.</h2></div><p>Alat yang dipanggil dibatasi. Agen tidak dapat menjalankan shell atau Python bebas, dan kebijakan keselamatan dapat menghentikan alur.</p></div><div className="agent-flow">{stages.map((stage, index) => <div className="agent-stage" key={`${stage}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong>{index < stages.length - 1 && <ArrowRight />}</div>)}</div><details className="technical-details"><summary><span><TableProperties /> Lihat data yang dicatat pada setiap run</span><ChevronDown /></summary><div><p>ID korelasi, pemicu, child ID, status, model, versi kebijakan, versi sumber, waktu mulai/selesai, galat, dan output terstruktur.</p><p>Setiap langkah menyimpan nama alat, status, waktu nyata, input JSON, dan output JSON. Informasi sensitif tidak dipublikasikan pada endpoint arsitektur.</p></div></details></div></section>
    <section className="section principles-section"><div className="container principles-grid"><article><AlertCircle /><h3>Batas keselamatan</h3><p>Agen mengenali bahasa darurat, alergi, batas usia, dan data yang tidak diketahui. Sistem memberi batas informasi, bukan kepastian klinis.</p></article><article><FileCheck2 /><h3>Asal-usul data</h3><p>Skor kelengkapan dan provenance terpisah. Nilai kosong berarti tidak diketahui, tidak pernah otomatis dianggap nol.</p></article><article><Clock3 /><h3>Otomasi sandbox</h3><p>Pemicu dan penjadwal hanya bekerja selama server sandbox ini berjalan. Ini bukan layanan pemantauan terus-menerus.</p></article></div></section>
  </PublicLayout>
}

function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><span><Icon /></span><h3>{title}</h3><p>{children}</p>{action}</div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', close); document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', close); document.body.classList.remove('modal-open') }
  }, [onClose])
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Tutup"><X /></button></div>{children}</div></div>
}

function ChildForm({ onSaved, onClose }: { onSaved: () => Promise<void>; onClose?: () => void }) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
  const [allergies, setAllergies] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setNotice(null)
    try {
      await endpoints.createChild({ name: name.trim(), birth_date: birthDate, sex, allergies: allergies.trim() })
      setNotice({ kind: 'success', message: 'Profil anak tersimpan. Tindak lanjut onboarding akan diproses dan dicatat.' })
      await onSaved()
      window.setTimeout(() => void onSaved(), 1500)
      setTimeout(() => onClose?.(), 650)
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Profil belum dapat disimpan.' }) }
    finally { setLoading(false) }
  }
  return <form className="form-stack" onSubmit={submit}><NoticeBar notice={notice} /><label>Nama panggilan anak<input required minLength={1} value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Alya" /></label><div className="form-row"><label>Tanggal lahir<input required type="date" max={new Date().toISOString().slice(0, 10)} value={birthDate} onChange={e => setBirthDate(e.target.value)} /></label><label>Jenis kelamin<select required value={sex} onChange={e => setSex(e.target.value)}><option value="">Pilih</option><option value="female">Perempuan</option><option value="male">Laki-laki</option><option value="unspecified">Tidak disebutkan</option></select></label></div><label>Informasi alergi <span>Opsional, tulis jika sudah diketahui</span><textarea value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Contoh: alergi telur, atau kosongkan" rows={3} /></label><div className="form-note"><Info /> Informasi ini membantu pemeriksaan kebijakan. NutriShield tidak menilai atau mendiagnosis alergi.</div><button className="button button-wide" disabled={loading}>{loading ? <><LoaderCircle className="spin" /> Menyimpan…</> : <>Simpan profil <ArrowRight size={18} /></>}</button></form>
}

function MeasurementForm({ children, onSaved, onClose }: { children: ApiRecord[]; onSaved: () => Promise<void>; onClose: () => void }) {
  const [childId, setChildId] = useState(valueFrom(children[0] || {}, ['id'], ''))
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [head, setHead] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setNotice(null)
    try {
      await endpoints.createMeasurement({ child_id: childId, measured_at: date, weight_kg: weight ? Number(weight) : null, height_cm: height ? Number(height) : null, head_circumference_cm: head ? Number(head) : null, notes: notes.trim() })
      setNotice({ kind: 'success', message: 'Pengukuran tersimpan. Tindak lanjut akan muncul setelah diproses.' })
      await onSaved(); setTimeout(onClose, 650)
      window.setTimeout(() => void onSaved(), 1500)
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Pengukuran belum dapat disimpan.' }) }
    finally { setLoading(false) }
  }
  return <form className="form-stack" onSubmit={submit}><NoticeBar notice={notice} /><label>Anak<select required value={childId} onChange={e => setChildId(e.target.value)}>{children.map(child => <option key={valueFrom(child, ['id'])} value={valueFrom(child, ['id'])}>{valueFrom(child, ['name', 'nickname'])}</option>)}</select></label><label>Tanggal pengukuran<input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} /></label><div className="measurement-grid"><label>Berat badan <span>kg</span><input type="number" inputMode="decimal" min="0.1" max="300" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0,00" /></label><label>Tinggi badan <span>cm</span><input type="number" inputMode="decimal" min="10" max="250" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="0,0" /></label><label>Lingkar kepala <span>cm · opsional</span><input type="number" inputMode="decimal" min="5" max="100" step="0.1" value={head} onChange={e => setHead(e.target.value)} placeholder="0,0" /></label></div><label>Catatan <span>Opsional</span><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: diukur pagi hari" /></label><div className="form-note"><Info /> Masukkan hasil dari alat ukur apa adanya. Sistem menyimpannya sebagai catatan, bukan penilaian klinis.</div><button className="button button-wide" disabled={loading || (!weight && !height && !head)}>{loading ? <><LoaderCircle className="spin" /> Menyimpan…</> : <>Simpan pengukuran <Check size={18} /></>}</button></form>
}

function AssistantPanel({ children, onNewRun }: { children: ApiRecord[]; onNewRun: () => Promise<void> }) {
  const [message, setMessage] = useState('')
  const [childId, setChildId] = useState(valueFrom(children[0] || {}, ['id'], ''))
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiRecord | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const steps = response ? listFrom(response, ['steps']) : []
  const evidence = response ? listFrom(response, ['evidence']) : []
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!message.trim()) return
    setLoading(true); setNotice(null); setResponse(null)
    try {
      const raw = await endpoints.chat({ child_id: childId || null, message: message.trim(), channel: 'web' })
      setResponse(asRecord(raw)); await onNewRun()
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Pertanyaan belum dapat diproses.' }) }
    finally { setLoading(false) }
  }
  return <div className="assistant-card">
    <div className="card-heading"><span className="feature-icon"><Sparkles /></span><div><span className="overline">Pendamping keluarga</span><h2>Tanyakan hal praktis</h2></div><span className="tag tag-soft"><ShieldCheck size={14} /> Alur tercatat</span></div>
    <p className="card-intro">Jawaban berasal dari pipeline agen yang sama dengan kanal tertaut. Jika model AI tidak tersedia, server dapat memberi penjelasan cadangan yang deterministik.</p>
    {children.length === 0 ? <EmptyState icon={Baby} title="Profil anak diperlukan">Buat profil terlebih dahulu agar pertanyaan dapat menggunakan konteks keluarga.</EmptyState> : <form onSubmit={submit} className="ask-form"><div className="ask-context"><label htmlFor="assistant-child">Tentang</label><select id="assistant-child" value={childId} onChange={e => setChildId(e.target.value)}>{children.map(child => <option key={valueFrom(child, ['id'])} value={valueFrom(child, ['id'])}>{valueFrom(child, ['name', 'nickname'])}</option>)}</select></div><label className="ask-box"><span className="sr-only">Pertanyaan Anda</span><textarea required maxLength={1000} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Contoh: Data apa yang masih perlu saya lengkapi untuk catatan bulan ini?" /><button aria-label="Kirim pertanyaan" disabled={loading || !message.trim()}>{loading ? <LoaderCircle className="spin" /> : <Send />}</button></label><div className="suggestions"><span>Coba tanya:</span>{['Apa data yang belum lengkap?', 'Bantu cari pangan sederhana'].map(prompt => <button type="button" key={prompt} onClick={() => setMessage(prompt)}>{prompt}</button>)}</div></form>}
    <NoticeBar notice={notice} />
    {loading && <div className="response-loading"><LoaderCircle className="spin" /><div><strong>Memproses melalui pipeline agen…</strong><span>Hasil hanya tampil setelah server merespons.</span></div></div>}
    {response && <div className="assistant-response" aria-live="polite"><div className="response-head"><span><Bot /></span><div><strong>Penjelasan NutriShield</strong><small>{formatDate(new Date().toISOString(), true)}</small></div></div><p>{valueFrom(response, ['answer', 'message', 'response'], 'Server menyelesaikan proses tanpa teks jawaban.')}</p><div className="response-meta">{response.policy !== undefined && <span><ShieldCheck /> Kebijakan: {typeof response.policy === 'object' ? valueFrom(asRecord(response.policy), ['status', 'result', 'version']) : text(response.policy)}</span>}{evidence.length > 0 && <span><FileCheck2 /> {evidence.length} rujukan data</span>}</div>{(steps.length > 0 || evidence.length > 0 || response.run !== undefined) && <details className="trace-details"><summary>Periksa jejak teknis <ChevronDown /></summary><div>{steps.length > 0 && <ol>{steps.map((step, index) => <li key={`${valueFrom(step, ['id', 'name'], String(index))}-${index}`}><span>{index + 1}</span><div><strong>{valueFrom(step, ['name', 'stage', 'tool_name'], `Langkah ${index + 1}`)}</strong><small>{statusInfo(step.status).label}{step.started_at ? ` · ${formatDate(step.started_at, true)}` : ''}</small></div></li>)}</ol>}{evidence.length > 0 && <div className="evidence-list"><strong>Bukti yang dikembalikan</strong>{evidence.map((item, index) => <p key={index}>{valueFrom(item, ['name', 'title', 'source', 'label'], `Sumber ${index + 1}`)}</p>)}</div>}<pre>{JSON.stringify(response.run ?? {}, null, 2)}</pre></div></details>}</div>}
    <p className="assistant-disclaimer"><Info /> Untuk keadaan darurat atau kekhawatiran kesehatan, hubungi tenaga kesehatan. Jawaban ini bukan diagnosis.</p>
  </div>
}

function Timeline({ runs, loading }: { runs: ApiRecord[]; loading: boolean }) {
  return <section className="dashboard-card timeline-card"><div className="card-heading compact-heading"><span className="feature-icon"><History /></span><div><span className="overline">Jejak aktivitas</span><h2>Aktivitas agen</h2></div></div>{loading ? <div className="skeleton-stack"><i /><i /><i /></div> : runs.length === 0 ? <EmptyState icon={History} title="Belum ada aktivitas">Aktivitas nyata akan muncul setelah profil, pengukuran, atau pertanyaan diproses.</EmptyState> : <div className="timeline">{runs.map((run, index) => { const status = statusInfo(run.status); const steps = listFrom(run, ['steps']); return <div className="timeline-item" key={`${valueFrom(run, ['id', 'correlation_id'], String(index))}-${index}`}><span className={`timeline-dot ${status.tone}`} /> <div className="timeline-content"><div className="timeline-top"><strong>{valueFrom(run, ['trigger', 'job_type', 'type'], 'Aktivitas agen').replace(/_/g, ' ')}</strong><span className={`tag tag-${status.tone}`}>{status.label}</span></div><p>{valueFrom(run, ['summary', 'answer', 'error'], 'Rincian tersedia pada rekaman proses.')}</p><small>{formatDate(run.created_at ?? run.started_at, true)}{Boolean(run.correlation_id) ? ` · ID ${text(run.correlation_id).slice(0, 10)}` : ''}</small>{(steps.length > 0 || Boolean(run.model) || Boolean(run.policy_version)) && <details><summary>Detail teknis <ChevronDown /></summary><div className="run-details">{Boolean(run.model) && <span>Model <strong>{text(run.model)}</strong></span>}{Boolean(run.policy_version) && <span>Kebijakan <strong>{text(run.policy_version)}</strong></span>}{steps.length > 0 && <span>Langkah <strong>{steps.length}</strong></span>}</div></details>}</div></div>})}</div>}</section>
}

function TelegramPanel({ telegram, onRefresh }: { telegram: ApiRecord; onRefresh: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState<ApiRecord | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const linked = booleanValue(telegram.linked) === true || text(telegram.status, '').toLowerCase() === 'linked'
  const configured = booleanValue(telegram.configured)
  async function generate() {
    setLoading(true); setNotice(null)
    try { setCode(asRecord(await endpoints.telegramCode())); await onRefresh() }
    catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Kode belum dapat dibuat.' }) }
    finally { setLoading(false) }
  }
  async function unlink() {
    setLoading(true); setNotice(null)
    try {
      await endpoints.telegramUnlink(); setCode(null)
      setNotice({ kind: 'success', message: 'Tautan Telegram dan persetujuan pengiriman telah dicabut.' })
      await onRefresh()
    } catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Telegram belum dapat diputuskan.' }) }
    finally { setLoading(false) }
  }
  const codeText = code ? valueFrom(code, ['code', 'link_code']) : ''
  const identity = asRecord(telegram.identity)
  return <section className="dashboard-card telegram-card"><div className="card-heading compact-heading"><span className="feature-icon telegram-bg"><Send /></span><div><span className="overline">Kanal pesan</span><h2>Telegram</h2></div><span className={`tag ${linked ? 'tag-success' : configured === false ? 'tag-draft' : 'tag-neutral'}`}>{linked ? 'Terhubung' : configured === false ? 'Belum dikonfigurasi' : 'Belum terhubung'}</span></div><p>{linked ? `Akun tertaut${identity.display_name ? ` atas nama ${text(identity.display_name)}` : ''}. Pesan menggunakan profil dan pipeline yang sama.` : configured === false ? 'Bot belum dikonfigurasi pada server sandbox ini. Minta pengelola menambahkan token baru sebelum membuat kode tautan.' : 'Buat kode singkat, lalu kirim melalui perintah /link di bot yang dikonfigurasi.'}</p><NoticeBar notice={notice} />{codeText && <div className="link-code"><span>Kode sekali pakai</span><strong>{codeText}</strong><small>{code?.expires_at ? `Berlaku hingga ${formatDate(code.expires_at, true)}` : 'Gunakan segera; kode memiliki masa berlaku terbatas.'}</small></div>}{!linked && configured !== false && <button className="button button-secondary button-wide" onClick={() => void generate()} disabled={loading}>{loading ? <><LoaderCircle className="spin" /> Membuat…</> : <><Link2 size={18} /> Buat kode tautan</>}</button>}{linked && <button className="button button-secondary button-wide" onClick={() => void unlink()} disabled={loading}><X size={18} /> Putuskan Telegram</button>}<Link to="/panduan" className="text-link small-link">Buka panduan Telegram <ArrowRight size={16} /></Link></section>
}

function FoodPanel({ foodStats }: { foodStats: ApiRecord }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<ApiRecord[]>([])
  const [notice, setNotice] = useState<Notice>(null)
  async function searchFood(event: FormEvent) {
    event.preventDefault(); if (query.trim().length < 2) return
    setLoading(true); setSearched(true); setNotice(null)
    try { const data = await endpoints.foods(query.trim()); const record = asRecord(data); setResults(Array.isArray(data) ? asList(data) : listFrom(record, ['items', 'results', 'foods'])) }
    catch (error) { setResults([]); setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Pencarian belum berhasil.' }) }
    finally { setLoading(false) }
  }
  const total = numberValue(foodStats.total_records ?? foodStats.raw_records ?? foodStats.total)
  const canonical = numberValue(foodStats.canonical_records ?? foodStats.canonical_foods ?? foodStats.canonical)
  const eligible = numberValue(foodStats.planning_eligible ?? foodStats.planner_eligible ?? foodStats.eligible_for_planning ?? foodStats.eligible)
  return <section className="dashboard-card food-card"><div className="card-heading compact-heading"><span className="feature-icon food-bg"><Leaf /></span><div><span className="overline">Danau data pangan</span><h2>Cari informasi pangan</h2></div></div><form className="food-search" onSubmit={searchFood}><Search /><input aria-label="Cari pangan" value={query} onChange={e => setQuery(e.target.value)} placeholder="Contoh: tempe, beras merah…" /><button disabled={loading || query.trim().length < 2}>{loading ? <LoaderCircle className="spin" /> : 'Cari'}</button></form><NoticeBar notice={notice} />{searched && !loading && (results.length ? <div className="food-results">{results.map((food, index) => { const planning = booleanValue(food.planning_eligible); const comparison = booleanValue(food.comparison_eligible); const label = planning ? 'Layak untuk perencanaan' : comparison ? 'Data perbandingan' : 'Hanya penelusuran'; const tone = planning ? 'tag-success' : comparison ? 'tag-soft' : 'tag-draft'; return <article key={`${valueFrom(food, ['id', 'name'], String(index))}-${index}`}><div><strong>{valueFrom(food, ['name', 'canonical_name', 'product_name'])}</strong><small>{valueFrom(food, ['source_name', 'source', 'record_type'], 'Sumber tidak ditampilkan')}</small></div><span className={`tag ${tone}`}>{label}</span><details><summary>Lihat mutu data <ChevronDown /></summary><div className="food-detail"><span>Kelengkapan <strong>{valueFrom(food, ['completeness_score', 'completeness'], 'Belum tersedia')}</strong></span><span>Verifikasi <strong>{valueFrom(food, ['verification_status', 'verified'], 'Belum tersedia')}</strong></span><span>Provenance <strong>{valueFrom(food, ['provenance_score', 'provenance'], 'Belum tersedia')}</strong></span></div></details></article>})}</div> : <EmptyState icon={Search} title="Tidak ada hasil">Coba istilah yang lebih singkat atau nama pangan lain.</EmptyState>)}<div className="quality-summary"><div className="quality-title"><div><strong>Ringkasan kualitas data</strong><small>Angka ditampilkan hanya bila API menyediakannya.</small></div><Link to="/architecture" className="icon-button" aria-label="Pelajari arsitektur"><ArrowRight /></Link></div><div className="quality-stats"><div><strong>{total === null ? '—' : total.toLocaleString('id-ID')}</strong><span>Catatan sumber</span></div><div><strong>{canonical === null ? '—' : canonical.toLocaleString('id-ID')}</strong><span>Pangan kanonikal</span></div><div><strong>{eligible === null ? '—' : eligible.toLocaleString('id-ID')}</strong><span>Layak direncanakan</span></div></div><p><Info /> Nilai 0 berarti belum ada record dengan gizi eksplisit yang lolos gate perencanaan—bukan bahwa datanya hilang.</p></div></section>
}

function Dashboard({ user, onUser, onLogout }: { user: ApiRecord | null; onUser: (user: ApiRecord | null) => void; onLogout: () => Promise<void> }) {
  const [data, setData] = useState<ApiRecord>({})
  const [runs, setRuns] = useState<ApiRecord[]>([])
  const [telegram, setTelegram] = useState<ApiRecord>({})
  const [foodStats, setFoodStats] = useState<ApiRecord>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [childModal, setChildModal] = useState(false)
  const [measureModal, setMeasureModal] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [dashboardRaw, runsRaw, telegramRaw, statsRaw] = await Promise.all([
        endpoints.dashboard(), endpoints.agentRuns(), endpoints.telegramStatus(), endpoints.publicFoodStats(),
      ])
      const dashboard = asRecord(dashboardRaw); setData(dashboard)
      const fetchedUser = asRecord(dashboard.user); if (Object.keys(fetchedUser).length) onUser(fetchedUser)
      const runsRecord = asRecord(runsRaw)
      const dashboardRuns = listFrom(dashboard, ['latest_runs', 'runs'])
      setRuns(Array.isArray(runsRaw) ? asList(runsRaw) : listFrom(runsRecord, ['runs', 'items']).length ? listFrom(runsRecord, ['runs', 'items']) : dashboardRuns)
      setTelegram(asRecord(telegramRaw)); setFoodStats(asRecord(statsRaw))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUser(null)
      else setError(err instanceof Error ? err.message : 'Dashboard belum dapat dimuat.')
    } finally { setLoading(false) }
  }, [onUser])
  useEffect(() => { void load() }, [load])

  const children = listFrom(data, ['children', 'child_profiles'])
  const activeChild = children[0]
  const firstName = valueFrom(user || asRecord(data.user), ['display_name', 'name', 'full_name', 'email'], 'Keluarga').split(/\s|@/)[0]

  if (!user && !loading) return <div className="auth-required"><Brand /><div><LockKeyhole /><h1>Masuk untuk membuka dashboard</h1><p>Dashboard berisi data keluarga dan hanya tersedia untuk sesi yang terautentikasi.</p><Link to="/login" className="button">Masuk ke akun <ArrowRight size={18} /></Link><Link to="/" className="text-link">Kembali ke beranda</Link></div></div>

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}><div className="sidebar-top"><Brand inverse /><button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Tutup menu"><X /></button></div><nav aria-label="Navigasi dashboard"><a href="#ringkasan" className="active"><LayoutDashboard /> Ringkasan</a><a href="#pendamping"><Sparkles /> Tanya pendamping</a><a href="#aktivitas"><History /> Aktivitas agen</a><a href="#pangan"><Leaf /> Data pangan</a><a href="#telegram"><Send /> Telegram</a></nav><div className="sidebar-bottom"><Link to="/architecture"><CircleHelp /> Cara sistem bekerja</Link><button onClick={() => void onLogout()}><LogOut /> Keluar</button><div className="sandbox-chip"><span /> Sandbox lokal</div></div></aside>
    {mobileNav && <button className="sidebar-scrim" aria-label="Tutup menu" onClick={() => setMobileNav(false)} />}
    <main className="dashboard-main">
      <header className="dashboard-header"><button className="icon-button dashboard-menu" onClick={() => setMobileNav(true)} aria-label="Buka menu"><Menu /></button><div><span className="overline">Ruang keluarga</span><strong>NutriShield</strong></div><div className="user-pill"><span>{firstName.charAt(0).toUpperCase()}</span><div><strong>{firstName}</strong><small>Sesi aktif</small></div></div></header>
      <div className="dashboard-content">
        {error && <div className="error-banner" role="alert"><AlertCircle /><span>{error}</span><button onClick={() => void load()}>Coba lagi</button></div>}
        <section className="welcome-row" id="ringkasan"><div><span className="eyebrow"><Sprout size={15} />Catatan keluarga</span><h1>Selamat datang, {firstName}.</h1><p>{children.length ? `Lanjutkan catatan ${valueFrom(activeChild, ['name', 'nickname'])} atau tanyakan hal yang ingin Anda pahami.` : 'Mulai dengan membuat profil anak. Hanya isi informasi yang Anda ketahui.'}</p></div><div className="welcome-actions"><button className="button button-secondary" onClick={() => setChildModal(true)}><Plus size={18} /> Profil anak</button><button className="button" disabled={children.length === 0} onClick={() => setMeasureModal(true)}><Ruler size={18} /> Catat pengukuran</button></div></section>
        {loading ? <div className="dashboard-loading"><LoaderCircle className="spin" /><span>Memuat data keluarga…</span></div> : children.length === 0 ? <section className="onboarding-card"><div className="onboarding-copy"><span className="step-pill">Langkah 1 dari 2</span><h2>Buat profil pertama</h2><p>Profil membantu sistem menempatkan catatan dan pertanyaan pada konteks yang tepat.</p><ul className="check-list"><li><Check /> Nama panggilan dan tanggal lahir</li><li><Check /> Informasi hanya yang Anda ketahui</li><li><Check /> Tindak lanjut tercatat otomatis</li></ul></div><div className="onboarding-form"><ChildForm onSaved={load} /></div></section> : <div className="snapshot-grid"><article className="snapshot child-snapshot"><div className="snapshot-top"><span className="child-avatar large"><Baby /></span><div><span>Profil aktif</span><h2>{valueFrom(activeChild, ['name', 'nickname'])}</h2></div><span className="tag tag-success">Tersimpan</span></div><div className="snapshot-details"><div><span>Tanggal lahir</span><strong>{formatDate(activeChild.birth_date)}</strong></div><div><span>Jenis kelamin</span><strong>{valueFrom(activeChild, ['sex', 'gender'], 'Belum diisi')}</strong></div></div><button className="text-link" onClick={() => setChildModal(true)}><Plus size={16} /> Tambah profil anak</button></article><article className="snapshot measurement-snapshot"><div className="snapshot-top"><span className="feature-icon"><Ruler /></span><div><span>Pengukuran terakhir</span><h2>{valueFrom(asRecord(activeChild.latest_measurement), ['measured_at', 'measurement_date'], 'Belum ada')}</h2></div></div>{Object.keys(asRecord(activeChild.latest_measurement)).length ? <div className="metric-row"><div><Weight /><span><strong>{valueFrom(asRecord(activeChild.latest_measurement), ['weight_kg'])} kg</strong><small>Berat tercatat</small></span></div><div><Ruler /><span><strong>{valueFrom(asRecord(activeChild.latest_measurement), ['height_cm'])} cm</strong><small>Tinggi tercatat</small></span></div></div> : <p className="muted-copy">Belum ada pengukuran yang dikembalikan oleh API.</p>}<button className="button button-secondary button-wide" onClick={() => setMeasureModal(true)}><Plus size={17} /> Tambah pengukuran</button></article></div>}
        <div className="dashboard-grid-primary"><div id="pendamping"><AssistantPanel children={children} onNewRun={load} /></div><div id="aktivitas"><Timeline runs={runs} loading={loading} /></div></div>
        <div className="dashboard-grid-secondary"><div id="pangan"><FoodPanel foodStats={asRecord(data.food_stats && typeof data.food_stats === 'object' ? data.food_stats : foodStats)} /></div><div className="side-stack"><div id="telegram"><TelegramPanel telegram={Object.keys(telegram).length ? telegram : asRecord(data.telegram)} onRefresh={load} /></div><section className="dashboard-card sandbox-card"><div className="card-heading compact-heading"><span className="feature-icon"><Clock3 /></span><div><span className="overline">Batas prototipe</span><h2>Server sandbox</h2></div></div><p>Otomasi terjadwal hanya berjalan selama server ini aktif. Tidak ada janji pemantauan 24 jam.</p><Link to="/architecture" className="text-link small-link">Pelajari batas sistem <ArrowRight size={16} /></Link></section></div></div>
      </div>
    </main>
    {childModal && <Modal title="Tambah profil anak" onClose={() => setChildModal(false)}><ChildForm onSaved={load} onClose={() => setChildModal(false)} /></Modal>}
    {measureModal && <Modal title="Catat pengukuran" onClose={() => setMeasureModal(false)}><MeasurementForm children={children} onSaved={load} onClose={() => setMeasureModal(false)} /></Modal>}
  </div>
}

export default function App() {
  const [route, setRoute] = useState<Route>(currentRoute())
  const [user, setUser] = useState<ApiRecord | null>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    const navigate = () => setRoute(currentRoute())
    window.addEventListener('popstate', navigate)
    endpoints.me().then(raw => { const data = asRecord(raw); const found = asRecord(data.user); setUser(Object.keys(found).length ? found : Object.keys(data).length ? data : null) }).catch(() => setUser(null)).finally(() => setChecking(false))
    return () => window.removeEventListener('popstate', navigate)
  }, [])
  const logout = useCallback(async () => {
    try { await endpoints.logout() } catch { /* Session can still be cleared locally. */ }
    setUser(null); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])
  const stableSetUser = useCallback((next: ApiRecord | null) => setUser(next), [])
  const page = useMemo(() => {
    if (route === '/login') return <AuthPage mode="login" user={user} onAuth={setUser} onLogout={logout} />
    if (route === '/register') return <AuthPage mode="register" user={user} onAuth={setUser} onLogout={logout} />
    if (route === '/panduan') return <Guide user={user} onLogout={logout} />
    if (route === '/architecture') return <Architecture user={user} onLogout={logout} />
    if (route === '/app') return <Dashboard user={user} onUser={stableSetUser} onLogout={logout} />
    return <Landing user={user} onLogout={logout} />
  }, [route, user, logout, stableSetUser])
  return <>{checking && <div className="top-loading" aria-label="Memeriksa sesi" />}{page}</>
}
