import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './PhaseOnePage.css';

/**
 * Phase One Page - Current Station Matching
 * With separate tabs for RAC Passengers, Vacant Berths, Upgrades, and Upgraded Passengers
 */
const PhaseOnePage = ({ onClose }) => {
  const [matchingData, setMatchingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('rac'); // 'rac' | 'vacant' | 'upgrades' | 'upgraded'
  const [upgradedPassengers, setUpgradedPassengers] = useState([]);

  useEffect(() => {
    fetchMatchingData();
    fetchUpgradedPassengers();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchMatchingData();
      fetchUpgradedPassengers();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatchingData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/reallocation/current-station-matching');
      if (res.data && res.data.data) {
        setMatchingData(res.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matching data:', error);
      setLoading(false);
    }
  };

  const fetchUpgradedPassengers = async () => {
    try {
      const res = await apiClient.get('/passengers/all');
      if (res.data && res.data.success) {
        const passengers = res.data.data?.passengers || [];
        const upgraded = passengers.filter(p =>
          p.upgradedFrom === 'RAC' ||
          (p.pnrStatus === 'CNF' && p.racStatus && p.racStatus !== '-')
        );
        setUpgradedPassengers(upgraded);
      }
    } catch (error) {
      console.error('Error fetching upgraded passengers:', error);
    }
  };

  const handleCreatePendingReallocations = async () => {
    if (!matchingData || matchingData.matches.length === 0) {
      alert('No matches available to create reallocations');
      return;
    }

    if (!window.confirm(`Create ${matchingData.matches.length} pending reallocations for TTE approval?`)) {
      return;
    }

    try {
      setCreating(true);
      const res = await apiClient.post('/reallocation/create-from-matches');
      alert(`✅ Created ${res.data.created} pending reallocations!\nTTE can now approve them.`);
      fetchMatchingData();
    } catch (error) {
      console.error('Error creating pending reallocations:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && !matchingData) {
    return (
      <div className="phase-one-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (!matchingData) {
    return (
      <div className="phase-one-page">
        <div className="page-header">
          <button className="back-btn" onClick={onClose}>◄</button>
          <h1>🎯 Phase 1: Current Station Matching</h1>
        </div>
        <div className="empty-state-content">
          <div className="empty-icon">⚠️</div>
          <h3>No Data Available</h3>
          <button className="btn-primary" onClick={fetchMatchingData}>🔄 Retry</button>
        </div>
      </div>
    );
  }

  const { currentStation, racPassengers, vacantBerths, matches, stats } = matchingData;

  return (
    <div className="phase-one-page">
      {/* Page Header */}
      <div className="page-header">
        <button className="back-btn" onClick={onClose}>◄</button>
        <h1>🎯 Phase 1: Current Station Matching</h1>
        <p className="header-subtitle">
          Station: {currentStation?.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'rac' ? 'active' : ''}`}
          onClick={() => setActiveTab('rac')}
        >
          👥 RAC Passengers
          <span className="tab-badge">{racPassengers?.length || 0}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'vacant' ? 'active' : ''}`}
          onClick={() => setActiveTab('vacant')}
        >
          🛏️ Vacant Berths
          <span className="tab-badge">{vacantBerths?.length || 0}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'upgrades' ? 'active' : ''}`}
          onClick={() => setActiveTab('upgrades')}
        >
          🚀 Upgrades Available
          <span className="tab-badge highlight">{matches?.length || 0}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'upgraded' ? 'active' : ''}`}
          onClick={() => setActiveTab('upgraded')}
        >
          ✅ Upgraded
          <span className="tab-badge success">{upgradedPassengers.length}</span>
        </button>
        <button className="btn-refresh" onClick={() => { fetchMatchingData(); fetchUpgradedPassengers(); }}>
          🔄 Refresh
        </button>
      </div>

      {/* RAC Passengers Tab */}
      {activeTab === 'rac' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>👥 RAC Passengers</h3>
            <span className="count-badge">{racPassengers?.length || 0}</span>
          </div>
          <div className="data-table rac-table">
            <div className="table-header">
              <span>RAC #</span>
              <span>PNR</span>
              <span>Name</span>
              <span>Destination</span>
              <span>Status</span>
            </div>
            <div className="table-body">
              {(!racPassengers || racPassengers.length === 0) ? (
                <div className="empty-message">No boarded RAC passengers</div>
              ) : (
                racPassengers.map((p, idx) => (
                  <div key={p.pnr || idx} className="table-row rac-row">
                    <span className="rac-badge">{p.racStatus}</span>
                    <span className="pnr">{p.pnr}</span>
                    <span className="name">{p.name}</span>
                    <span className="destination">{p.destination}</span>
                    <span className={`status ${p.passengerStatus?.toLowerCase()}`}>
                      {p.passengerStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vacant Berths Tab */}
      {activeTab === 'vacant' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>🛏️ Vacant Berths</h3>
            <span className="count-badge">{vacantBerths?.length || 0}</span>
          </div>
          <div className="data-table vacant-table">
            <div className="table-header">
              <span>Berth</span>
              <span>Type</span>
              <span>Class</span>
              <span>Vacant Till</span>
            </div>
            <div className="table-body">
              {(!vacantBerths || vacantBerths.length === 0) ? (
                <div className="empty-message">No vacant berths available</div>
              ) : (
                vacantBerths.map((b, idx) => (
                  <div key={b.berthId || idx} className="table-row berth-row">
                    <span className="berth-id">{b.berthId}</span>
                    <span className="berth-type">{b.type}</span>
                    <span className="berth-class">{b.class}</span>
                    <span className="vacant-till">{b.lastVacantStation}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrades Available Tab */}
      {activeTab === 'upgrades' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>🚀 Upgrades Available (RAC → Berth)</h3>
            <span className="count-badge success">{matches?.length || 0}</span>
            <button
              className="btn-upgrade"
              onClick={handleCreatePendingReallocations}
              disabled={creating || !matches || matches.length === 0}
            >
              {creating ? '⏳ Processing...' : '📤 Send to TTE for Approval'}
            </button>
          </div>

          {matches && matches.length > 0 ? (
            <div className="data-table matches-table">
              <div className="table-header">
                <span>#</span>
                <span>RAC Passenger</span>
                <span>→</span>
                <span>Upgrade Berth</span>
                <span>Berth Type</span>
              </div>
              <div className="table-body">
                {matches.map((match, idx) => (
                  <div key={idx} className="table-row match-row">
                    <span className="match-num">{idx + 1}</span>
                    <span className="passenger-info">
                      <strong>{match.topMatch?.racStatus}</strong>: {match.topMatch?.name}
                    </span>
                    <span className="arrow">→</span>
                    <span className="berth-info">{match.berthId}</span>
                    <span className="berth-type">{match.berth?.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No Upgrades Available</h3>
              <p>No berths match RAC passenger destinations.</p>
            </div>
          )}
        </div>
      )}

      {/* Upgraded Passengers Tab */}
      {activeTab === 'upgraded' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>✅ Upgraded Passengers (RAC → CNF)</h3>
            <span className="count-badge success">{upgradedPassengers.length}</span>
          </div>

          {upgradedPassengers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Upgrades Yet</h3>
              <p>Passengers appear here after TTE approval.</p>
            </div>
          ) : (
            <div className="upgraded-grid">
              {upgradedPassengers.map((p, idx) => (
                <div key={p.pnr || idx} className="upgraded-card">
                  <div className="card-header">
                    <h4>{p.name}</h4>
                    <span className="status-badge cnf">CNF</span>
                  </div>
                  <div className="card-body">
                    <div className="detail-row">
                      <span className="label">PNR</span>
                      <span className="value">{p.pnr}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Previous</span>
                      <span className="value previous">RAC {p.racStatus || ''}</span>
                    </div>
                    <div className="detail-row highlight">
                      <span className="label">New Berth</span>
                      <span className="value proposed">{p.coach || p.assignedCoach}-{p.berth || p.assignedBerth}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Journey</span>
                      <span className="value">{p.from} → {p.to}</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="upgrade-badge">🎉 Upgraded</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhaseOnePage;
