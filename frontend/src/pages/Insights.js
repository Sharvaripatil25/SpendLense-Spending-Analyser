import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../App';
import { fmt } from '../utils/api';
import './Insights.css';

export default function Insights() {
  const { data } = useData();
  const navigate = useNavigate();
  if (!data) { navigate('/'); return null; }
  const { analytics: a } = data;
  const s = a.summary;

  const scoreColor = s.health_score > 70 ? '#34d399' : s.health_score > 40 ? '#fbbf24' : '#f87171';
  const scoreLabel = s.health_score > 70 ? 'Healthy 🟢' : s.health_score > 40 ? 'Moderate 🟡' : 'Review Needed 🔴';
  const scoreDesc  = s.health_score > 70
    ? 'Great! You have a healthy spending-to-income ratio.'
    : s.health_score > 40
    ? 'Your spending is moderate. Small cuts could help.'
    : 'You are spending more than you earn. Review your budget.';

  const discretionary = ['Food & Dining', 'Entertainment', 'Shopping'];
  const savingsTips = a.by_category.filter(c => discretionary.includes(c.name)).slice(0, 3)
    .map(c => ({ ...c, saving: Math.round(c.amount * 0.2) }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-sub"></p>
        </div>
      </div>

      <div className="insights-grid">
        <div className="card insights-card fade-up">
          <div className="chart-title">Financial Health Score</div>
          <div className="health-score-wrap">
            <div className="health-circle" style={{ borderColor: scoreColor }}>
              <span className="health-num" style={{ color: scoreColor }}>{s.health_score}</span>
              <span className="health-100">/100</span>
            </div>
            <div className="health-meta">
              <div className="health-label">{scoreLabel}</div>
              <div className="health-desc">{scoreDesc}</div>
              <div className="health-stats">
                <div className="h-stat"><span>Income</span><span style={{ color: '#34d399' }}>{fmt(s.total_income)}</span></div>
                <div className="h-stat"><span>Spent</span><span style={{ color: '#f87171' }}>{fmt(s.total_spent)}</span></div>
                <div className="h-stat"><span>Saved</span><span style={{ color: '#a78bfa' }}>{fmt(Math.max(0, s.total_income - s.total_spent))}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card insights-card fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="chart-title">💡 Savings Opportunities</div>
          {savingsTips.length > 0
            ? savingsTips.map((c, i) => (
              <div className="savings-row" key={i}>
                <div className="savings-left">
                  <span className="savings-icon">{c.icon}</span>
                  <div>
                    <div className="savings-cat">{c.name}</div>
                    <div className="savings-hint">Cutting 20% saves ~{fmt(c.saving)}</div>
                  </div>
                </div>
                <div className="savings-amount" style={{ color: c.color }}>{fmt(c.amount)}</div>
              </div>
            ))
            : <p className="no-data">No discretionary spending found.</p>}
        </div>

        <div className="card insights-card fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="chart-title">⚠️ Anomalies (scipy z-score)</div>
          {a.anomalies.length > 0
            ? a.anomalies.map((t, i) => (
              <div className="anomaly-row" key={i}>
                <div className="anomaly-left">
                  <span className="anomaly-icon">!</span>
                  <div>
                    <div className="anomaly-desc">{t.description}</div>
                    <div className="anomaly-date">{t.date} · {t.category}</div>
                  </div>
                </div>
                <div className="anomaly-amount">{fmt(t.amount)}</div>
              </div>
            ))
            : <p className="no-data">No anomalies detected.</p>}
        </div>

        <div className="card insights-card fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="chart-title">🔄 Recurring Payments</div>
          {a.recurring.length > 0
            ? a.recurring.map((r, i) => (
              <div className="recurring-row" key={i}>
                <div className="recurring-name">{r.name}</div>
                <div className="recurring-meta">
                  <span className="rec-count">{r.count} times</span>
                  <span className="rec-avg">{fmt(r.avg)} avg</span>
                </div>
              </div>
            ))
            : <p className="no-data">No recurring payments detected.</p>}
        </div>

        <div className="card insights-card wide fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="chart-title">📊 Full Category Breakdown</div>
          <div className="cat-bars">
            {a.by_category.map((c, i) => (
              <div className="cat-bar-row" key={i}>
                <span className="cat-bar-icon">{c.icon}</span>
                <span className="cat-bar-name">{c.name}</span>
                <div className="cat-bar-track">
                  <div className="cat-bar-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
                <span className="cat-bar-pct">{c.pct}%</span>
                <span className="cat-bar-amt">{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
