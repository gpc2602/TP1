import { useState, useRef } from "react";
import {
  FileText,
  FileSpreadsheet,
  Globe,
  Calendar,
  CheckSquare,
  Square,
  Download,
  Loader,
  CheckCircle,
  ChevronDown,
  X,
  Shield,
  Printer,
  Sparkles,
  BarChart3,
  MapPin,
} from "lucide-react";

const REPORT_TYPES = [
  {
    id: "executive",
    icon: FileText,
    label: "Reporte Ejecutivo Gerencial",
    format: "PDF",
    desc: "Resumen de alto nivel con indicadores clave de delincuencia y recomendaciones",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
    border: "rgba(37,99,235,0.3)",
  },
  {
    id: "analytical",
    icon: FileSpreadsheet,
    label: "Reporte Analítico Tabulado",
    format: "Excel / CSV",
    desc: "Datos cuantitativos cruzados con factores del modelo predictivo para auditoría",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
  },
  {
    id: "geospatial",
    icon: Globe,
    label: "Reporte Geoespacial GIS",
    format: "GeoJSON / CSV",
    desc: "Matriz de coordenadas y polígonos de cuadrantes de calor de Lima",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.3)",
  },
];

const ALL_DISTRICTS = [
  "San Martín de Porres",
  "Los Olivos",
  "Comas",
  "Independencia",
  "Cercado de Lima",
  "Miraflores",
  "San Isidro",
  "La Victoria",
  "Rímac",
  "Breña",
  "Surquillo",
  "San Juan de Lurigancho",
];

const SECTIONS = [
  { id: "heatmap", label: "Mapa de calor de riesgo criminal" },
  { id: "top10", label: "Top 10 cuadrantes críticos priorizados" },
  { id: "shap", label: "Factores de explicabilidad IA (SHAP)" },
  { id: "trend", label: "Tendencia delictiva histórica y proyectada" },
  { id: "patrols", label: "Cobertura y recomendación de patrullaje" },
  { id: "model", label: "Métricas de validación del modelo predictivo" },
];

const SAMPLE_CRIME_DATA = [
  { distrito: "San Martín de Porres", sector: "SEC-03 Caquetá", riesgo: 0.88, nivel: "Crítico", delito: "Robo agravado", patrullas: 6, efectivos: 18 },
  { distrito: "San Martín de Porres", sector: "SEC-01 Av. Perú", riesgo: 0.82, nivel: "Alto", delito: "Arrebato de celulares", patrullas: 4, efectivos: 12 },
  { distrito: "Cercado de Lima", sector: "SEC-04 Alfonso Ugarte", riesgo: 0.79, nivel: "Alto", delito: "Hurto en paraderos", patrullas: 4, efectivos: 10 },
  { distrito: "La Victoria", sector: "SEC-08 Gamarra", riesgo: 0.85, nivel: "Crítico", delito: "Extorsión / Hurto", patrullas: 6, efectivos: 16 },
  { distrito: "San Juan de Lurigancho", sector: "SEC-02 Canto Grande", riesgo: 0.81, nivel: "Alto", delito: "Robo con arma", patrullas: 5, efectivos: 14 },
  { distrito: "Breña", sector: "SEC-07 Jr. Huaraz", riesgo: 0.65, nivel: "Medio", delito: "Robo de autopartes", patrullas: 3, efectivos: 8 },
  { distrito: "Miraflores", sector: "SEC-05 Malecón", riesgo: 0.42, nivel: "Bajo", delito: "Hurto simple", patrullas: 3, efectivos: 6 },
  { distrito: "San Isidro", sector: "SEC-06 Centro Financiero", riesgo: 0.38, nivel: "Bajo", delito: "Estafa digital", patrullas: 2, efectivos: 4 },
];

