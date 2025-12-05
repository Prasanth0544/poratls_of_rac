import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { initializePushNotifications } from '../services/pushNotificationService';
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

    // Auto-refresh every 3 seconds (faster updates after TTE approval)
    const interval = setInterval(() => {
      fetchMatchingData();
      fetchUpgradedPassengers();
    }, 3000);

    // ✅ WebSocket listener for instant refresh
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      console.log('PhaseOnePage WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Refresh data when TTE approves reallocations
        if (message.type === 'RAC_REALLOCATION_APPROVED') {
          console.log('✅ RAC approval detected, refreshing data...', message.data);
          fetchMatchingData();
          fetchUpgradedPassengers();
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // ✅ Initialize push notifications for Admin
    initializePushNotifications((data) => {
      console.log('🔄 Admin Portal: Received push notification, refreshing...', data);
      fetchMatchingData();
      fetchUpgradedPassengers();
    });

    return () => {
      clearInterval(interval);
      ws.close();
    };
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
      // Fetch upgraded passengers from current dynamic collection
      // This endpoint queries the CURRENT passengers collection for Upgraded_From: 'RAC'
      const res = await apiClient.get('/tte/upgraded-passengers');
      if (res.data && res.data.success) {
        const passengers = res.data.data?.passengers || [];
        console.log(`Upgraded passengers from collection: ${res.data.data?.collection}`);
        setUpgradedPassengers(passengers);
      }
    } catch (error) {
      console.error('Error fetching upgraded passengers:', error);
      setUpgradedPassengers([]);
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
          <div className="table-container">
            {(!racPassengers || racPassengers.length === 0) ? (
              <div className="empty-state">
                <p>No boarded RAC passengers</p>
              </div>
            ) : (
              <table className="pass-table rac-passengers-table">
                <thead>
                  <tr>
                    <th>RAC #</th>
                    <th>PNR</th>
                    <th>Name</th>
                    <th>Berth</th>
                    <th>Destination</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {racPassengers.map((p, idx) => (
                    <tr key={p.pnr || idx}>
                      <td className="td-rac">
                        <span className="badge rac">{p.racStatus}</span>
                      </td>
                      <td className="td-pnr">{p.pnr}</td>
                      <td className="td-name">{p.name}</td>
                      <td className="td-berth">
                        {p.currentBerth || '-'}
                      </td>
                      <td className="td-destination">{p.destination}</td>
                      <td className="td-status">
                        <span className={`badge ${p.passengerStatus?.toLowerCase()}`}>
                          {p.passengerStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
          <div className="table-container">
            {(!vacantBerths || vacantBerths.length === 0) ? (
              <div className="empty-state">
                <p>No vacant berths available</p>
              </div>
            ) : (
              <table className="pass-table vacant-berths-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Berth ID</th>
                    <th>Type</th>
                    <th>Class</th>
                    <th>Vacant From</th>
                    <th>Vacant Till</th>
                  </tr>
                </thead>
                <tbody>
                  {vacantBerths.map((b, idx) => (
                    <tr key={b.berthId || idx}>
                      <td className="td-no">{idx + 1}</td>
                      <td className="td-berth-id">{b.berthId}</td>
                      <td className="td-type">{b.type}</td>
                      <td className="td-class">{b.class}</td>
                      <td className="td-station">{b.vacantFromStation || 'Origin'}</td>
                      <td className="td-station">{b.lastVacantStation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

          <div className="table-container">
            {matches && matches.length > 0 ? (
              <table className="pass-table upgrades-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>RAC Status</th>
                    <th>Passenger Name</th>
                    <th>PNR</th>
                    <th>Current Berth</th>
                    <th>→</th>
                    <th>Upgrade Berth</th>
                    <th>Berth Type</th>
                    <th>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, idx) => (
                    <tr key={idx}>
                      <td className="td-no">{idx + 1}</td>
                      <td className="td-rac">
                        <span className="badge rac">{match.topMatch?.racStatus}</span>
                      </td>
                      <td className="td-name">{match.topMatch?.name}</td>
                      <td className="td-pnr">{match.topMatch?.pnr}</td>
                      <td className="td-current-berth">{match.topMatch?.currentBerth || '-'}</td>
                      <td className="td-arrow">→</td>
                      <td className="td-berth-upgrade">{match.berthId}</td>
                      <td className="td-type">{match.berth?.type}</td>
                      <td className="td-match">
                        <span className={`badge ${match.topMatch?.isPerfectMatch ? 'perfect' : 'good'}`}>
                          {match.topMatch?.isPerfectMatch ? '✓ Perfect' : '○ Good'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Upgrades Available</h3>
                <p>No berths match RAC passenger destinations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgraded Passengers Tab */}
      {activeTab === 'upgraded' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>✅ Upgraded Passengers (RAC → CNF)</h3>
            <span className="count-badge success">{upgradedPassengers.length}</span>
          </div>

          <div className="table-container">
            {upgradedPassengers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Upgrades Yet</h3>
                <p>Passengers appear here after TTE approval.</p>
              </div>
            ) : (
              <table className="pass-table upgraded-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Passenger Name</th>
                    <th>PNR</th>
                    <th>Previous Status</th>
                    <th>New Berth</th>
                    <th>Journey</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upgradedPassengers.map((p, idx) => (
                    <tr key={p.pnr || idx} className="upgraded-row">
                      <td className="td-no">{idx + 1}</td>
                      <td className="td-name">{p.name}</td>
                      <td className="td-pnr">{p.pnr}</td>
                      <td className="td-previous">
                        <span className="badge rac">RAC {p.racStatus || ''}</span>
                      </td>
                      <td className="td-new-berth">
                        {p.coach || p.assignedCoach}-{p.berth || p.assignedBerth}
                      </td>
                      <td className="td-journey">{p.from} → {p.to}</td>
                      <td className="td-status">
                        <span className="badge cnf">✓ CNF</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseOnePage;
