import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../App';
import { fmt } from '../utils/api';
import './Transactions.css';

export default function Transactions() {
  const { data } = useData();
  const navigate = useNavigate();
  if (!data) { navigate('/'); return null; }

  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sort,       setSort]       = useState('date-desc');
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 20;

  const categories = useMemo(() => ['All', ...new Set(data.transactions.map(t => t.category))].sort(), [data]);

  const filtered = useMemo(() => {
    let txns = [...data.transactions];
    if (search)           txns = txns.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    if (filterCat  !== 'All') txns = txns.filter(t => t.category === filterCat);
    if (filterType !== 'All') txns = txns.filter(t => t.type     === filterType);
    txns.sort((a, b) => {
      if (sort === 'amt-desc') return b.amount - a.amount;
      if (sort === 'amt-asc')  return a.amount - b.amount;
      return 0; // date order preserved from Python
    });
    if (sort === 'date-asc') txns.reverse();
    return txns;
  }, [data.transactions, search, filterCat, filterType, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">{filtered.length} of {data.transactions.length} transactions</p>
        </div>
      </div>

      <div className="txn-filters card">
        <input className="txn-search" placeholder="🔍 Search description…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="txn-select" value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="txn-select" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          <option>All</option><option value="debit">Debit</option><option value="credit">Credit</option>
        </select>
        <select className="txn-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amt-desc">Highest Amount</option>
          <option value="amt-asc">Lowest Amount</option>
        </select>
      </div>

      <div className="txn-table card">
        <div className="txn-header-row">
          <span>Date</span><span>Description</span><span>Category</span><span>Type</span><span style={{ textAlign: 'right' }}>Amount</span>
        </div>
        {visible.map((t, i) => (
          <div className="txn-row" key={i}>
            <span className="txn-date">{t.date}</span>
            <span className="txn-desc">{t.description}</span>
            <span><span className="cat-pill" style={{ background: t.color + '22', color: t.color }}>{t.icon} {t.category}</span></span>
            <span><span className={`type-pill ${t.type}`}>{t.type}</span></span>
            <span className={`txn-amount ${t.type}`}>{t.type === 'debit' ? '-' : '+'}{fmt(t.amount)}</span>
          </div>
        ))}
        {!visible.length && <div className="txn-empty">No transactions match your filters.</div>}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1}          onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
