import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

type View = 'Overview' | 'Customers' | 'Enquiries' | 'Quotations' | 'Sales Orders' | 'Inventory' | 'Dispatches' | 'Challans'
type CustomerStatus = 'Active' | 'Lead' | 'Inactive'

type Customer = {
  id: number
  name: string
  business: string
  phone: string
  email: string
  type: string
  status: CustomerStatus
  followUp: string
  initials: string
  color: string
}

type Product = {
  id: number
  name: string
  sku: string
  category: string
  stock: number
  minStock: number
  price: number
  location: string
}

type Challan = {
  id: string
  customer: string
  date: string
  quantity: number
  status: 'Confirmed' | 'Draft'
  amount: number
}

type WorkflowRecord = {
  id: string
  customer: string
  date: string
  value: number
  status: string
  detail: string
}

const initialCustomers: Customer[] = [
  { id: 1, name: 'Aarav Mehta', business: 'Mehta Retail Mart', phone: '+91 98204 11223', email: 'aarav@mehtamart.in', type: 'Retail', status: 'Active', followUp: 'Today', initials: 'AM', color: 'teal' },
  { id: 2, name: 'Priya Shah', business: 'Shah Distributors', phone: '+91 98765 44018', email: 'priya@shahdist.com', type: 'Distributor', status: 'Lead', followUp: 'Tomorrow', initials: 'PS', color: 'yellow' },
  { id: 3, name: 'Rohan Kapoor', business: 'Kapoor Wholesale', phone: '+91 98190 33902', email: 'rohan@kapoorwholesale.in', type: 'Wholesale', status: 'Active', followUp: '14 Sep', initials: 'RK', color: 'coral' },
  { id: 4, name: 'Nisha Verma', business: 'Verma Supermarket', phone: '+91 99872 48110', email: 'nisha@vermasupermarket.in', type: 'Retail', status: 'Inactive', followUp: '22 Sep', initials: 'NV', color: 'blue' },
]

const initialProducts: Product[] = [
  { id: 1, name: 'Classic Basmati Rice 5kg', sku: 'RCE-5001', category: 'Staples', stock: 248, minStock: 80, price: 499, location: 'A-01 / Rack 4' },
  { id: 2, name: 'Sunflower Cooking Oil 1L', sku: 'OIL-1008', category: 'FMCG', stock: 32, minStock: 50, price: 156, location: 'B-02 / Rack 1' },
  { id: 3, name: 'Toor Dal Premium 1kg', sku: 'DAL-2012', category: 'Staples', stock: 86, minStock: 40, price: 138, location: 'A-02 / Rack 2' },
  { id: 4, name: 'Green Tea Classic 250g', sku: 'TEA-3090', category: 'Beverages', stock: 14, minStock: 30, price: 220, location: 'C-01 / Rack 3' },
  { id: 5, name: 'Wheat Flour 10kg', sku: 'FLR-4014', category: 'Staples', stock: 121, minStock: 45, price: 510, location: 'A-03 / Rack 5' },
]

const initialChallans: Challan[] = [
  { id: 'CH-2024-0089', customer: 'Mehta Retail Mart', date: '11 Sep 2024', quantity: 38, status: 'Confirmed', amount: 18420 },
  { id: 'CH-2024-0088', customer: 'Shah Distributors', date: '10 Sep 2024', quantity: 120, status: 'Confirmed', amount: 42750 },
  { id: 'CH-2024-0087', customer: 'Kapoor Wholesale', date: '09 Sep 2024', quantity: 64, status: 'Draft', amount: 21980 },
]

const initialEnquiries: WorkflowRecord[] = [
  { id: 'ENQ-2024-0148', customer: 'Mehta Retail Mart', date: '11 Sep 2024', value: 38400, status: 'New', detail: '3 products · Required 20 Sep' },
  { id: 'ENQ-2024-0147', customer: 'Shah Distributors', date: '10 Sep 2024', value: 92750, status: 'Quoted', detail: '8 products · Required 18 Sep' },
  { id: 'ENQ-2024-0146', customer: 'Kapoor Wholesale', date: '09 Sep 2024', value: 21980, status: 'Won', detail: '4 products · Required 16 Sep' },
]

