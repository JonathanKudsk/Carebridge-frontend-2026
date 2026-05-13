import { useEffect, useState } from "react";
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CalendarPage from "./pages/CalendarPage.jsx";
import SnackProvider from "./components/SnackProvider.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import ResidentOverview from "./pages/residentOverview.jsx";
import CreateJournalPage from "./pages/CreateJournalPage";
import JournalOverviewPage from "./pages/JournalOverviewPage";
import ShowJournalDetails from "./components/Journal/ShowJournalDetails";
import CreateResidentPage from "./pages/CreateResidentPage";
import CreateUser from "./pages/(worker)/CreateUser";
import LinkResidets from "./pages/(worker)/LinkResidents";
import ShiftCreatePage from "./pages/ShiftCreatePage.jsx";
import MedicationPage from "./pages/MedicationPage.jsx";
import MessagePage from "./pages/(worker)/MessagePage.jsx";
import Admin from "./pages/Admin.jsx";
import MedicationChartPage from "./pages/MedicationChartPage";
import ChatDock from "./components/Chat/ChatDock.jsx";

import {
  getToken,
  getCurrentUser,
  logout,
  onAuthChanged,
} from "./services/auth";
import ResidentDetailsPage from "./pages/ResidentDetailsPage.jsx";
import EditResidentPage from "./pages/EditResidentPage.jsx";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import SessionWarningModal from "./components/SessionWarningModal";

// Helper
function readAuth() {
  return {
    token: getToken(),
    user: getCurrentUser(),
  };
}

function PrivateRoute({ children, allowedRoles }) {
  const { token, user } = readAuth(); // Hent token og user

  // 1. Tjek om brugeren er logget ind
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Tjek rollen (hvis allowedRoles er specificeret)
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Hvis rollen IKKE er i listen over tilladte roller
    console.warn(
      `Adgang nægtet: Bruger med rolle '${user.role}' forsøgte at tilgå en beskyttet rute.`
    );
    // Omdiriger til dashboardet eller en 'Adgang Nægtet'-side
    return <Navigate to="/" replace />;
  }

  // Hvis logget ind og rollen er tilladt, vis children
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [{ token, user }, setAuth] = useState(readAuth());
  const [showWarning, setShowWarning] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const isCareworker = user?.role === "CAREWORKER";
  //const isCareworker = user?.role === "CAREWORKER";
  //const isGuardian = user?.role === "GUARDIAN";

  const [journals, setJournals] = useState([]);

  // Listen for login/logout
  useEffect(() => {
    const handle = () => setAuth(readAuth());
    const unsubscribe = onAuthChanged(handle);
    window.addEventListener("storage", handle);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", handle);
    };
  }, []);

  const handleLogout = async () => {
    setShowWarning(false);
    await logout();
    navigate("/login", { replace: true });
  };

  useSessionTimeout({
    onWarn: () => setShowWarning(true),
    onExpire: () => handleLogout(),
  });

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to={token ? "/calendar" : "/login"}>
            Carebridge
          </Navbar.Brand>

          {token && (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                Dashboard
              </Nav.Link>

              <Nav.Link as={Link} to="/calendar">
                Calendar
              </Nav.Link>

              <Nav.Link as={Link} to="/resident-overview">
                Resident Overview
              </Nav.Link>

              {/* TODO: Skal diskuteres med gruppen om det skal være en ting */}
              {/* <Nav.Link as={Link} to="/journal-overview">
                Journal Oversigt
              </Nav.Link> */}

              <Nav.Link as={Link} to="/medication-chart/1">
                Medication Chart
              </Nav.Link>

              {isAdmin && (
                <>
                  <Nav.Link as={Link} to="/medication">
                    Medication
                  </Nav.Link>

                  <Nav.Link as={Link} to="/create-resident">
                    Opret Resident
                  </Nav.Link>

                  <Nav.Link as={Link} to="/admin/create-user">
                    Opret Bruger
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin">
                    Admin
                  </Nav.Link>
                </>
              )}

              {(isAdmin || isCareworker) && (
                <Nav.Link as={Link} to="/message-page">
                  Beskeder
                </Nav.Link>
              )}
            </Nav>
          )}
          <Nav className="align-items-center">
            {token ? (
              <>
                {user?.name && (
                  <Navbar.Text className="me-3 fw-semibold">
                    {user.name}
                  </Navbar.Text>
                )}
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar>

      <SessionWarningModal
        show={showWarning}
        onRefreshed={() => setShowWarning(false)}
        onExpired={() => handleLogout()}
      />

            {/* Routes */}
      <SnackProvider>
        <Container className="mt-4">
          <Routes>
            <Route
              path="/"
              element={
                token ? (
                  <Home />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <CalendarPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/resident-overview"
              element={
                <PrivateRoute>
                  <ResidentOverview />
                </PrivateRoute>
              }
            />
            <Route
              path="/medication"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <MedicationPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-resident"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <CreateResidentPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/residents/edit/:id"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <EditResidentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/residents/:id"
              element={
                <PrivateRoute>
                  <ResidentDetailsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/message-page"
              element={
                <PrivateRoute allowedRoles={["ADMIN", "CAREWORKER"]}>
                  <MessagePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <Admin />
                </PrivateRoute>
              }
            />

            <Route
              path="/residents/:id/create-journal"
              element={
                <PrivateRoute>
                  <CreateJournalPage addJournal={setJournals} />
                </PrivateRoute>
              }
            />
            <Route
              path="/journal/:journalId"
              element={<ShowJournalDetails journals={journals} />}
            />
            <Route
              path="/medication-chart/:chartId"
              element={
                <PrivateRoute>
                  <MedicationChartPage />
                </PrivateRoute>
              }
            />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/create-user" element={<CreateUser />} />
            <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

            <Route
              path="/shifts/create"
              element={
                <PrivateRoute allowedRoles={["PLANNER"]}>
                  <ShiftCreatePage />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>

        {token && <ChatDock visible={Boolean(token)} />}
      </SnackProvider>
    </>
  );
}
