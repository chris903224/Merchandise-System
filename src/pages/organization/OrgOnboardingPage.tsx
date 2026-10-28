// src/pages/organization/OrgOnboardingPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, XCircle, Users, Download, FileSpreadsheet } from 'lucide-react';
import { getAllOnboardingResponses, type OnboardingViewRecord } from '../../services/onboarding';

export default function OrgOnboardingPage() {
  const [records, setRecords] = useState<OnboardingViewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await getAllOnboardingResponses();
      setRecords(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const filteredRecords = useMemo(() => {
    let result = records;
    if (filter !== 'all') {
      result = result.filter((r) => r.uniform_response === filter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => 
        r.name?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.student_id?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [records, filter, searchQuery]);

  const totalResponses = records.length;
  const yesCount = records.filter((r) => r.uniform_response === 'yes').length;
  const noCount = records.filter((r) => r.uniform_response === 'no').length;

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Student ID', 'Course', 'Year Level', 'Response', 'Date Responded'];
    const rows = filteredRecords.map(r => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.student_id}"`,
      `"${r.course_strand}"`,
      `"${r.year_level}"`,
      `"${r.uniform_response}"`, 
      `"${new Date(r.responded_at).toLocaleString()}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `uniform_onboarding_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ GLASS STYLE (Walang borderRadius para hindi mag-conflict)
  const glassStyle: React.CSSProperties = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    border: '1px solid var(--glass-bd)',
    boxShadow: 'var(--glass-shadow)',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileSpreadsheet size={28} color="var(--theme-primary)" /> 
          Uniform Onboarding Tracking
        </h1>
        <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '14px' }}>
          Monitor student responses regarding uniform availability.
        </p>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...glassStyle, borderRadius: '24px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--theme-primary)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            <Users size={16} /> Total Responses
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--theme-text)' }}>{totalResponses}</div>
        </div>
        
        <div style={{ ...glassStyle, borderRadius: '24px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--theme-success, #10b981)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-success, #10b981)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            <CheckCircle size={16} /> Has Uniform (Yes)
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--theme-text)' }}>{yesCount}</div>
        </div>
        
        <div style={{ ...glassStyle, borderRadius: '24px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--theme-danger, #ef4444)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-danger, #ef4444)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            <XCircle size={16} /> Needs Uniform (No)
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--theme-text)' }}>{noCount}</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '4px', ...glassStyle, borderRadius: '99px', padding: '4px' }}>
          {(['all', 'yes', 'no'] as const).map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)} 
              style={{ 
                padding: '8px 20px', 
                borderRadius: '99px', 
                border: 'none', 
                background: filter === f ? (f === 'all' ? 'var(--theme-primary)' : f === 'yes' ? 'var(--theme-success, #10b981)' : 'var(--theme-danger, #ef4444)') : 'transparent', 
                color: filter === f ? '#fff' : 'var(--theme-text-muted)', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Search & Export */}
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--theme-text-muted)' }} />
            <input
              type="search"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 16px 12px 44px', 
                ...glassStyle,
                borderRadius: '99px',
                background: 'var(--theme-surface-2)',
                color: 'var(--theme-text)', 
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>
          <button 
            onClick={handleExportCSV} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '0 20px', 
              borderRadius: '99px', 
              background: 'var(--theme-primary)', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '14px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.3)'
            }}
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ ...glassStyle, borderRadius: '24px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ background: 'rgba(var(--w), 0.03)', borderBottom: '1px solid var(--theme-border)' }}>
              <tr>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email / ID</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course / Year</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Responded</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
                    <FileSpreadsheet size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                    <div>No records found.</div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--theme-text)', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--theme-text-muted)' }}>
                      <div>{r.email}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{r.student_id}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--theme-text-muted)' }}>
                      <div>{r.course_strand}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{r.year_level}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {r.uniform_response === 'yes' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--theme-success, #10b981)', fontSize: '13px', fontWeight: 700 }}>
                          <CheckCircle size={14} /> Yes
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--theme-danger, #ef4444)', fontSize: '13px', fontWeight: 700 }}>
                          <XCircle size={14} /> No
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--theme-text-muted)' }}>
                      {new Date(r.responded_at).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}