import React, { useState, useEffect } from 'react';

// Helper to draw a mock pixelated QR code matrix in SVG
function MockQRCode({ dataString }) {
  const size = 21; // 21x21 modules
  const matrix = Array(size).fill().map(() => Array(size).fill(0));
  
  const drawFinderPattern = (rowOffset, colOffset) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
        const isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        if (isBorder || isCenter) {
          matrix[rowOffset + r][colOffset + c] = 1;
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);
  matrix[15][15] = 1;
  
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = dataString.charCodeAt(i) + ((hash << 5) - hash);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const val = Math.abs((hash ^ (r * 13) ^ (c * 37)) % 10);
      if (val < 4) matrix[r][c] = 1;
    }
  }

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  const modSize = 100 / size;
  const rects = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        rects.push(
          <rect 
            key={`${r}-${c}`} 
            x={(c * modSize).toFixed(2)} 
            y={(r * modSize).toFixed(2)} 
            width={modSize.toFixed(2)} 
            height={modSize.toFixed(2)} 
            fill="#1E1E2F" 
          />
        );
      }
    }
  }

  return (
    <svg viewBox="0 0 100 100" className="qr-code-svg" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#FFFFFF" />
      {rects}
    </svg>
  );
}

// SVG registrations trend chart component
function TrendChart({ registrations }) {
  const datesMap = {};
  const last5Days = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    datesMap[key] = 0;
    last5Days.push(key);
  }

  registrations.forEach(r => {
    if (r.dateRegistered || r.createdAt) {
      const dateStr = r.dateRegistered || r.createdAt;
      const key = dateStr.split('T')[0];
      if (datesMap[key] !== undefined) {
        datesMap[key]++;
      }
    }
  });

  const data = last5Days.map(date => ({
    label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: datesMap[date]
  }));

  const width = 500;
  const height = 240;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxVal = Math.max(...data.map(d => d.value), 4);

  const ticks = 4;
  const gridLines = [];
  for (let i = 0; i <= ticks; i++) {
    const val = Math.round((maxVal / ticks) * i);
    const y = padding + chartHeight - (val / maxVal) * chartHeight;
    gridLines.push(
      <g key={i}>
        <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-glass)" strokeWidth="1" strokeDasharray="4,4" />
        <text x={padding - 10} y={y + 4} fill="var(--text-muted)" fontSize="11" textAnchor="end" fontWeight="600">{val}</text>
      </g>
    );
  }

  const barWidth = 36;
  const spacing = chartWidth / data.length;

  const bars = data.map((d, idx) => {
    const barHeight = (d.value / maxVal) * chartHeight;
    const x = padding + idx * spacing + (spacing - barWidth) / 2;
    const y = padding + chartHeight - barHeight;

    return (
      <g key={idx}>
        <defs>
          <linearGradient id={`react-bar-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 2)} rx="4" fill={`url(#react-bar-grad-${idx})`} />
        <text x={x + barWidth / 2} y={y - 8} fill="var(--primary)" fontSize="12" fontWeight="bold" textAnchor="middle">{d.value}</text>
        <text x={x + barWidth / 2} y={height - padding + 22} fill="var(--text-muted)" fontSize="11" fontWeight="600" textAnchor="middle">{d.label}</text>
      </g>
    );
  });

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {gridLines}
      {bars}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-glass-bright)" strokeWidth="2" />
    </svg>
  );
}

// SVG events category distribution chart component
function CategoryChart({ events }) {
  const categories = ["Conference", "Workshop", "Webinar", "Meetup", "Party"];
  const counts = { Conference: 0, Workshop: 0, Webinar: 0, Meetup: 0, Party: 0 };
  
  events.forEach(e => {
    if (counts[e.category] !== undefined) {
      counts[e.category]++;
    }
  });

  const width = 360;
  const height = 240;
  const padding = 30;
  const chartHeight = height - padding * 2;
  const maxCount = Math.max(...Object.values(counts), 2);

  const bars = categories.map((cat, idx) => {
    const val = counts[cat];
    const barHeight = 16;
    const y = padding + idx * (chartHeight / categories.length) + 6;
    const labelY = y + 12;
    const maxBarWidth = width - 150;
    const currentBarWidth = (val / maxCount) * maxBarWidth;

    let fill = "var(--primary)";
    if (cat === "Workshop") fill = "var(--secondary)";
    if (cat === "Webinar") fill = "var(--accent)";
    if (cat === "Meetup") fill = "var(--warning)";
    if (cat === "Party") fill = "var(--danger)";

    return (
      <g key={cat}>
        <text x={padding} y={labelY} fill="var(--text-main)" fontSize="11" fontWeight="600" textAnchor="start">{cat}</text>
        <rect x="110" y={y - 2} width={maxBarWidth} height={barHeight} rx="4" fill="var(--border-glass)" />
        <rect x="110" y={y - 2} width={Math.max(currentBarWidth, 4)} height={barHeight} rx="4" fill={fill} />
        <text x={120 + maxBarWidth} y={labelY} fill="var(--text-muted)" fontSize="11" fontWeight="bold">{val}</text>
      </g>
    );
  });

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {bars}
    </svg>
  );
}

