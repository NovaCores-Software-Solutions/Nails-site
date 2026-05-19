import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import MyAppointments from "./pages/MyAppointments";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminServices from "./pages/admin/Services";
import AdminProfessionals from "./pages/admin/Professionals";
import AdminClients from "./pages/admin/Clients";
import AdminFinancial from "./pages/admin/Financial";
import AdminAppointments from "./pages/admin/Appointments";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/agendar" component={Booking} />
      <Route path="/meus-agendamentos" component={MyAppointments} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/agendamentos" component={AdminAppointments} />
      <Route path="/admin/servicos" component={AdminServices} />
      <Route path="/admin/profissionais" component={AdminProfessionals} />
      <Route path="/admin/clientes" component={AdminClients} />
      <Route path="/admin/financeiro" component={AdminFinancial} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
