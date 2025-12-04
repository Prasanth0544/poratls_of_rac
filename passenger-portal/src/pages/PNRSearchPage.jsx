// passenger-portal/src/pages/PNRSearchPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './PNRSearchPage.css';

const API_URL = 'http://localhost:5000/api';

function PNRSearchPage() {
    const [pnr, setPnr] = useState('');
    const [passenger, setPassenger] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!pnr.trim()) {
            setError('Please enter a PNR number');
            return;
        }

        setLoading(true);
        setError(null);
        setPassenger(null);

        try {
            const response = await axios.get(`${API_URL}/passenger/pnr/${pnr.trim()}`);

            if (response.data.success) {
                setPassenger(response.data.data);
            } else {
                setError(response.data.message || 'PNR not found');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(err.response?.data?.message || 'Failed to fetch PNR details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        if (!status) return '';
        const s = status.toUpperCase();
        if (s.includes('CNF') || s === 'CONFIRMED') return 'cnf';
        if (s.includes('RAC')) return 'rac';
        if (s.includes('WL') || s.includes('WAITLIST')) return 'wl';
        return '';
    };

    return (
        <div className="pnr-search-page">
            <div className="page-header">
                <h2>🔍 PNR Status Search</h2>
            </div>

            <div className="search-container">
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Enter 10-digit PNR Number"
                        value={pnr}
                        onChange={(e) => setPnr(e.target.value)}
                        maxLength={10}
                    />
                    <button
                        type="submit"
                        className="search-btn"
                        disabled={loading}
                    >
                        {loading ? '⏳ Searching...' : '🔍 Search'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Searching for PNR...</p>
                </div>
            )}

            {passenger && (
                <div className="passenger-details-card">
                    <div className="card-header">
                        <h3>🎫 Passenger Details</h3>
                    </div>
                    <div className="card-body">
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">PNR Number</span>
                                <span className="detail-value">{passenger.PNR_Number || passenger.pnr}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Passenger Name</span>
                                <span className="detail-value">{passenger.Name || passenger.name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Age / Gender</span>
                                <span className="detail-value">
                                    {passenger.Age || passenger.age} yrs / {passenger.Gender || passenger.gender}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Booking Status</span>
                                <span className={`status-badge ${getStatusClass(passenger.PNR_Status || passenger.status)}`}>
                                    {passenger.PNR_Status || passenger.status || 'N/A'}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Coach / Berth</span>
                                <span className="detail-value">
                                    {passenger.Assigned_Coach || passenger.coach || '-'} / {passenger.Assigned_berth || passenger.berth || '-'}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Berth Type</span>
                                <span className="detail-value">{passenger.Berth_Type || passenger.berthType || '-'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Class</span>
                                <span className="detail-value">{passenger.Class || passenger.class || 'Sleeper'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Train</span>
                                <span className="detail-value">
                                    {passenger.Train_Name || 'Train'} ({passenger.Train_Number || '-'})
                                </span>
                            </div>
                        </div>

                        <div className="journey-section">
                            <div className="journey-path">
                                <div className="station-info">
                                    <div className="station-code">{passenger.From || passenger.from || '-'}</div>
                                    <div className="station-name">{passenger.Boarding_Station || 'Boarding Station'}</div>
                                </div>
                                <div className="journey-arrow">→</div>
                                <div className="station-info">
                                    <div className="station-code">{passenger.To || passenger.to || '-'}</div>
                                    <div className="station-name">{passenger.Deboarding_Station || 'Destination'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!passenger && !loading && !error && (
                <div className="empty-state">
                    <div className="icon">🎫</div>
                    <h3>Enter PNR to Check Status</h3>
                    <p>Get complete passenger and journey details</p>
                </div>
            )}
        </div>
    );
}

export default PNRSearchPage;