// Main client UI and router wrapper
export default function App() {
  // App States
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [dbStatus, setDbStatus] = useState("checking");
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [toasts, setToasts] = useState([]);
  const [mobileActive, setMobileActive] = useState(false);

  // Filters & Search states
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("upcoming");
  
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeEventFilter, setAttendeeEventFilter] = useState("All");

  // Modals state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // Form State controllers
  const [eventForm, setEventForm] = useState({
    title: '', category: 'Conference', date: '', time: '', location: '', capacity: '', price: '', banner: '', description: '', tags: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', ticketType: 'Standard'
  });

  // 1. Initial Data Fetching
  useEffect(() => {
    fetchStatus();
    fetchEvents();
    fetchRegistrations();
    
    // Theme sync
    const savedTheme = localStorage.getItem("aether_theme_pref") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setDbStatus(data.database);
    } catch {
      setDbStatus("offline/fallback");
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      showToast("Error fetching events", "error");
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/registrations');
      const data = await res.json();
      setRegistrations(data);
    } catch (err) {
      showToast("Error fetching registrations", "error");
    }
  };

  // Toast trigger helper
  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 2. Theme Toggle
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("aether_theme_pref", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    showToast(`Switched to ${nextTheme} theme`, "info");
  };

  // 3. Navigation View Actions
  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    setMobileActive(false);
  };

  // 4. Form Actions (Event Creation/Editing)
  const openEventForm = (evt = null) => {
    if (evt) {
      setEditingEvent(evt);
      setEventForm({
        title: evt.title,
        category: evt.category,
        date: evt.date,
        time: evt.time,
        location: evt.location,
        capacity: evt.capacity,
        price: evt.price,
        banner: evt.banner || '',
        description: evt.description,
        tags: evt.tags ? evt.tags.join(', ') : ''
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '', category: 'Conference', date: '', time: '', location: '', capacity: '', price: '', banner: '', description: '', tags: ''
      });
    }
    setShowEventModal(true);
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const endpoint = editingEvent ? `/api/events/${editingEvent._id}` : '/api/events';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failure");
      }
      
      showToast(editingEvent ? "Event updated successfully" : "New event listed successfully!");
      setShowEventModal(false);
      fetchEvents();
      fetchRegistrations(); // refresh list dependencies
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event? All registrations for this event will be permanently removed!")) {
      try {
        const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
        showToast("Event and associated bookings deleted", "error");
        fetchEvents();
        fetchRegistrations();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  };

  // 5. Booking Actions (Registration Forms)
  const openRegisterModal = (evt) => {
    setRegisteringEvent(evt);
    setRegisterForm({ name: '', email: '', ticketType: 'Standard' });
    setShowRegisterModal(true);
  };

  const handleRegisterFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: registeringEvent._id,
          ...registerForm
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Booking failure");
      }

      const createdReg = await res.json();
      showToast("Seat booked successfully!", "success");
      setShowRegisterModal(false);
      
      // Auto open dynamic pass ticket viewer
      setActiveTicket(createdReg);
      setShowTicketModal(true);
      
      fetchEvents();
      fetchRegistrations();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCheckInToggle = async (reg) => {
    try {
      const res = await fetch(`/api/registrations/${reg._id}/checkin`, { method: 'PUT' });
      const updated = await res.json();
      showToast(`${updated.name} check-in status: ${updated.checkedIn ? 'Successful' : 'Pending'}`);
      fetchRegistrations();
    } catch (err) {
      showToast("Error updating check-in", "error");
    }
  };

  const handleDeleteRegistration = async (id) => {
    if (window.confirm("Are you sure you want to cancel this registration and revoke ticket access?")) {
      try {
        const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Cancellation failure");
        showToast("Registration cancelled", "error");
        fetchRegistrations();
        fetchEvents();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  };

  // Reset explorer filter controls
  const resetFilters = () => {
    setFilterSearch("");
    setDateFrom("");
    setDateTo("");
    setSortBy("upcoming");
    setCategoryFilter("All");
  };

  // Header Global search routing hooks
  const handleGlobalSearch = (val) => {
    setGlobalSearch(val);
    if (val.trim()) {
      setActiveView("explore");
      setFilterSearch(val);
    }
  };

  // Filter Explorer Grid
  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
      evt.description.toLowerCase().includes(filterSearch.toLowerCase()) ||
      evt.location.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (evt.tags && evt.tags.some(tag => tag.toLowerCase().includes(filterSearch.toLowerCase())));

    const matchesCat = (categoryFilter === "All" || evt.category === categoryFilter);
    let matchesDate = true;
    if (dateFrom) matchesDate = matchesDate && (evt.date >= dateFrom);
    if (dateTo) matchesDate = matchesDate && (evt.date <= dateTo);

    return matchesSearch && matchesCat && matchesDate;
  }).sort((a, b) => {
    if (sortBy === "upcoming") {
      return new Date(a.date) - new Date(b.date);
    }
    const aRegs = registrations.filter(r => r.eventId === a._id).length;
    const bRegs = registrations.filter(r => r.eventId === b._id).length;
    const aSpace = a.capacity - aRegs;
    const bSpace = b.capacity - bRegs;

    if (sortBy === "capacity-low") return bSpace - aSpace;
    if (sortBy === "capacity-high") return aSpace - bSpace;
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0;
  });

  // Filter Attendee Table
  const filteredRegistrations = registrations.filter(r => {
    const event = events.find(e => e._id === r.eventId);
    const eventName = event ? event.title : "";
    
    const matchesSearch = 
      r.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      r._id.toLowerCase().includes(attendeeSearch.toLowerCase());

    const matchesEvent = (attendeeEventFilter === "All" || r.eventId === attendeeEventFilter);

    return matchesSearch && matchesEvent;
  });

  // Stat calculation for dashboard
  const revenue = registrations.reduce((sum, r) => sum + r.pricePaid, 0);
  const soonEvents = [...events]
    .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);
  
  const recentRegistrations = [...registrations]
    .slice(0, 3);

  return (
    <div className="app-container">
      
      {/* 1. SIDEBAR PANEL */}
      <aside className={`app-sidebar ${mobileActive ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="app-logo">
            <div className="logo-glow"></div>
            <span className="logo-icon">✨</span>
            <span className="logo-text">Aether<span>Events</span></span>
          </div>
          <button 
            className={`mobile-toggle ${mobileActive ? 'active' : ''}`} 
            onClick={() => setMobileActive(!mobileActive)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <svg className="nav-icon"><use href="#icon-dashboard"></use></svg>
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeView === 'explore' ? 'active' : ''}`}
                onClick={() => handleNavClick('explore')}
              >
                <svg className="nav-icon"><use href="#icon-calendar"></use></svg>
                <span>Explore Events</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeView === 'manage' ? 'active' : ''}`}
                onClick={() => handleNavClick('manage')}
              >
                <svg className="nav-icon"><use href="#icon-manage"></use></svg>
                <span>Manage Events</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeView === 'attendees' ? 'active' : ''}`}
                onClick={() => handleNavClick('attendees')}
              >
                <svg className="nav-icon"><use href="#icon-users"></use></svg>
                <span>Attendees</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            <svg className="toggle-icon icon-sun"><use href="#icon-sun"></use></svg>
            <svg className="toggle-icon icon-moon"><use href="#icon-moon"></use></svg>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="intern-badge">
            <p className="intern-name">RUPAL AGARWAL</p>
            <p className="intern-id">ID: CITS7334</p>
            <p className="intern-org">CodTech IT Solutions</p>
          </div>
        </div>
      </aside>

      {/* 2. CORE CONTENT MAIN PANEL */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-search-bar">
            <svg className="search-icon"><use href="#icon-search"></use></svg>
            <input 
              type="text" 
              placeholder="Search events globally..." 
              value={globalSearch}
              onChange={(e) => handleGlobalSearch(e.target.value)}
            />
          </div>

          <div className="header-profile">
            <div className="intern-quick-info">
              <span className="intern-role">Full Stack Intern</span>
              <span className="intern-company">CodTech IT Solutions</span>
            </div>
            <div className="avatar">RA</div>
          </div>
        </header>

        <div className="view-content">
          
          {/* A. DASHBOARD PANEL */}
          {activeView === 'dashboard' && (
            <section className="app-view active">
              <div className="view-header">
                <div>
                  <h1 className="view-title">Welcome Back, Rupal</h1>
                  <p className="view-subtitle">Database connection status: <strong style={{color:'var(--accent)'}}>{dbStatus}</strong></p>
                </div>
                <button className="btn btn-primary" onClick={() => openEventForm()}>
                  <svg className="btn-icon"><use href="#icon-plus"></use></svg>
                  <span>Create Event</span>
                </button>
              </div>

              {/* Stats Counters */}
              <div className="stats-grid">
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper color-purple">
                    <svg className="stat-icon"><use href="#icon-calendar"></use></svg>
                  </div>
                  <div className="stat-details">
                    <h3>Total Events</h3>
                    <p className="stat-value">{events.length}</p>
                    <p className="stat-footer"><span className="trend-up">Live</span> listings</p>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper color-blue">
                    <svg className="stat-icon"><use href="#icon-users"></use></svg>
                  </div>
                  <div className="stat-details">
                    <h3>Registrations</h3>
                    <p className="stat-value">{registrations.length}</p>
                    <p className="stat-footer"><span className="trend-up">Database</span> sync</p>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper color-green">
                    <svg className="stat-icon"><use href="#icon-dollar"></use></svg>
                  </div>
                  <div className="stat-details">
                    <h3>Total Revenue</h3>
                    <p className="stat-value">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="stat-footer"><span className="trend-up">Paid & Free</span></p>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper color-orange">
                    <svg className="stat-icon"><use href="#icon-ticket"></use></svg>
                  </div>
                  <div className="stat-details">
                    <h3>Passes Issued</h3>
                    <p className="stat-value">{registrations.length}</p>
                    <p className="stat-footer"><span className="trend-up">With SVG QR</span></p>
                  </div>
                </div>
              </div>

              {/* SVG Charts */}
              <div className="dashboard-grid">
                <div className="chart-container glass-panel">
                  <div className="chart-header">
                    <h2>Registration Metrics</h2>
                  </div>
                  <div className="svg-chart-wrapper">
                    <TrendChart registrations={registrations} />
                  </div>
                </div>

                <div className="chart-container glass-panel">
                  <div className="chart-header">
                    <h2>Category Distribution</h2>
                  </div>
                  <div className="svg-chart-wrapper">
                    <CategoryChart events={events} />
                  </div>
                </div>
              </div>

              {/* Lists section */}
              <div className="dashboard-lists-grid">
                <div className="dashboard-list-card glass-panel">
                  <div className="card-header">
                    <h2>Soon-to-Start Events</h2>
                    <button className="card-action" onClick={() => handleNavClick('explore')}>See all</button>
                  </div>
                  <div className="upcoming-list">
                    {soonEvents.length === 0 ? (
                      <div className="empty-state">No events available. Create one to get started!</div>
                    ) : (
                      soonEvents.map(evt => {
                        const dateObj = new Date(evt.date);
                        return (
                          <div key={evt._id} className="dashboard-row-item">
                            <div className="row-date-badge">
                              <span className="row-date-day">{dateObj.getDate()}</span>
                              <span className="row-date-month">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</span>
                            </div>
                            <div className="row-details">
                              <h4>{evt.title}</h4>
                              <div className="row-meta">
                                <span>📍 {evt.location.split(',')[0]}</span>
                                <span>💰 {evt.price === 0 ? "Free" : `$${evt.price}`}</span>
                              </div>
                            </div>
                            <div className="row-action">
                              <button className="btn btn-outline" style={{padding: '6px 12px', fontSize:'11px'}} onClick={() => handleNavClick('explore')}>Book</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="dashboard-list-card glass-panel">
                  <div className="card-header">
                    <h2>Recent Registrations</h2>
                    <button className="card-action" onClick={() => handleNavClick('attendees')}>See all</button>
                  </div>
                  <div className="recent-registrations-list">
                    {recentRegistrations.length === 0 ? (
                      <div className="empty-state">No registration records found.</div>
                    ) : (
                      recentRegistrations.map(reg => {
                        const event = events.find(e => e._id === reg.eventId);
                        const initials = reg.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                        return (
                          <div key={reg._id} className="dashboard-row-item">
                            <div className="avatar" style={{width:'36px', height:'36px', fontSize:'12px', flexShrink:0}}>{initials}</div>
                            <div className="row-details">
                              <h4>{reg.name}</h4>
                              <div className="row-meta">
                                <span>🎟️ {event ? event.title : 'Deleted Event'}</span>
                                <span>🏷️ {reg.ticketType}</span>
                              </div>
                            </div>
                            <div className="row-action">
                              <span className={`status-pill ${reg.checkedIn ? 'pill-checked' : 'pill-pending'}`} style={{fontSize: '8px', padding: '2px 6px'}}>
                                {reg.checkedIn ? 'In' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* B. EXPLORE EVENTS PANEL */}
          {activeView === 'explore' && (
            <section className="app-view active">
              <div className="view-header">
                <div>
                  <h1 className="view-title">Explore Events</h1>
                  <p className="view-subtitle">Find and register for premium tech conferences, workshops, and webinars.</p>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="filters-bar glass-panel">
                <div className="filter-group-main">
                  <div className="search-input-wrapper">
                    <svg className="search-icon"><use href="#icon-search"></use></svg>
                    <input 
                      type="text" 
                      placeholder="Search name, descriptions, tags..." 
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                    />
                  </div>

                  <div className="category-pills">
                    {["All", "Conference", "Webinar", "Workshop", "Meetup", "Party"].map(cat => (
                      <button 
                        key={cat} 
                        className={`pill ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat === 'All' ? 'All Events' : `${cat}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group-secondary">
                  <div className="filter-control">
                    <label>From</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>

                  <div className="filter-control">
                    <label>To</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>

                  <div className="filter-control">
                    <label>Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="upcoming">Upcoming Date</option>
                      <option value="capacity-low">Most Space Available</option>
                      <option value="capacity-high">Selling Out Soon</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>

                  <button className="btn btn-outline" onClick={resetFilters}>
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Events Grid */}
              <div className="events-grid">
                {filteredEvents.length === 0 ? (
                  <div className="empty-state" style={{gridColumn: '1/-1', padding: '80px 20px'}}>
                    <h2>No matching events found.</h2>
                    <p style={{marginTop:'10px'}}>Try adjusting your filters or keyword query.</p>
                  </div>
                ) : (
                  filteredEvents.map(evt => {
                    const activeRegs = registrations.filter(r => r.eventId === evt._id).length;
                    const spaceLeft = evt.capacity - activeRegs;
                    const pctFilled = (activeRegs / evt.capacity) * 100;
                    const isSoldOut = spaceLeft <= 0;

                    const todayStr = new Date().toISOString().split('T')[0];
                    let statusClass = "status-upcoming";
                    let statusText = "Upcoming";
                    if (evt.date < todayStr) {
                      statusClass = "status-completed";
                      statusText = "Completed";
                    } else if (evt.date === todayStr) {
                      statusClass = "status-live";
                      statusText = "Live Now";
                    }

                    const bannerStyle = evt.banner 
                      ? { backgroundImage: `url('${evt.banner}')` }
                      : { background: `linear-gradient(135deg, var(--primary), var(--secondary))` };

                    let categoryColor = "var(--primary)";
                    if (evt.category === "Workshop") categoryColor = "var(--secondary)";
                    if (evt.category === "Webinar") categoryColor = "var(--accent)";
                    if (evt.category === "Meetup") categoryColor = "var(--warning)";
                    if (evt.category === "Party") categoryColor = "var(--danger)";

                    return (
                      <article key={evt._id} className="event-card glass-panel">
                        <div className="event-card-banner" style={bannerStyle}>
                          <div className="banner-overlay"></div>
                          <span className="category-badge" style={{backgroundColor: categoryColor}}>{evt.category}</span>
                          <span className={`status-badge ${statusClass}`}>
                            {statusText === 'Live Now' && <span className="badge-pulse"></span>}
                            {statusText}
                          </span>
                        </div>
                        <div className="event-card-body">
                          <div className="event-card-tags">
                            {evt.tags && evt.tags.map(t => <span key={t} className="event-tag">{t}</span>)}
                          </div>
                          <h3>{evt.title}</h3>
                          <p class="event-card-desc">{evt.description}</p>

                          <div className="event-card-details">
                            <div className="detail-item">
                              <svg><use href="#icon-calendar"></use></svg>
                              <span>{new Date(evt.date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}</span>
                            </div>
                            <div className="detail-item">
                              <svg><use href="#icon-clock"></use></svg>
                              <span>{evt.time}</span>
                            </div>
                            <div className="detail-item">
                              <svg><use href="#icon-location"></use></svg>
                              <span style={{whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={evt.location}>{evt.location}</span>
                            </div>
                            <div className="detail-item price-item">
                              <svg><use href="#icon-dollar"></use></svg>
                              <span>{evt.price === 0 ? "Free" : `$${evt.price.toFixed(2)}`}</span>
                            </div>
                          </div>

                          <div className="capacity-tracker">
                            <div className="capacity-labels">
                              <span>Capacity Tracker</span>
                              <span><strong>{activeRegs}</strong> / {evt.capacity} seats</span>
                            </div>
                            <div className="capacity-progress-bg">
                              <div className={`capacity-progress-fill ${pctFilled > 80 ? 'selling-out' : ''}`} style={{width: `${pctFilled}%`}}></div>
                            </div>
                          </div>

                          <div className="event-card-footer">
                            {isSoldOut ? (
                              <button className="btn btn-outline" disabled style={{width:'100%'}}>Sold Out</button>
                            ) : statusText === "Completed" ? (
                              <button className="btn btn-outline" disabled style={{width:'100%'}}>Closed</button>
                            ) : (
                              <button className="btn btn-primary" onClick={() => openRegisterModal(evt)}>Book Seat Pass</button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* C. MANAGE EVENTS PANEL */}
          {activeView === 'manage' && (
            <section className="app-view active">
              <div className="view-header">
                <div>
                  <h1 className="view-title">Manage Events</h1>
                  <p className="view-subtitle">Admin dashboard to configure, update, or remove registered listings.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openEventForm()}>
                  <svg className="btn-icon"><use href="#icon-plus"></use></svg>
                  <span>Add Event</span>
                </button>
              </div>

              <div className="table-container glass-panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Details</th>
                      <th>Category</th>
                      <th>Date & Time</th>
                      <th>Pricing</th>
                      <th>Attendance / Cap</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state" style={{padding: '60px'}}>
                          <h2>No events listed.</h2>
                          <p>Click 'Add Event' in the top right to start listing.</p>
                        </td>
                      </tr>
                    ) : (
                      events.map(evt => {
                        const activeRegs = registrations.filter(r => r.eventId === evt._id).length;
                        const bannerStyle = evt.banner 
                          ? { backgroundImage: `url('${evt.banner}')` }
                          : { background: `linear-gradient(135deg, var(--primary), var(--secondary))` };

                        return (
                          <tr key={evt._id}>
                            <td>
                              <div className="table-entity-cell">
                                <div className="entity-avatar" style={bannerStyle}></div>
                                <div className="entity-text">
                                  <div className="entity-name">{evt.title}</div>
                                  <div className="entity-sub">ID: {evt._id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="status-pill" style={{background: 'hsla(var(--primary-base), 10%)', color: 'var(--primary)', fontSize:'10px'}}>
                                {evt.category}
                              </span>
                            </td>
                            <td>
                              <div style={{fontWeight:600}}>{evt.date}</div>
                              <div className="entity-sub">{evt.time}</div>
                            </td>
                            <td>
                              <div style={{fontWeight:700, color:'var(--text-main)'}}>{evt.price === 0 ? 'Free' : `$${evt.price.toFixed(2)}`}</div>
                            </td>
                            <td>
                              <div style={{fontWeight:600}}>{activeRegs} / {evt.capacity}</div>
                              <div className="entity-sub">{Math.round((activeRegs / evt.capacity) * 100)}% filled</div>
                            </td>
                            <td className="actions-column">
                              <div className="action-btn-group">
                                <button className="btn-table-icon" onClick={() => openEventForm(evt)}>
                                  <svg style={{width:'16px',height:'16px'}}><use href="#icon-manage"></use></svg>
                                </button>
                                <button className="btn-table-icon btn-delete" onClick={() => handleDeleteEvent(evt._id)}>
                                  <svg style={{width:'16px',height:'16px'}}><use href="#icon-trash"></use></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* D. ATTENDEES DIRECTORY */}
          {activeView === 'attendees' && (
            <section className="app-view active">
              <div className="view-header">
                <div>
                  <h1 className="view-title">Attendee Directory</h1>
                  <p className="view-subtitle">Filter registered tickets, execute check-in gates, and review ticket logs.</p>
                </div>
              </div>

              <div className="filters-bar glass-panel flex-row">
                <div className="search-input-wrapper flex-grow">
                  <svg className="search-icon"><use href="#icon-search"></use></svg>
                  <input 
                    type="text" 
                    placeholder="Search attendee name, emails, ticket ID..."
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                  />
                </div>

                <div className="filter-control select-wide">
                  <label>Filter by Event</label>
                  <select value={attendeeEventFilter} onChange={(e) => setAttendeeEventFilter(e.target.value)}>
                    <option value="All">All Events</option>
                    {events.map(evt => (
                      <option key={evt._id} value={evt._id}>{evt.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-container glass-panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Attendee ID</th>
                      <th>Full Name / Email</th>
                      <th>Registered Event</th>
                      <th>Ticket Type</th>
                      <th>Registration Date</th>
                      <th>Status</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state" style={{padding: '60px'}}>
                          <h2>No attendees found.</h2>
                          <p>Book standard tickets via the Event Explorer tab.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map(reg => {
                        const event = events.find(e => e._id === reg.eventId);
                        const regDate = new Date(reg.dateRegistered || reg.createdAt);

                        return (
                          <tr key={reg._id}>
                            <td><code style={{fontFamily:'monospace', fontWeight:700}}>{reg._id}</code></td>
                            <td>
                              <div style={{fontWeight:700}}>{reg.name}</div>
                              <div className="entity-sub">{reg.email}</div>
                            </td>
                            <td>
                              <div style={{fontWeight:600, whiteSpace:'nowrap', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis'}} title={event ? event.title : 'Deleted'}>
                                {event ? event.title : 'Deleted Event'}
                              </div>
                              <div className="entity-sub">ID: {reg.eventId}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${reg.ticketType === 'VIP' ? 'ticket-type-vip' : reg.ticketType === 'Early Bird' ? 'ticket-type-early' : 'ticket-type-standard'}`} style={{fontSize:'10px'}}>
                                {reg.ticketType}
                              </span>
                            </td>
                            <td>
                              <div>{regDate.toLocaleDateString()}</div>
                              <div className="entity-sub">{regDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${reg.checkedIn ? 'pill-checked' : 'pill-pending'}`}>
                                {reg.checkedIn ? 'Checked In' : 'Pending'}
                              </span>
                            </td>
                            <td className="actions-column">
                              <div className="action-btn-group">
                                <button className="btn btn-outline" style={{padding:'4px 8px', fontSize:'10px'}} onClick={() => handleCheckInToggle(reg)}>
                                  {reg.checkedIn ? 'Undo' : 'Check-In'}
                                </button>
                                <button className="btn-table-icon btn-delete" style={{width:'26px', height:'26px'}} onClick={() => handleDeleteRegistration(reg._id)}>
                                  <svg style={{width:'14px',height:'14px'}}><use href="#icon-trash"></use></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* ==========================================================================
         MODALS RENDERING
         ========================================================================== */}
      
      {/* MODAL 1: EVENT CREATE & EDIT */}
      {showEventModal && (
        <div className="modal-backdrop active">
          <div className="modal-card glass-panel max-width-lg active animate-scale">
            <div className="modal-header">
              <h2>{editingEvent ? "Edit Event Details" : "Create New Event"}</h2>
              <button className="modal-close-btn" onClick={() => setShowEventModal(false)}>
                <svg className="close-icon"><use href="#icon-close"></use></svg>
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleEventFormSubmit}>
              <div className="form-row">
                <div className="form-control flex-grow">
                  <label>Event Title <span className="required">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. AI Developers Conference" 
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  />
                </div>
                
                <div className="form-control">
                  <label>Category <span className="required">*</span></label>
                  <select 
                    value={eventForm.category}
                    onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
                  >
                    <option value="Conference">Conference</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Meetup">Meetup</option>
                    <option value="Party">Party</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-control">
                  <label>Date <span className="required">*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label>Time <span className="required">*</span></label>
                  <input 
                    type="time" 
                    required 
                    value={eventForm.time}
                    onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-control flex-grow">
                  <label>Location/URL <span className="required">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. San Francisco Tech Center / Zoom link" 
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-control">
                  <label>Seat Capacity <span className="required">*</span></label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    placeholder="e.g. 150" 
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({...eventForm, capacity: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label>Ticket Price ($) <span className="required">*</span></label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    required 
                    placeholder="e.g. 49.99" 
                    value={eventForm.price}
                    onChange={(e) => setEventForm({...eventForm, price: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-control">
                <label>Custom Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..." 
                  value={eventForm.banner}
                  onChange={(e) => setEventForm({...eventForm, banner: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label>Event Description <span className="required">*</span></label>
                <textarea 
                  required 
                  rows="4" 
                  placeholder="Detail the event objectives and scheduling..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label>Tags (Comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. coding, nextjs, CSS" 
                  value={eventForm.tags}
                  onChange={(e) => setEventForm({...eventForm, tags: e.target.value})}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER */}
      {showRegisterModal && (
        <div className="modal-backdrop active">
          <div className="modal-card glass-panel max-width-md active animate-scale">
            <div className="modal-header">
              <h2>Register for Event</h2>
              <button className="modal-close-btn" onClick={() => setShowRegisterModal(false)}>
                <svg className="close-icon"><use href="#icon-close"></use></svg>
              </button>
            </div>

            <div className="registration-event-brief">
              <h4>{registeringEvent.title}</h4>
              <p>📅 {new Date(registeringEvent.date).toLocaleDateString()} at {registeringEvent.time} | 📍 {registeringEvent.location.split(',')[0]}</p>
              <p style={{fontWeight: 700, marginTop: '4px', color: 'var(--primary)'}}>Base Ticket: {registeringEvent.price === 0 ? "Free" : `$${registeringEvent.price.toFixed(2)}`}</p>
            </div>

            <form className="modal-form" onSubmit={handleRegisterFormSubmit}>
              <div className="form-control">
                <label>Full Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Rupal Agarwal" 
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label>Email Address <span className="required">*</span></label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. rupal@example.com" 
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label>Ticket Option</label>
                <select 
                  value={registerForm.ticketType}
                  onChange={(e) => setRegisterForm({...registerForm, ticketType: e.target.value})}
                >
                  <option value="Standard">Standard Access (Base Price)</option>
                  <option value="VIP">VIP Pass (+50% Pricing, Premium Lounge & Swag)</option>
                  <option value="Early Bird">Early Bird (-15% Discount, Limited Quantity)</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm & Generate Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PASS VIEWER */}
      {showTicketModal && activeTicket && (
        <div className="modal-backdrop active">
          <div className="modal-card glass-panel max-width-md active animate-scale background-stars">
            <div className="modal-header">
              <h2>Your Event Ticket Issued</h2>
              <button className="modal-close-btn" onClick={() => setShowTicketModal(false)}>
                <svg className="close-icon"><use href="#icon-close"></use></svg>
              </button>
            </div>

            <div className="ticket-wrapper">
              <div className="ticket-card">
                {(() => {
                  const event = events.find(e => e._id === activeTicket.eventId);
                  const ticketClass = activeTicket.ticketType === 'VIP' 
                    ? 'ticket-type-vip' 
                    : activeTicket.ticketType === 'Early Bird' 
                      ? 'ticket-type-early' 
                      : 'ticket-type-standard';
                  const dateFormatted = event 
                    ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : '';
                  
                  return (
                    <>
                      <div className="ticket-card-header" style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color:'#ffffff'}}>
                        <div className="ticket-brand">
                          <span>✨</span> AETHER PASS
                        </div>
                        <span className={`ticket-type-tag ${ticketClass}`}>{activeTicket.ticketType}</span>
                      </div>

                      <div className="ticket-card-body">
                        <h3 className="ticket-event-title">{event ? event.title : 'Deleted Event'}</h3>
                        
                        <div className="ticket-details-grid">
                          <div>
                            <div className="ticket-label">Attendee Name</div>
                            <div className="ticket-val">{activeTicket.name}</div>
                          </div>
                          <div>
                            <div className="ticket-label">Access Level</div>
                            <div className="ticket-val">{activeTicket.ticketType} Pass</div>
                          </div>
                          <div>
                            <div className="ticket-label">Event Date</div>
                            <div className="ticket-val">{dateFormatted}</div>
                          </div>
                          <div>
                            <div className="ticket-label">Time & Location</div>
                            <div className="ticket-val" title={event ? event.location : ''}>
                              {event ? `${event.time} @ ${event.location.split(',')[0]}` : ''}
                            </div>
                          </div>
                          <div>
                            <div className="ticket-label">Price Paid</div>
                            <div className="ticket-val" style={{fontWeight:700}}>${activeTicket.pricePaid.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="ticket-label">Ticket ID</div>
                            <div className="ticket-val" style={{fontFamily:'monospace'}}>{activeTicket._id}</div>
                          </div>
                        </div>
                      </div>

                      <div className="ticket-card-stub">
                        <div className="qr-code-box">
                          <MockQRCode dataString={`${activeTicket._id}|${activeTicket.email}`} />
                        </div>
                        <span className="ticket-number">SCAN AT ENTRANCE • {activeTicket._id.toUpperCase()}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="modal-footer centering">
              <button className="btn btn-primary" onClick={() => window.print()}>
                <span>Download Ticket Pass</span>
              </button>
              <button className="btn btn-outline" onClick={() => setShowTicketModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <svg style={{width:'18px',height:'18px'}}>
              <use href={`#icon-${t.type === 'error' ? 'close' : t.type === 'info' ? 'dashboard' : 'check'}`}></use>
            </svg>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
