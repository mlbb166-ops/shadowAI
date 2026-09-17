import React, { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Growth from "./pages/Growth";
import AgentCenter from "./pages/AgentCenter";
import Channels from "./pages/Channels";
import BotGuide from "./pages/BotGuide";
import Sources from "./pages/Sources";
import Architecture from "./pages/Architecture";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";
import { AnthroCalculator } from "./components/AnthroCalculator";
import { SupervisorHub } from "./components/SupervisorHub";
import { FoodComparator } from "./components/FoodComparator";
import { ReportModal } from "./components/ReportModal";
import { ChildDetailModal } from "./components/ChildDetailModal";
import { KaderGuard } from "./components/KaderGuard";
import { AuthGuard } from "./components/AuthGuard";
import { authService } from "./services/authService";

export const App: React.FC = () => {
  const [, setLocation] = useLocation();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  return (
    <>
      <Switch>
        {/* ── 1. PUBLIC ROUTES (no auth required) ── */}
        <Route path="/" component={Landing} />
        <Route path="/panduan" component={BotGuide} />
        <Route path="/panduan-bot" component={BotGuide} />
        <Route path="/architecture" component={Architecture} />
        <Route path="/cara-kerja" component={Architecture} />
        <Route path="/sumber-data" component={Sources} />
        <Route path="/kalkulator-who" component={AnthroCalculator} />
        <Route path="/komparasi-pangan" component={FoodComparator} />

        {/* ── 2. AUTHENTICATION ROUTES ── */}
        <Route path="/login">
          {() => <AuthPage mode="login" onLoginSuccess={() => setLocation("/app")} />}
        </Route>
        <Route path="/register">
          {() => <AuthPage mode="register" onLoginSuccess={() => setLocation("/app")} />}
        </Route>

        {/* ── 3. PROTECTED FAMILY PORTAL (login required) ── */}
        <Route path="/app">
          {() => <AuthGuard><Home /></AuthGuard>}
        </Route>
        <Route path="/beranda">
          {() => <AuthGuard><Home /></AuthGuard>}
        </Route>
        <Route path="/rencana">
          {() => <AuthGuard><Planner /></AuthGuard>}
        </Route>
        <Route path="/pertumbuhan">
          {() => <AuthGuard><Growth /></AuthGuard>}
        </Route>
        <Route path="/agent-center">
          {() => <AuthGuard><AgentCenter /></AuthGuard>}
        </Route>
        <Route path="/kanal">
          {() => <AuthGuard><Channels /></AuthGuard>}
        </Route>

        {/* ── 4. POSYANDU CLINICAL WORKSPACE (login + PIN required) ── */}
        <Route path="/kader">
          {() => (
            <AuthGuard>
              <KaderGuard>
                <DashboardLayout
                  user={authService.getCurrentSession() || { id: '', name: 'Pengguna', email: '', role: 'parent' as const }}
                  onLogout={async () => {
                    await authService.logout();
                    setLocation("/login");
                  }}
                  onOpenReportModal={() => setReportModalOpen(true)}
                />
              </KaderGuard>
            </AuthGuard>
          )}
        </Route>
        <Route path="/surveilans">
          {() => (
            <AuthGuard>
              <KaderGuard>
                <SupervisorHub
                  onOpenReportModal={() => setReportModalOpen(true)}
                  onSelectChild={(id) => setSelectedChildId(id)}
                />
              </KaderGuard>
            </AuthGuard>
          )}
        </Route>

        {/* ── 5. 404 FALLBACK ── */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>

      {/* Clinical Evidence Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Child 360 Modal */}
      {selectedChildId && (
        <ChildDetailModal
          childId={selectedChildId}
          isOpen={Boolean(selectedChildId)}
          onClose={() => setSelectedChildId(null)}
        />
      )}
    </>
  );
};

export default App;
