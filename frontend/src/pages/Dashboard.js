import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useData } from '../App';
import { fmt } from '../utils/api';
import './Dashboard.css';

const CARD_ACCENTS = ['#c0392b', '#0f7b55', '#1a3a5c', '#b7860b'];

export default function Dashboard() {
  const { data } = useData();
  const navigate = useNavigate();
  if (!data) { navigate('/'); return null; }

  const { analytics: a } = data;
  const s = a.summary;

  const cards = [
    { label: 'Total Spent',  value: fmt(s.total_spent),  sub: `${a.by_category[0]?.name || '—'} is top category`, color: '#c0392b' },
    { label: 'Total Income', value: fmt(s.total_income), sub: `${s.credit_count} credit transactions`,             color: '#0f7b55' },
    { label: 'Transactions', value: s.txn_count,         sub: `across ${s.month_count} months`,                    color: '#1a3a5c' },
    { label: 'Avg per Txn',  value: fmt(s.avg_txn),      sub: s.biggest ? `Max: ${fmt(s.biggest.amount)}` : '',   color: '#b7860b' },
  ];

  const tooltipStyle = {
    contentStyle: { background: '#fff', border: '1px solid #e4e2dc', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    labelStyle: { color: '#4a4a4a', fontWeight: 600 },
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub"></p>
        </div>
        <div className="health-badge">
          Health Score: {s.health_score}/100
        </div>
      </div>

      <div className="cards-grid">
        {cards.map((c, i) => (
          <div className="card summary-card fade-up" key={i}
            style={{ '--card-accent': c.color, animationDelay: `${i * 0.07}s` }}>
            <div className="card-label">{c.label}</div>
            <div className="card-value" style={{ color: c.color }}>{c.value}</div>
            <div className="card-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="card chart-card fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="chart-title">Monthly Spending Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={a.by_month} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1a3a5c" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#1a3a5c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eeece8" />
              <XAxis dataKey="label" tick={{ fill: '#888880', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888880', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + v / 1000 + 'k'} />
              <Tooltip {...tooltipStyle} formatter={v => [fmt(v), 'Spent']} />
              <Area type="monotone" dataKey="spent" stroke="#1a3a5c" strokeWidth={2} fill="url(#sg)" dot={{ fill: '#1a3a5c', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card fade-up" style={{ animationDelay: '0.35s' }}>
          <div className="chart-title">Category Split</div>
          <div className="pie-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={a.by_category} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                  dataKey="amount" paddingAngle={2}>
                  {a.by_category.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #e4e2dc', borderRadius:8, fontSize:12 }}
                  formatter={v => [fmt(v), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {a.by_category.slice(0, 6).map((c, i) => (
                <div className="legend-item" key={i}>
                  <span className="legend-dot" style={{ background: c.color }} />
                  <span className="legend-name">{c.icon} {c.name}</span>
                  <span className="legend-pct">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="card chart-card fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="chart-title">Spending by Day of Week</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.by_day} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              barCategoryGap="20%"
              <CartesianGrid strokeDasharray="3 3" stroke="#eeece8" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#888880', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888880', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + v / 1000 + 'k'} width={45} />
              <Tooltip {...tooltipStyle} formatter={v => [fmt(v), 'Spent']} />
              <Bar dataKey="amount" fill="#2d5f8a" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card fade-up" style={{ animationDelay: '0.45s' }}>
          <div className="chart-title">Top Merchants</div>
          <div className="merchant-list">
            {a.top_merchants.map((m, i) => (
              <div className="merchant-row" key={i}>
                <span className="merchant-rank">#{i + 1}</span>
                <span className="merchant-name">{m.name}</span>
                <span className="merchant-count">{m.count}×</span>
                <span className="merchant-amount">{fmt(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