export default function ReportGenerator() {
  const [selectedType, setSelectedType] = useState("executive");
  const [dateFrom, setDateFrom] = useState("2026-10-01");
  const [dateTo, setDateTo] = useState("2026-11-03");
  const [selectedDistricts, setSelectedDistricts] = useState([
    "San Martín de Porres",
    "Cercado de Lima",
    "La Victoria",
  ]);
  const [selectedSections, setSelectedSections] = useState([
    "heatmap",
    "top10",
    "shap",
    "patrols",
  ]);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const activeType = REPORT_TYPES.find((r) => r.id === selectedType)!;

  function toggleDistrict(d: string) {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleSection(id: string) {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Descarga real de archivo CSV / Excel
  function downloadCSV() {
    const headers = [
      "ID",
      "Distrito",
      "Sector Cuadrante",
      "Nivel de Riesgo",
      "Probabilidad Predicha",
      "Delito Predominante",
      "Patrullas Asignadas",
      "Efectivos Sugeridos",
      "Rango de Fechas",
    ];

    const rows = SAMPLE_CRIME_DATA.filter((item) =>
      selectedDistricts.length === 0 || selectedDistricts.includes(item.distrito)
    ).map((item, idx) => [
      `REG-${idx + 1}`,
      `"${item.distrito}"`,
      `"${item.sector}"`,
      `"${item.nivel}"`,
      `"${(item.riesgo * 100).toFixed(1)}%"`,
      `"${item.delito}"`,
      item.patrullas,
      item.efectivos,
      `"${dateFrom} a ${dateTo}"`,
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM para que Excel respete acentos y caracteres latinos
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Reporte_Delictivo_PredictiSafe_${dateFrom}_al_${dateTo}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showDownloadSuccess("Archivo Excel / CSV descargado exitosamente");
  }

  // Descarga / Impresión real de documento PDF
  function downloadPDF() {
    const filteredRows = SAMPLE_CRIME_DATA.filter((item) =>
      selectedDistricts.length === 0 || selectedDistricts.includes(item.distrito)
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes para descargar el PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Ejecutivo PredictiSafe Lima</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
          .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: bold; color: #1e3a8a; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
          .meta { display: grid; grid-cols: 3; margin-bottom: 25px; font-size: 12px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .kpi-grid { display: flex; gap: 15px; margin-bottom: 30px; }
          .kpi-card { flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
          .kpi-val { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          .kpi-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #1e293b; color: #fff; padding: 10px; text-align: left; }
          td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">MUNICIPALIDAD METROPOLITANA DE LIMA</div>
            <div class="subtitle">Gerencia de Seguridad Ciudadana · Plataforma PredictiSafe Lima</div>
          </div>
          <span class="badge">REPORTE OFICIAL RBAC</span>
        </div>

        <div class="meta">
          <div><strong>Periodo Evaluado:</strong> ${dateFrom} al ${dateTo}</div>
          <div><strong>Distritos:</strong> ${selectedDistricts.join(", ") || "Todos"}</div>
          <div><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE")}</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-val">87.4%</div>
            <div class="kpi-lbl">Precisión del Modelo IA</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${filteredRows.length}</div>
            <div class="kpi-lbl">Sectores Monitoreados</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">3.8 min</div>
            <div class="kpi-lbl">Tiempo de Respuesta Estimado</div>
          </div>
        </div>

        <h3 style="color:#1e3a8a; margin-bottom:10px;">Matriz de Cuadrantes y Riesgo Predicho</h3>
        <table>
          <thead>
            <tr>
              <th>Distrito</th>
              <th>Sector / Cuadrante</th>
              <th>Riesgo Predicho</th>
              <th>Nivel</th>
              <th>Delito Predominante</th>
              <th>Patrullas</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
              .map(
                (r) => `
              <tr>
                <td><strong>${r.distrito}</strong></td>
                <td>${r.sector}</td>
                <td><strong>${(r.riesgo * 100).toFixed(1)}%</strong></td>
                <td><span style="color:${r.nivel === "Crítico" ? "#dc2626" : r.nivel === "Alto" ? "#ea580c" : "#16a34a"}; font-weight:bold;">${r.nivel}</span></td>
                <td>${r.delito}</td>
                <td>${r.patrullas} unidades</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <span>Sistema PredictiSafe v2.4 · Conforme a Ley N° 29733 de Protección de Datos Personales</span>
          <span>Página 1 de 1</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    showDownloadSuccess("Documento PDF generado y abierto para impresión/descarga");
  }

  function showDownloadSuccess(msg: string) {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  }

  function handleStartGeneration(format: "pdf" | "excel") {
    setGenerating(true);
    setGenDone(false);

    setTimeout(() => {
      setGenerating(false);
      setGenDone(true);
      if (format === "pdf") {
        downloadPDF();
      } else {
        downloadCSV();
      }
    }, 900);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060D1A] text-white">
      {/* Toast de descarga exitosa */}
      {downloadSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-emerald-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 bg-[#0D1728] border-b border-white/10 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">
            Generador y Exportador de Reportes Institucionales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Exporta resúmenes gerenciales y matrices de datos en formatos PDF y Excel/CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStartGeneration("pdf")}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
          >
            {generating ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Descargar PDF</span>
          </button>

          <button
            onClick={() => handleStartGeneration("excel")}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Descargar Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters & Preview */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-4 border-r border-white/10 p-5 overflow-y-auto space-y-5 bg-[#09111F]">
          {/* Format Selection Cards */}
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">
              Tipo de Documento
            </label>
            <div className="space-y-2">
              {REPORT_TYPES.map((rt) => {
                const isSelected = selectedType === rt.id;
                const Icon = rt.icon;
                return (
                  <div
                    key={rt.id}
                    onClick={() => setSelectedType(rt.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/10 border-blue-500 ring-1 ring-blue-500/50"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: rt.bg, color: rt.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white flex-1">
                        {rt.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {rt.format}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal pl-9.5">
                      {rt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">
              Rango Temporal
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Fecha Desde:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-[#0D1728] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Fecha Hasta:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-[#0D1728] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Districts Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                Distritos a Incluir ({selectedDistricts.length})
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedDistricts(
                    selectedDistricts.length === ALL_DISTRICTS.length ? [] : [...ALL_DISTRICTS]
                  )
                }
                className="text-[10px] text-blue-400 hover:underline"
              >
                {selectedDistricts.length === ALL_DISTRICTS.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-[#0D1728] rounded-xl border border-white/10">
              {ALL_DISTRICTS.map((d) => {
                const active = selectedDistricts.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDistrict(d)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sections Checklist */}
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-2">
              Secciones del Informe
            </label>
            <div className="space-y-1.5">
              {SECTIONS.map((sec) => {
                const checked = selectedSections.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#0D1728] border border-white/5 cursor-pointer hover:bg-white/[0.04]"
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs text-slate-300">{sec.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Report Live Preview */}
        <div className="lg:col-span-8 p-6 overflow-y-auto bg-[#070D1A] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-blue-400 font-semibold tracking-wider uppercase block">
                Vista Previa del Documento
              </span>
              <h2 className="text-lg font-bold text-white">
                Informe de Inteligencia y Prevención Delictiva
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Periodo: {dateFrom} al {dateTo}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#0D1728] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Precisión Modelo IA
              </span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                87.4%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Random Forest / XGBoost
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1728] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Cuadrantes Analizados
              </span>
              <span className="text-2xl font-bold text-blue-400 font-mono">
                {selectedDistricts.length * 3 + 2}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Resolución 500m²
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1728] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Patrullas Involucradas
              </span>
              <span className="text-2xl font-bold text-pink-400 font-mono">
                28
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Unidades coordinadas
              </span>
            </div>
          </div>

          {/* Tabular Preview */}
          <div className="bg-[#0D1728] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">
                Datos de Cuadrantes Priorizados para Exportación
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedDistricts.length} distrito(s) filtrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08101E] text-slate-400 font-mono uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Distrito</th>
                    <th className="px-4 py-2.5">Sector</th>
                    <th className="px-4 py-2.5">Nivel de Riesgo</th>
                    <th className="px-4 py-2.5">Delito Predominante</th>
                    <th className="px-4 py-2.5 text-right">Patrullaje Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {SAMPLE_CRIME_DATA.filter((item) =>
                    selectedDistricts.length === 0 || selectedDistricts.includes(item.distrito)
                  ).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-semibold text-white">
                        {row.distrito}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{row.sector}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            row.nivel === "Crítico"
                              ? "bg-red-500/20 text-red-400"
                              : row.nivel === "Alto"
                              ? "bg-orange-500/20 text-orange-400"
                              : row.nivel === "Medio"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {row.nivel} ({(row.riesgo * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{row.delito}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-blue-400">
                        {row.patrullas} patrullas ({row.efectivos} efectivos)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-transparent border border-blue-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">
                ¿Listo para emitir el reporte oficial?
              </h3>
              <p className="text-xs text-slate-300">
                Haz clic en el formato deseado para generar y descargar inmediatamente el documento.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleStartGeneration("pdf")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>PDF Ejecutivo</span>
              </button>
              <button
                onClick={() => handleStartGeneration("excel")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
