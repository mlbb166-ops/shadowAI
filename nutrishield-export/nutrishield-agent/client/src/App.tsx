import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Planner from "@/pages/Planner";
import Growth from "@/pages/Growth";
import AgentCenter from "@/pages/AgentCenter";
import Sources from "@/pages/Sources";
import Channels from "@/pages/Channels";
import BotGuide from "@/pages/BotGuide";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router(){return <Switch><Route path="/" component={Landing}/><Route path="/app" component={Home}/><Route path="/rencana" component={Planner}/><Route path="/pertumbuhan" component={Growth}/><Route path="/agent-center" component={AgentCenter}/><Route path="/kanal" component={Channels}/><Route path="/panduan-bot" component={BotGuide}/><Route path="/sumber-data" component={Sources}/><Route path="/404" component={NotFound}/><Route component={NotFound}/></Switch>}
export default function App(){return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>}
