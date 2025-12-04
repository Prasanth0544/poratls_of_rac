// passenger-portal/src/pages/ViewTicketPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BoardingPass from '../components/BoardingPass';
import './ViewTicketPage.css';

const API_URL = 'http://localhost:5000/api';

function ViewTicketPage() {
    const [passenger, setPassenger] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: verify, 2: select, 3: confirm
    const [verifyData, setVerifyData] = useState({ irctcId: '', pnr: '' });
    const [availableStations, setAvailableStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [alreadyChanged, setAlreadyChanged] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchPassengerData();
    }, []);

    const fetchPassengerData = async () => {
        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');

            if (!userData.irctcId) {
                setError('User not logged in');
                return;
            }

            const response = await axios.get(`${API_URL}/passenger/irctc/${userData.irctcId}`);

            if (response.data.success) {
                setPassenger(response.data.data);
                setAlreadyChanged(response.data.data.boardingStationChanged || false);
            }
        } catch (err) {
            console.error('Error fetching passenger:', err);
            setError(err.response?.data?.message || 'Failed to fetch ticket details');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChangeModal = () => {
        setShowChangeModal(true);
        setModalStep(1);
        setVerifyData({ irctcId: '', pnr: '' });
        setSelectedStation(null);
        setAvailableStations([]);
    };

    const handleCloseModal = () => {
        setShowChangeModal(false);
        setModalStep(1);
        setVerifyData({ irctcId: '', pnr: '' });
        setSelectedStation(null);
    };

    const handleVerify = async () => {
        if (!verifyData.irctcId || !verifyData.pnr) {
            alert('Please enter both IRCTC ID and PNR Number');
            return;
        }

        setProcessing(true);
        try {
            // Fetch available stations
            const response = await axios.get(`${API_URL}/passenger/available-boarding-stations/${verifyData.pnr}`);

            if (response.data.success) {
                if (response.data.alreadyChanged) {
                    alert('Boarding station has already been changed once for this booking.');
                    handleCloseModal();
                    return;
                }

                setAvailableStations(response.data.availableStations || []);

                if (response.data.availableStations?.length === 0) {
                    alert('No forward stations available for change.');
                    handleCloseModal();
                    return;
                }

                setModalStep(2);
            }
        } catch (err) {
            console.error('Error verifying:', err);
            alert(err.response?.data?.message || 'Failed to verify PNR');
        } finally {
            setProcessing(false);
        }
    };

    const handleSelectStation = (station) => {
        setSelectedStation(station);
    };

    const handleProceedToConfirm = () => {
        if (!selectedStation) {
            alert('Please select a station');
            return;
        }
        setModalStep(3);
    };

    const handleConfirmChange = async () => {
        if (!selectedStation) return;

        const confirmResult = window.confirm(
            `Are you sure you want to change your boarding station to ${selectedStation.name} (${selectedStation.code})?\n\nThis action can only be done ONCE and cannot be undone.`
        );

        if (!confirmResult) return;

        setProcessing(true);
        try {
            const response = await axios.post(`${API_URL}/passenger/change-boarding-station`, {
                pnr: verifyData.pnr,
                irctcId: verifyData.irctcId,
                newStationCode: selectedStation.code
            });

            if (response.data.success) {
                setSuccessMessage(`Boarding station changed successfully to ${selectedStation.name}!`);
                setAlreadyChanged(true);
                handleCloseModal();
                fetchPassengerData(); // Refresh data

                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (err) {
            console.error('Error changing station:', err);
            alert(err.response?.data?.message || 'Failed to change boarding station');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="view-ticket-page">
                <div className="page-header">
                    <h2>🎫 View Your Tickets</h2>
                </div>
                <div className="loading-container">
                    <p>Loading ticket details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="view-ticket-page">
                <div className="page-header">
                    <h2>🎫 View Your Tickets</h2>
                </div>
                <div className="error-message">
                    ❌ {error}
                </div>
            </div>
        );
    }

    return (
        <div className="view-ticket-page">
            <div className="page-header">
                <h2>🎫 View Your Tickets</h2>
            </div>

            {successMessage && (
                <div className="success-message">
                    ✅ {successMessage}
                </div>
            )}

            {/* Change Boarding Station Section */}
            <div className="change-station-section">
                <div className="section-title">
                    📍 Change Boarding Station
                </div>

                {alreadyChanged ? (
                    <div className="already-changed-notice">
                        ⚠️ Boarding station has already been changed for this booking. Changes are allowed only once.
                    </div>
                ) : (
                    <>
                        <p style={{ color: '#7f8c8d', marginBottom: 15 }}>
                            You can change your boarding station to any of the next 3 upcoming stations.
                            This can only be done <strong>once</strong>.
                        </p>
                        <button
                            className="change-station-btn"
                            onClick={handleOpenChangeModal}
                        >
                            🔄 Change Boarding Station
                        </button>
                    </>
                )}
            </div>

            {/* E-Boarding Pass */}
            {passenger && <BoardingPass passenger={passenger} />}

            {/* Change Station Modal */}
            {showChangeModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🔄 Change Boarding Station</h3>
                        </div>

                        {/* Step Indicator */}
                        <div className="step-indicator" style={{ padding: '20px 0' }}>
                            <div className="step">
                                <div className={`step-number ${modalStep >= 1 ? 'active' : ''}`}>1</div>
                            </div>
                            <div className={`step-line ${modalStep >= 2 ? 'active' : ''}`}></div>
                            <div className="step">
                                <div className={`step-number ${modalStep >= 2 ? 'active' : ''}`}>2</div>
                            </div>
                            <div className={`step-line ${modalStep >= 3 ? 'active' : ''}`}></div>
                            <div className="step">
                                <div className={`step-number ${modalStep >= 3 ? 'active' : ''}`}>3</div>
                            </div>
                        </div>

                        <div className="modal-body">
                            {/* Step 1: Verify Identity */}
                            {modalStep === 1 && (
                                <>
                                    <div className="form-group">
                                        <label>IRCTC ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your IRCTC ID"
                                            value={verifyData.irctcId}
                                            onChange={e => setVerifyData({ ...verifyData, irctcId: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>PNR Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter 10-digit PNR"
                                            value={verifyData.pnr}
                                            onChange={e => setVerifyData({ ...verifyData, pnr: e.target.value })}
                                            maxLength={10}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Step 2: Select Station */}
                            {modalStep === 2 && (
                                <>
                                    <p style={{ marginBottom: 15, color: '#5a6c7d' }}>
                                        Select your new boarding station (next 3 upcoming stations):
                                    </p>
                                    {availableStations.map((station, idx) => (
                                        <div
                                            key={station.code}
                                            className={`station-option ${selectedStation?.code === station.code ? 'selected' : ''}`}
                                            onClick={() => handleSelectStation(station)}
                                        >
                                            <div className="station-option-name">
                                                {idx + 1}. {station.name} ({station.code})
                                            </div>
                                            {station.arrivalTime && (
                                                <div className="station-option-time">
                                                    Arrival: {station.arrivalTime}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Step 3: Confirm */}
                            {modalStep === 3 && selectedStation && (
                                <div className="confirm-dialog">
                                    <div className="confirm-icon">⚠️</div>
                                    <div className="confirm-message">
                                        Are you sure you want to change your boarding station?
                                    </div>
                                    <div className="confirm-details">
                                        <div className="from-to">
                                            <span>{passenger?.Boarding_Station || passenger?.From}</span>
                                            <span className="arrow">→</span>
                                            <span style={{ color: '#27ae60' }}>{selectedStation.name}</span>
                                        </div>
                                    </div>
                                    <p style={{ color: '#e74c3c', fontSize: 14 }}>
                                        ⚠️ This action can only be done ONCE and cannot be undone.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseModal}>
                                Cancel
                            </button>

                            {modalStep === 1 && (
                                <button
                                    className="btn-confirm"
                                    onClick={handleVerify}
                                    disabled={processing}
                                >
                                    {processing ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                            )}

                            {modalStep === 2 && (
                                <button
                                    className="btn-confirm"
                                    onClick={handleProceedToConfirm}
                                    disabled={!selectedStation}
                                >
                                    Continue
                                </button>
                            )}

                            {modalStep === 3 && (
                                <button
                                    className="btn-confirm"
                                    onClick={handleConfirmChange}
                                    disabled={processing}
                                    style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}
                                >
                                    {processing ? 'Processing...' : 'Confirm Change'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewTicketPage;
