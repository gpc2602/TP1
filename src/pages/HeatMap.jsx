import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HeatMapView from "../components/HeatMap";
import FiltersSidebar from "../components/FiltersSidebar";
import StatsCards from "../components/StatsCards";
import CellDetailModal from "../components/CellDetailModal";
import { obtenerMapaCalor } from "../services/predictionService";

export default function HeatMap() {
  const [cells, setCells] = useState([]);
  const [stats, setStats] = useState({
    criticalCount: 14,
    totalPredictions: 3050,
    accuracy: "84.6%",
    alertsCount: 8,
  });
  const [isLive, setIsLive] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    anio: 2026,
    mes: 12,
    modalidad: "ROBO",
    distrito: "Todos los distritos",
  });

  const navigate = useNavigate();

  // Función principal para consultar el modelo de Machine Learning
  const cargarDatos = useCallback(async (anio, mes, modalidad, distritoFiltro = "Todos los distritos") => {
    setMapLoading(true);
    try {
      const data = await obtenerMapaCalor(anio, mes, modalidad);

      // Normalizar nivel de riesgo para el color en Leaflet
      const normalizarNivel = (nivel) => {
        const n = (nivel || "").toLowerCase();
        if (n.includes("crit") || n === "critical") return "critical";
        if (n.includes("alt") || n === "high") return "high";
        if (n.includes("med") || n === "medium") return "medium";
        return "low";
      };

      // Mapear respuesta del modelo a GridCells para Leaflet
      const gridCells = (data.zonas || [])
        .filter((z) => {
          if (!distritoFiltro || distritoFiltro === "Todos los distritos") return true;
          return z.distrito.toUpperCase() === distritoFiltro.toUpperCase();
        })
        .map((z) => ({
          id: z.id || `cell-${z.distrito}`,
          lat: z.coordenadas.lat,
          lng: z.coordenadas.lng,
          risk: z.probabilidad,
          level: normalizarNivel(z.nivel_riesgo),
          district: z.distrito,
          incidents: z.denuncias_estimadas,
          topFactors: z.factores || [
            { name: "Iluminación deficiente", value: 0.35 },
            { name: "Brecha videovigilancia", value: 0.28 },
            { name: "Estacionalidad temporal", value: 0.22 },
          ],
          isDistrict: true,
        }));

      setCells(gridCells);
      setIsLive(data.isLive !== false);
      setStats({
        criticalCount: data.zonas_criticas + data.zonas_altas,
        totalPredictions: data.total_denuncias,
        accuracy: "84.6%",
        alertsCount: data.zonas_criticas,
      });
    } catch (err) {
      console.error("Error al cargar predicciones de delitos:", err);
    } finally {
      setMapLoading(false);
    }
  }, []);

  // Carga inicial al montar la página
  useEffect(() => {
    cargarDatos(currentFilters.anio, currentFilters.mes, currentFilters.modalidad, currentFilters.distrito);
  }, [cargarDatos, currentFilters.anio, currentFilters.mes, currentFilters.modalidad, currentFilters.distrito]);

  // Manejar aplicación de filtros desde la barra lateral
  function handleApplyFilters(sidebarState) {
    let anio = 2026;
    let mes = 12;

    if (sidebarState.dateTo) {
      const parts = sidebarState.dateTo.split("-");
      if (parts.length >= 2) {
        anio = parseInt(parts[0], 10) || 2026;
        mes = parseInt(parts[1], 10) || 12;
      }
    }

    const modalidad = sidebarState.crimeType || "ROBO";
    const distrito = sidebarState.district || "Todos los distritos";

    setCurrentFilters({ anio, mes, modalidad, distrito });
    cargarDatos(anio, mes, modalidad, distrito);
  }

  function handleRefresh() {
    cargarDatos(currentFilters.anio, currentFilters.mes, currentFilters.modalidad, currentFilters.distrito);
  }

  return (
    <div className="flex h-full overflow-hidden">
      <FiltersSidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        onApply={handleApplyFilters}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <StatsCards onRefresh={handleRefresh} loading={mapLoading} stats={stats} />
        <div className="flex-1 overflow-hidden min-h-0">
          <HeatMapView
            cells={cells}
            isLive={isLive}
            loading={mapLoading}
            onCellClick={(cell) => setSelectedCell(cell)}
          />
        </div>
      </div>
      {selectedCell && (
        <CellDetailModal
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
          onSimulatePatrol={() => navigate("/dashboard/simulador")}
        />
      )}
    </div>
  );
}
