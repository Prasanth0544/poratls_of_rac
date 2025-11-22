// passenger-portal/src/pages/UpgradeNotificationsPage.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Notifications,
  History,
  Refresh,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Info,
  Warning,
} from "@mui/icons-material";
import OfferCard from "../components/OfferCard";
import useSocket from "../hooks/useSocket";
import useOffers from "../hooks/useOffers";
import { passengerAPI } from "../api";
import { checkUpgradeEligibility } from "../utils/eligibility";
import { OFFER_STATUS, STORAGE_KEYS } from "../constants";
import { storage } from "../utils/helpers";

const UpgradeNotificationsPage = () => {
  const [pnr, setPnr] = useState("");
  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [eligibility, setEligibility] = useState(null);

  // Get PNR from localStorage or session
  useEffect(() => {
    const storedPnr = storage.get(STORAGE_KEYS.LAST_PNR);
    if (storedPnr) {
      setPnr(storedPnr);
      fetchPassengerDetails(storedPnr);
    }
  }, []);

  // Initialize WebSocket connection
  const socket = useSocket(pnr, {
    autoConnect: !!pnr,
    onConnect: () => {
      console.log("WebSocket connected for offers");
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Initialize offers hook
  const {
    offers,
    activeOffers,
    loading: offersLoading,
    error: offersError,
    processingOffer,
    hasActiveOffers,
    acceptOffer,
    denyOffer,
    refreshOffers,
    getStatistics,
  } = useOffers(pnr, socket);

  // Fetch passenger details
  const fetchPassengerDetails = async (pnrNumber) => {
    try {
      setLoading(true);
      setError("");

      const response = await passengerAPI.getPNRDetails(pnrNumber);

      if (response.success) {
        const passengerData = response.data;
        setPassenger(passengerData);

        // Check eligibility
        const eligibilityCheck = checkUpgradeEligibility(passengerData);
        setEligibility(eligibilityCheck);

        // Store PNR for future use
        storage.set(STORAGE_KEYS.LAST_PNR, pnrNumber);
      }
    } catch (err) {
      console.error("Failed to fetch passenger details:", err);
      setError(
        err.response?.data?.message || "Failed to load passenger details",
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle offer acceptance
  const handleAcceptOffer = async (offerId, notificationId) => {
    const result = await acceptOffer(offerId, notificationId);

    if (result.success) {
      // Refresh passenger details to get updated status
      await fetchPassengerDetails(pnr);
    }
  };

  // Handle offer denial
  const handleDenyOffer = async (offerId, notificationId) => {
    const result = await denyOffer(offerId, notificationId, "Not interested");

    if (result.success) {
      // Optionally refresh
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    await refreshOffers();
    if (pnr) {
      await fetchPassengerDetails(pnr);
    }
  };

  // Filter offers by status
  const pendingOffers = offers.filter((o) => o.status === OFFER_STATUS.PENDING);
  const acceptedOffers = offers.filter(
    (o) => o.status === OFFER_STATUS.ACCEPTED,
  );
  const confirmedOffers = offers.filter(
    (o) => o.status === OFFER_STATUS.CONFIRMED,
  );
  const expiredOffers = offers.filter(
    (o) =>
      o.status === OFFER_STATUS.EXPIRED ||
      o.status === OFFER_STATUS.DENIED ||
      o.status === OFFER_STATUS.REJECTED,
  );

  const stats = getStatistics();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          bgcolor: "primary.main",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Badge
                badgeContent={hasActiveOffers ? activeOffers.length : 0}
                color="error"
              >
                <Notifications fontSize="large" />
              </Badge>
              Upgrade Notifications
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              View and respond to upgrade offers in real-time
            </Typography>
          </Box>
          <Tooltip title="Refresh offers">
            <IconButton
              onClick={handleRefresh}
              disabled={!pnr || loading || offersLoading}
              sx={{ color: "white" }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* PNR Input (if not set) */}
      {!pnr && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please check your PNR on the home page first to view upgrade
          notifications.
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Offers Error */}
      {offersError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {offersError}
        </Alert>
      )}

      {/* Passenger Info and Eligibility */}
      {passenger && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Passenger: {passenger.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PNR: {passenger.pnr} | Status: {passenger.pnrStatus}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Chip
                  label={passenger.boarded ? "Boarded" : "Not Boarded"}
                  color={passenger.boarded ? "success" : "warning"}
                  size="small"
                />
                <Chip
                  label={eligibility?.eligible ? "Eligible" : "Not Eligible"}
                  color={eligibility?.eligible ? "success" : "error"}
                  size="small"
                  icon={eligibility?.eligible ? <CheckCircle /> : <Cancel />}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Eligibility Warning */}
          {eligibility && !eligibility.eligible && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Not Eligible:</strong> {eligibility.reason}
            </Alert>
          )}

          {/* Connection Status */}
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: socket.isConnected ? "success.main" : "error.main",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {socket.isConnected
                ? "Real-time updates enabled"
                : "Offline - Limited functionality"}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Statistics */}
      {pnr && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h4" color="primary.main">
                {stats.pending}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Offers
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h4" color="info.main">
                {stats.accepted}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Awaiting TTE
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {stats.confirmed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confirmed
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h4" color="text.secondary">
                {stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Offers
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Tabs */}
      {pnr && (
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab
              icon={
                <Badge badgeContent={activeOffers.length} color="error">
                  <Notifications />
                </Badge>
              }
              label="Active Offers"
            />
            <Tab
              icon={<HourglassEmpty />}
              label={`Pending Confirmation (${acceptedOffers.length})`}
            />
            <Tab
              icon={<CheckCircle />}
              label={`Confirmed (${confirmedOffers.length})`}
            />
            <Tab
              icon={<History />}
              label={`History (${expiredOffers.length})`}
            />
          </Tabs>
        </Paper>
      )}

      {/* Content */}
      {pnr && (
        <>
          {/* Active Offers Tab */}
          {currentTab === 0 && (
            <Box>
              {offersLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!offersLoading && activeOffers.length === 0 && (
                <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
                  <Info sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Active Offers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You don't have any active upgrade offers at the moment.
                    {eligibility?.eligible &&
                      " New offers will appear here automatically."}
                  </Typography>
                </Paper>
              )}

              {!offersLoading && activeOffers.length > 0 && (
                <Stack spacing={3}>
                  {activeOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onAccept={handleAcceptOffer}
                      onDeny={handleDenyOffer}
                      disabled={
                        processingOffer === offer.id || !eligibility?.eligible
                      }
                      showActions={eligibility?.eligible}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Pending Confirmation Tab */}
          {currentTab === 1 && (
            <Box>
              {acceptedOffers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
                  <HourglassEmpty
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No Offers Pending Confirmation
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {acceptedOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      showActions={false}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Confirmed Tab */}
          {currentTab === 2 && (
            <Box>
              {confirmedOffers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
                  <CheckCircle
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No Confirmed Upgrades
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {confirmedOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      showActions={false}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* History Tab */}
          {currentTab === 3 && (
            <Box>
              {expiredOffers.length === 0 ? (
                <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
                  <History
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No Offer History
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {expiredOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      showActions={false}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default UpgradeNotificationsPage;