const initialQuotations: WorkflowRecord[] = [
  { id: 'QUO-2024-0091', customer: 'Shah Distributors', date: '10 Sep 2024', value: 92750, status: 'Sent', detail: 'Valid until 25 Sep 2024' },
  { id: 'QUO-2024-0090', customer: 'Kapoor Wholesale', date: '09 Sep 2024', value: 21980, status: 'Accepted', detail: '4 products · Ready for order' },
]

const initialOrders: WorkflowRecord[] = [
  { id: 'SO-2024-0068', customer: 'Kapoor Wholesale', date: '09 Sep 2024', value: 21980, status: 'Pending', detail: 'Reserved 64 of 64 units' },
  { id: 'SO-2024-0067', customer: 'Mehta Retail Mart', date: '08 Sep 2024', value: 18420, status: 'Confirmed', detail: 'Dispatch due 14 Sep 2024' },
]

const initialDispatches: WorkflowRecord[] = [
  { id: 'DSP-2024-0042', customer: 'Mehta Retail Mart', date: '11 Sep 2024', value: 18420, status: 'Ready', detail: 'Vehicle pending · 38 units' },
  { id: 'DSP-2024-0041', customer: 'Shah Distributors', date: '10 Sep 2024', value: 42750, status: 'Dispatched', detail: 'MH 12 AB 4401 · 120 units' },
]

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [view, setView] = useState<View>('Overview')
  const [customers, setCustomers] = useState(initialCustomers)
  const [products, setProducts] = useState(initialProducts)
  const [challans, setChallans] = useState(initialChallans)
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [quotations, setQuotations] = useState(initialQuotations)
  const [orders, setOrders] = useState(initialOrders)
  const [dispatches, setDispatches] = useState(initialDispatches)
  const [role, setRole] = useState<'ADMIN' | 'SALES_USER'>('ADMIN')
  const [search, setSearch] = useState('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [toast, setToast] = useState('')

  const filteredCustomers = useMemo(() => customers.filter((customer) =>
    `${customer.name} ${customer.business} ${customer.type}`.toLowerCase().includes(search.toLowerCase()),
  ), [customers, search])
  const lowStock = products.filter((product) => product.stock < product.minStock)

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const addCustomer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name'))
    const business = String(form.get('business'))
    setCustomers((current) => [...current, {
      id: Date.now(), name, business, phone: String(form.get('phone')), email: String(form.get('email')),
      type: String(form.get('type')), status: 'Lead', followUp: 'Not set', initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), color: 'teal',
    }])
    setShowCustomerForm(false)
    notify('Customer added to your CRM')
  }

  const confirmChallan = () => {
    const next = challans.map((challan, index) => index === 2 ? { ...challan, status: 'Confirmed' as const } : challan)
    setChallans(next)
    setProducts((current) => current.map((product) => product.id === 2 ? { ...product, stock: product.stock - 8 } : product))
    notify('Challan confirmed and stock updated')
  }

  const advanceRecord = async (resource: string, collection: WorkflowRecord[], setter: React.Dispatch<React.SetStateAction<WorkflowRecord[]>>, id: string, nextStatus: string, message: string) => {
    if (API_URL) {
      const response = await fetch(`${API_URL}/api/workflow/${resource}/${id}/advance`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('northstar_token') || ''}` } })
      if (!response.ok) {
        notify('This action is not available for your role')
        return
      }
    }
    setter(collection.map((record) => record.id === id ? { ...record, status: nextStatus } : record))
    notify(message)
  }

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim().toLowerCase()
    const password = String(form.get('password'))
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!response.ok) throw new Error('Invalid email or password')
      const result = await response.json() as { token: string; user: { role: 'ADMIN' | 'SALES_USER' } }
      localStorage.setItem('northstar_token', result.token)
      setRole(result.user.role)
      setAuthenticated(true)
      setLoginError('')
      return
    } catch {
      if (API_URL) {
        setLoginError('Unable to sign in. Check your credentials or API connection.')
        return
      }
    }
    if (email === 'admin@northstar.in' && password === 'admin123') {
      setRole('ADMIN')
      setAuthenticated(true)
      setLoginError('')
      return
    }
    if (email === 'sales@northstar.in' && password === 'sales123') {
      setRole('SALES_USER')
      setAuthenticated(true)
      setLoginError('')
      return
    }
    setLoginError('Use admin@northstar.in and admin123 to continue.')
  }

  const signup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const email = String(form.get('email')).trim().toLowerCase()
    const password = String(form.get('password'))
    const role = String(form.get('role')) as 'ADMIN' | 'SALES_USER'
    const adminCode = String(form.get('adminCode') || '')
    if (password.length < 8) {
      setLoginError('Use a password with at least 8 characters.')
      return
    }
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role, adminCode }) })
      const result = await response.json() as { message?: string; token?: string; user?: { role: 'ADMIN' | 'SALES_USER' } }
      if (!response.ok || !result.token || !result.user) throw new Error(result.message || 'Unable to create account')
      localStorage.setItem('northstar_token', result.token)
      setRole(result.user.role)
      setAuthenticated(true)
      setLoginError('')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to create account')
    }
  }

  useEffect(() => {
    if (!authenticated || !API_URL) return
    const token = localStorage.getItem('northstar_token')
    const loadRecords = async () => {
      if (!token) {
        setAuthenticated(false)
        return
      }
      const headers = { Authorization: `Bearer ${token}` }
      const [enquiriesResponse, quotationsResponse, ordersResponse, dispatchesResponse] = await Promise.all(['enquiries', 'quotations', 'orders', 'dispatches'].map((resource) => fetch(`${API_URL}/api/workflow/${resource}`, { headers })))
      if ([enquiriesResponse, quotationsResponse, ordersResponse, dispatchesResponse].some((response) => response.status === 401)) {
        localStorage.removeItem('northstar_token')
        setAuthenticated(false)
        setLoginError('Your session expired. Please sign in again.')
        return
      }
      if (enquiriesResponse.ok) setEnquiries(await enquiriesResponse.json())
      if (quotationsResponse.ok) setQuotations(await quotationsResponse.json())
      if (ordersResponse.ok) setOrders(await ordersResponse.json())
      if (dispatchesResponse.ok) setDispatches(await dispatchesResponse.json())
    }
    void loadRecords().catch(() => notify('Unable to load live workflow data'))
  }, [authenticated])

  const navItems: { label: View; icon: string }[] = [
    { label: 'Overview', icon: '▦' }, { label: 'Customers', icon: '◎' }, { label: 'Enquiries', icon: '⌁' }, { label: 'Quotations', icon: '▤' }, { label: 'Sales Orders', icon: '↗' }, { label: 'Inventory', icon: '□' }, { label: 'Dispatches', icon: '≡' }, { label: 'Challans', icon: '≣' },
  ]

  const renderPage = () => {
    if (view === 'Customers') return <CustomersPage customers={filteredCustomers} search={search} setSearch={setSearch} onAdd={() => setShowCustomerForm(true)} />
    if (view === 'Inventory') return <InventoryPage products={products} lowStock={lowStock} onAdjust={() => notify('Stock movement recorded')} />
    if (view === 'Enquiries') return <WorkflowPage title="Enquiries" eyebrow="SALES / CUSTOMER DEMAND" description="Capture customer requirements before preparing a quotation." records={enquiries} action="New enquiry" onAction={() => { setEnquiries((current) => [{ id: `ENQ-2024-${149 + current.length}`, customer: 'New customer request', date: 'Today', value: 0, status: 'New', detail: 'Add products and required date' }, ...current]); notify('Enquiry created') }} actionLabel="Create quotation" onRecordAction={(id) => void advanceRecord('enquiries', enquiries, setEnquiries, id, 'Quoted', 'Enquiry moved to quotation')} />
    if (view === 'Quotations') return <WorkflowPage title="Quotations" eyebrow="SALES / PRICING" description="Price customer demand, apply tax, and track approvals." records={quotations} action="New quotation" onAction={() => notify('Quotation workspace opened')} actionLabel={role === 'ADMIN' ? 'Approve' : 'Send quotation'} onRecordAction={(id) => void advanceRecord('quotations', quotations, setQuotations, id, role === 'ADMIN' ? 'Accepted' : 'Sent', role === 'ADMIN' ? 'Quotation approved' : 'Quotation sent')} />
    if (view === 'Sales Orders') return <WorkflowPage title="Sales Orders" eyebrow="ORDER MANAGEMENT" description="Convert accepted quotations into confirmed, reservable orders." records={orders} action="New sales order" onAction={() => notify('Select an accepted quotation to convert')} actionLabel={role === 'ADMIN' ? 'Confirm order' : 'View order'} onRecordAction={(id) => role === 'ADMIN' && void advanceRecord('orders', orders, setOrders, id, 'Confirmed', 'Order confirmed and inventory reserved')} />
    if (view === 'Dispatches') return <WorkflowPage title="Dispatches" eyebrow="LOGISTICS / OUTBOUND" description="Prepare vehicles, dispatch confirmed orders, and close the loop." records={dispatches} action="New dispatch" onAction={() => notify('Dispatch workspace opened')} actionLabel={role === 'ADMIN' ? 'Dispatch' : 'View details'} onRecordAction={(id) => role === 'ADMIN' && void advanceRecord('dispatches', dispatches, setDispatches, id, 'Dispatched', 'Dispatch recorded and stock reduced')} />
    if (view === 'Challans') return <ChallansPage challans={challans} onConfirm={confirmChallan} onNew={() => notify('New challan workspace opened')} />
    return <OverviewPage customers={customers} lowStock={lowStock} challans={challans} onView={setView} onNewCustomer={() => setShowCustomerForm(true)} />
  }

  if (!authenticated) return <LoginPage mode={authMode} onModeChange={(mode) => { setAuthMode(mode); setLoginError('') }} onSubmit={authMode === 'signin' ? login : signup} error={loginError} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span><span>fundsroom</span></div>
        <div className="workspace-switcher"><span className="workspace-dot"></span><span><small>Workspace</small><strong>Northstar Supply</strong></span><span className="chevron">⌄</span></div>
        <nav className="main-nav" aria-label="Main navigation">
          <small className="nav-label">WORKSPACE</small>
          {navItems.map((item) => <button className={view === item.label ? 'nav-item active' : 'nav-item'} key={item.label} onClick={() => { setView(item.label); setSearch('') }}><span className="nav-icon">{item.icon}</span>{item.label}{item.label === 'Customers' && <span className="nav-count">24</span>}</button>)}
          <small className="nav-label nav-label-spaced">MANAGEMENT</small>
          <button className="nav-item" onClick={() => setRole(role === 'ADMIN' ? 'SALES_USER' : 'ADMIN')}><span className="nav-icon">◷</span>{role === 'ADMIN' ? 'Admin view' : 'Sales view'}</button>
          <button className="nav-item" onClick={() => notify('Settings are coming soon')}><span className="nav-icon">⚙</span>Settings</button>
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><span><strong>Need a hand?</strong><small>Visit the help centre</small></span><span>→</span></div><div className="user-card"><span className="avatar avatar-purple">AK</span><span><strong>Arjun Kumar</strong><small>Administrator</small></span><span className="more">•••</span></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{view}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications" onClick={() => notify('No new notifications')}>♢<span className="notification-dot"></span></button><div className="top-divider"></div><span className="top-date">Wed, 11 Sep 2024</span><span className="avatar avatar-purple">AK</span></div></header>
        <div className="page-wrap">{renderPage()}</div>
      </main>
      {showCustomerForm && <div className="modal-backdrop" onClick={() => setShowCustomerForm(false)}><form className="modal" onSubmit={addCustomer} onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><small>CRM / NEW RECORD</small><h2>Add customer</h2></div><button type="button" className="close-button" onClick={() => setShowCustomerForm(false)}>×</button></div><div className="form-grid"><label>Contact name<input name="name" required placeholder="e.g. Ananya Rao" /></label><label>Business name<input name="business" required placeholder="e.g. Rao Retail" /></label><label>Mobile number<input name="phone" required placeholder="+91 98..." /></label><label>Email address<input name="email" type="email" required placeholder="name@company.in" /></label><label>Customer type<select name="type" defaultValue="Retail"><option>Retail</option><option>Wholesale</option><option>Distributor</option></select></label><label>Follow-up date<input name="followUp" type="date" /></label></div><div className="modal-footer"><button type="button" className="button button-ghost" onClick={() => setShowCustomerForm(false)}>Cancel</button><button className="button button-primary" type="submit">Save customer</button></div></form></div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  )
}

function LoginPage({ mode, onModeChange, onSubmit, error }: { mode: 'signin' | 'signup'; onModeChange: (mode: 'signin' | 'signup') => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; error: string }) {
  const isSignup = mode === 'signup'
  return <main className="login-page"><section className="login-art"><div className="login-brand"><span className="brand-mark">F</span><span>fundsroom</span></div><div className="login-art-copy"><span className="eyebrow">NORTHSTAR SUPPLY / ERP</span><h1>Move every order forward.</h1><p>One calm workspace for customer demand, pricing, stock, and dispatch.</p></div><div className="login-art-footer"><span>Manufacturing operations</span><span>2024 workspace</span></div></section><section className="login-panel"><div className="login-box"><div className="login-mobile-brand"><span className="brand-mark">F</span><span>fundsroom</span></div><span className="eyebrow">{isSignup ? 'NEW WORKSPACE ACCOUNT' : 'WELCOME BACK'}</span><h2>{isSignup ? 'Create your account' : 'Sign in to your workspace'}</h2><p className="login-subtitle">{isSignup ? 'Choose your role and join Northstar Supply.' : 'Enter your details to continue to Northstar Supply.'}</p><form onSubmit={onSubmit} className="login-form">{isSignup && <><label>Your name<input name="name" type="text" autoComplete="name" placeholder="e.g. Priya Shah" required /></label><label>Account role<select name="role" defaultValue="SALES_USER"><option value="SALES_USER">Sales user</option><option value="ADMIN">Administrator</option></select></label><label>Admin invite code <small className="field-hint">Required for administrator accounts</small><input name="adminCode" type="password" autoComplete="off" placeholder="Enter invite code if applicable" /></label></>}<label>Email address<input name="email" type="email" defaultValue={isSignup ? '' : 'admin@northstar.in'} autoComplete="email" required /></label><label>Password<div className="password-field"><input name="password" type="password" defaultValue={isSignup ? '' : 'admin123'} autoComplete={isSignup ? 'new-password' : 'current-password'} required /><span>•••</span></div></label>{!isSignup && <div className="login-options"><label className="remember"><input type="checkbox" defaultChecked />Remember me</label><button type="button" className="text-button">Forgot password?</button></div>}{error && <p className="login-error">{error}</p>}<button className="button button-primary login-submit" type="submit">{isSignup ? 'Create account' : 'Sign in'} <span>→</span></button></form>{!isSignup && <div className="demo-access"><span>DEMO ACCESS</span><button type="button" onClick={() => { const email = document.querySelector<HTMLInputElement>('input[name="email"]'); const password = document.querySelector<HTMLInputElement>('input[name="password"]'); if (email && password) { email.value = 'admin@northstar.in'; password.value = 'admin123' } }}>Admin <small>admin@northstar.in</small></button><button type="button" onClick={() => { const email = document.querySelector<HTMLInputElement>('input[name="email"]'); const password = document.querySelector<HTMLInputElement>('input[name="password"]'); if (email && password) { email.value = 'sales@northstar.in'; password.value = 'sales123' } }}>Sales <small>sales@northstar.in</small></button></div>}<p className="login-help">{isSignup ? 'Already have an account?' : 'Need an account?'} <button type="button" className="text-button" onClick={() => onModeChange(isSignup ? 'signin' : 'signup')}>{isSignup ? 'Sign in' : 'Sign up'}</button></p></div></section></main>
}

function PageHeader({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <button className="button button-primary" onClick={onAction}><span>＋</span>{action}</button>}</div>
}

function OverviewPage({ customers, lowStock, challans, onView, onNewCustomer }: { customers: Customer[]; lowStock: Product[]; challans: Challan[]; onView: (view: View) => void; onNewCustomer: () => void }) {
  return <><PageHeader eyebrow="Wednesday, 11 September 2024" title="Good morning, Arjun" description="Here's what's happening across your workspace today." action="Add customer" onAction={onNewCustomer} /><div className="metric-grid"><Metric label="Total customers" value="248" change="12.4%" note="vs last month" icon="◎" tone="teal" /><Metric label="Inventory value" value="₹18.42L" change="8.2%" note="vs last month" icon="◫" tone="yellow" /><Metric label="Open challans" value="16" change="4.6%" note="vs last month" icon="≡" tone="coral" /><Metric label="Follow-ups due" value="08" change="Today" note="needs attention" icon="◷" tone="blue" /></div><div className="dashboard-grid"><section className="panel panel-wide"><div className="panel-heading"><div><h2>Recent challans</h2><p>Your latest sales activity</p></div><button className="text-button" onClick={() => onView('Challans')}>View all <span>→</span></button></div><ChallanTable challans={challans.slice(0, 3)} /></section><section className="panel"><div className="panel-heading"><div><h2>Stock watch</h2><p>Items below minimum quantity</p></div><button className="text-button" onClick={() => onView('Inventory')}>Inventory <span>→</span></button></div><div className="stock-list">{lowStock.map((product) => <div className="stock-item" key={product.id}><span className="product-thumb">{product.name.charAt(0)}</span><span className="stock-name"><strong>{product.name}</strong><small>{product.sku} · {product.location}</small></span><span className="stock-level"><strong>{product.stock}</strong><small>of {product.minStock} min</small></span></div>)}</div></section><section className="panel panel-wide activity-panel"><div className="panel-heading"><div><h2>Follow-up queue</h2><p>Keep your customer relationships moving</p></div><button className="text-button" onClick={() => onView('Customers')}>View customers <span>→</span></button></div><div className="followup-list">{customers.slice(0, 3).map((customer) => <div className="followup" key={customer.id}><span className={`avatar avatar-${customer.color}`}>{customer.initials}</span><span><strong>{customer.name}</strong><small>{customer.business}</small></span><span className="followup-date">{customer.followUp === 'Today' && <i></i>}{customer.followUp}</span><button className="more-button" aria-label={`More actions for ${customer.name}`}>•••</button></div>)}</div></section><section className="panel insight-panel"><span className="insight-spark">✦</span><div className="eyebrow">AT A GLANCE</div><h2>Sales are up this week</h2><p>You've processed <strong>18% more</strong> in orders compared with last week.</p><div className="mini-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i className="current"></i></div><div className="bar-labels"><span>Mon</span><span>Today</span></div></section></div></>
}

function Metric({ label, value, change, note, icon, tone }: { label: string; value: string; change: string; note: string; icon: string; tone: string }) { return <div className="metric"><span className={`metric-icon ${tone}`}>{icon}</span><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><b className={change.includes('%') ? 'positive' : 'neutral'}>{change}</b> {note}</small></div></div> }

function CustomersPage({ customers, search, setSearch, onAdd }: { customers: Customer[]; search: string; setSearch: (value: string) => void; onAdd: () => void }) {
  return <><PageHeader eyebrow="CRM / CUSTOMER DIRECTORY" title="Customers" description="Manage relationships, contacts, and follow-ups in one place." action="Add customer" onAction={onAdd} /><div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers, businesses..." /></div><select className="filter-select" defaultValue="All customers"><option>All customers</option><option>Active</option><option>Lead</option><option>Inactive</option></select><button className="button button-ghost">Export <span>↓</span></button></div><section className="panel table-panel"><div className="table-meta"><span>Showing <strong>{customers.length}</strong> customers</span><span className="table-filter-label">Updated just now</span></div><div className="customer-table"><div className="table-row table-head"><span>Customer</span><span>Contact</span><span>Type</span><span>Status</span><span>Next follow-up</span><span></span></div>{customers.map((customer) => <div className="table-row" key={customer.id}><span className="customer-cell"><span className={`avatar avatar-${customer.color}`}>{customer.initials}</span><span><strong>{customer.name}</strong><small>{customer.business}</small></span></span><span><strong className="regular-text">{customer.phone}</strong><small>{customer.email}</small></span><span><span className="type-pill">{customer.type}</span></span><span><span className={`status status-${customer.status.toLowerCase()}`}><i></i>{customer.status}</span></span><span className="followup-table">{customer.followUp}</span><button className="more-button" aria-label="Customer actions">•••</button></div>)}</div></section></>
}

function InventoryPage({ products, lowStock, onAdjust }: { products: Product[]; lowStock: Product[]; onAdjust: () => void }) {
  return <><PageHeader eyebrow="WAREHOUSE / STOCK CONTROL" title="Inventory" description="Keep an accurate pulse on stock across your warehouse." action="Record movement" onAction={onAdjust} /><div className="metric-grid inventory-metrics"><Metric label="Total SKUs" value="128" change="6" note="new this month" icon="□" tone="teal" /><Metric label="Stock value" value="₹18.42L" change="8.2%" note="vs last month" icon="◫" tone="yellow" /><Metric label="Low stock items" value={String(lowStock.length).padStart(2, '0')} change="Action" note="required" icon="!" tone="coral" /></div><section className="panel table-panel"><div className="panel-heading"><div><h2>Product catalogue</h2><p>All products and current warehouse quantities</p></div><div className="table-actions"><button className="button button-ghost">Category <span>⌄</span></button><button className="button button-ghost">Warehouse <span>⌄</span></button></div></div><div className="product-table"><div className="table-row table-head"><span>Product</span><span>Category</span><span>Unit price</span><span>Current stock</span><span>Location</span><span></span></div>{products.map((product) => <div className="table-row" key={product.id}><span className="customer-cell"><span className="product-thumb product-thumb-large">{product.name.charAt(0)}</span><span><strong>{product.name}</strong><small>{product.sku}</small></span></span><span>{product.category}</span><span>{currency.format(product.price)}</span><span><strong className={product.stock < product.minStock ? 'stock-low' : 'stock-good'}>{product.stock} units</strong><small>Min. {product.minStock}</small></span><span>{product.location}</span><button className="more-button" aria-label="Product actions">•••</button></div>)}</div></section></>
}

function ChallansPage({ challans, onConfirm, onNew }: { challans: Challan[]; onConfirm: () => void; onNew: () => void }) { return <><PageHeader eyebrow="SALES / DISPATCH DOCUMENTS" title="Sales challans" description="Create, confirm, and track outbound customer deliveries." action="New challan" onAction={onNew} /><div className="challan-layout"><section className="panel table-panel"><div className="panel-heading"><div><h2>All challans</h2><p>Delivery documents and their current status</p></div><div className="segmented"><button className="selected">All <b>16</b></button><button>Drafts <b>03</b></button></div></div><ChallanTable challans={challans} onConfirm={onConfirm} /></section><aside className="panel challan-draft"><div className="draft-top"><span className="draft-icon">✦</span><span className="status status-draft"><i></i>Draft</span></div><div className="eyebrow">READY TO COMPLETE</div><h2>CH-2024-0087</h2><p>Kapoor Wholesale</p><div className="draft-lines"><div><span>Line items</span><strong>4 products</strong></div><div><span>Total quantity</span><strong>64 units</strong></div><div><span>Estimated value</span><strong>₹21,980</strong></div></div><button className="button button-primary full-button" onClick={onConfirm}>Confirm challan <span>→</span></button><button className="text-button full-text-button">Open full details</button></aside></div></> }

function ChallanTable({ challans, onConfirm }: { challans: Challan[]; onConfirm?: () => void }) { return <div className="challan-table"><div className="table-row table-head"><span>Challan no.</span><span>Customer</span><span>Date</span><span>Quantity</span><span>Status</span><span>Value</span></div>{challans.map((challan) => <div className="table-row" key={challan.id}><span><strong>{challan.id}</strong><small>Sales delivery</small></span><span>{challan.customer}</span><span>{challan.date}</span><span>{challan.quantity} units</span><span><span className={`status status-${challan.status.toLowerCase()}`}><i></i>{challan.status}</span></span><span><strong>{currency.format(challan.amount)}</strong>{challan.status === 'Draft' && onConfirm && <button className="row-action" onClick={onConfirm}>Confirm</button>}</span></div>)}</div> }

function WorkflowPage({ title, eyebrow, description, records, action, onAction, actionLabel, onRecordAction }: { title: string; eyebrow: string; description: string; records: WorkflowRecord[]; action: string; onAction: () => void; actionLabel: string; onRecordAction: (id: string) => void }) {
  const active = records.filter((record) => !['Dispatched', 'Won'].includes(record.status)).length
  return <><PageHeader eyebrow={eyebrow} title={title} description={description} action={action} onAction={onAction} /><div className="metric-grid workflow-metrics"><Metric label={`Total ${title.toLowerCase()}`} value={String(records.length).padStart(2, '0')} change="Live" note="this workspace" icon="▤" tone="teal" /><Metric label="Needs attention" value={String(active).padStart(2, '0')} change="Action" note="in current queue" icon="!" tone="coral" /><Metric label="Pipeline value" value={currency.format(records.reduce((sum, record) => sum + record.value, 0))} change="Current" note="before tax" icon="◫" tone="yellow" /></div><section className="panel table-panel workflow-panel"><div className="table-meta"><span>Showing <strong>{records.length}</strong> records</span><span className="table-filter-label">Updated just now</span></div><div className="workflow-table"><div className="table-row table-head"><span>Reference</span><span>Customer</span><span>Date</span><span>Value</span><span>Status</span><span>Next step</span></div>{records.map((record) => <div className="table-row" key={record.id}><span><strong>{record.id}</strong><small>Manufacturing workflow</small></span><span>{record.customer}</span><span>{record.date}</span><span><strong>{currency.format(record.value)}</strong></span><span><span className={`status status-${record.status.toLowerCase().replace(' ', '-')}`}><i></i>{record.status}</span></span><span className="workflow-next"><small>{record.detail}</small>{!['Dispatched', 'Won'].includes(record.status) && <button className="row-action" onClick={() => onRecordAction(record.id)}>{actionLabel}</button>}</span></div>)}</div></section></>
}

export default App
