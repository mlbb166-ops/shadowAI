import React, { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import { AuthGuard } from "./components/AuthGuard";

const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Planner = lazy(() => import("./pages/Planner"));
const Growth = lazy(() => import("./pages/Growth"));
const AgentCenter = lazy(() => import("./pages/AgentCenter"));
const Channels = lazy(() => import("./pages/Channels"));
const BotGuide = lazy(() => import("./pages/BotGuide"));
const Sources = lazy(() => import("./pages/Sources"));
const Architecture = lazy(() => import("./pages/Architecture"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const App: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f6f8f4] text-sm text-[#36594a]">Memuat NutriShield…</div>}>
      <Switch>
        {/* ── 1. PUBLIC ROUTES (no auth required) ── */}
        <Route path="/" component={Landing} />
        <Route path="/panduan" component={BotGuide} />
        <Route path="/panduan-bot" component={BotGuide} />
        <Route path="/architecture" component={Architecture} />
        <Route path="/cara-kerja" component={Architecture} />
        <Route path="/sumber-data" component={Sources} />
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

        {/* ── 4. 404 FALLBACK ── */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
};

export default App;
