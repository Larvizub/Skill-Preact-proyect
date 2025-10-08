import { render } from "preact";
import Router from "preact-router";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { Login } from "./pages/Login.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Eventos } from "./pages/Eventos.tsx";
import { EventoDetalle } from "./pages/EventoDetalle.tsx";
import { Calendario } from "./pages/Calendario.tsx";
import { Salones } from "./pages/Salones.tsx";
import { SalonesDisponibles } from "./pages/SalonesDisponibles.tsx";
import { Inventario } from "./pages/Inventario.tsx";
import { Clientes } from "./pages/Clientes.tsx";
import { Contactos } from "./pages/Contactos.tsx";
import { Coordinadores } from "./pages/Coordinadores.tsx";
import { PersonalEventos } from "./pages/PersonalEventos.tsx";
import { ParqueosEventos } from "./pages/ParqueosEventos.tsx";
import { ApiTest } from "./pages/ApiTest.tsx";
import "./app.css";

function App() {
  return (
    <ThemeProvider>
      <Router>
        {/* @ts-ignore - preact-router path prop types */}
        <Login path="/" />
        {/* Alias path for explicit login route so redirects to /login work */}
        {/* @ts-ignore - preact-router path prop types */}
        <Login path="/login" />
        {/* @ts-ignore - preact-router path prop types */}
        <ApiTest path="/api-test" />
        {/* @ts-ignore - preact-router path prop types */}
        <Dashboard path="/dashboard" />
        {/* @ts-ignore - preact-router path prop types */}
        <Eventos path="/eventos" />
        {/* @ts-ignore - preact-router path prop types */}
        <EventoDetalle path="/eventos/:eventNumber" />
        {/* @ts-ignore - preact-router path prop types */}
        <Calendario path="/calendario" />
        {/* @ts-ignore - preact-router path prop types */}
        <Salones path="/salones" />
        {/* @ts-ignore - preact-router path prop types */}
        <SalonesDisponibles path="/salones-disponibles" />
        {/* @ts-ignore - preact-router path prop types */}
        <Inventario path="/inventario" />
        {/* @ts-ignore - preact-router path prop types */}
        <Clientes path="/clientes" />
        {/* @ts-ignore - preact-router path prop types */}
        <Contactos path="/contactos" />
        {/* @ts-ignore - preact-router path prop types */}
        <Coordinadores path="/coordinadores" />
        {/* @ts-ignore - preact-router path prop types */}
        <PersonalEventos path="/personal-eventos" />
        {/* @ts-ignore - preact-router path prop types */}
        <ParqueosEventos path="/parqueos-eventos" />
      </Router>
    </ThemeProvider>
  );
}

render(<App />, document.getElementById("app")!);

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("✅ Service Worker registrado:", registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error("❌ Error registrando Service Worker:", error);
      });
  });
}
