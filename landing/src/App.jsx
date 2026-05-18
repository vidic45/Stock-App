import { useState, useEffect, useRef } from "react";

// ─── DATA (espeja exactamente INVENTARIO_INICIAL del script Python) ───────────
const INVENTARIO_DEMO = [
  { codigo: "P001", nombre: "Laptop HP 15",       precio: 2800.0, stock: 12, minimo: 5  },
  { codigo: "P002", nombre: "Mouse inalámbrico",   precio:   45.0, stock: 3,  minimo: 10 },
  { codigo: "P003", nombre: "Teclado mecánico",    precio:  189.0, stock: 0,  minimo: 5  },
  { codigo: "P004", nombre: "Monitor 24 pulgadas", precio:  650.0, stock: 8,  minimo: 3  },
  { codigo: "P005", nombre: "Auriculares USB",     precio:   85.0, stock: 20, minimo: 5  },
];

const FACTURA_DEMO = {
  numero: "F001-0001",
  fecha: new Date().toLocaleDateString("es-PE"),
  cliente: { nombre: "David Pérez S.A.C.", ruc: "20987654321" },
  items: [
    { nombre: "Laptop HP 15",    cantidad: 2, precio: 2800.0 },
    { nombre: "Auriculares USB", cantidad: 3, precio:   85.0 },
  ],
};

const PLANES = [
  {
    nombre: "Básico",
    precio: "S/ 0",
    periodo: "/ mes",
    desc: "Para empezar sin riesgos.",
    features: [
      "Hasta 100 productos",
      "1 usuario",
      "Facturas PDF básicas",
      "Alertas de stock bajo",
    ],
    cta: "Empezar gratis",
    destacado: false,
  },
  {
    nombre: "Pro",
    precio: "S/ 49",
    periodo: "/ mes",
    desc: "Para negocios que crecen.",
    features: [
      "Productos ilimitados",
      "Hasta 5 usuarios",
      "Facturas con RUC + IGV 18%",
      "Exportar inventario.json",
      "Dashboard de métricas",
    ],
    cta: "Elegir Pro",
    destacado: true,
  },
  {
    nombre: "Empresa",
    precio: "S/ 129",
    periodo: "/ mes",
    desc: "Para equipos y tiendas.",
    features: [
      "Todo en Pro",
      "Usuarios ilimitados",
      "API REST + webhooks",
      "Soporte prioritario 24/7",
      "Onboarding personalizado",
    ],
    cta: "Contactar ventas",
    destacado: false,
  },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function getEstado(stock, minimo) {
  if (stock === 0)     return { label: "Agotado",    color: "#ff4d4d", bg: "rgba(255,77,77,0.12)"  };
  if (stock <= minimo) return { label: "Stock bajo", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return                      { label: "En stock",   color: "#22c55e", bg: "rgba(34,197,94,0.12)"  };
}

function calcFactura(items) {
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const igv   = (total * 0.18) / 1.18;
  const base  = total - igv;
  return { total, igv, base };
}

// ─── HOOK: fade-in al hacer scroll ───────────────────────────────────────────
function useFadeIn(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

function Badge({ children, color = "#22c55e" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 12px",
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {children}
    </span>
  );
}

function Btn({ children, variant = "primary", style: sx = {}, onClick }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "opacity 0.18s, transform 0.18s",
  };
  const variants = {
    primary: { background: "#22c55e", color: "#0a0f0d", border: "none" },
    outline: {
      background: "transparent",
      color: "#e8f5ee",
      border: "1px solid rgba(255,255,255,0.18)",
    },
    ghost: {
      background: "transparent",
      color: "#22c55e",
      border: "1px solid rgba(34,197,94,0.3)",
    },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...sx }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ active }) {
  const links = [
    ["inventario", "Inventario"],
    ["facturas", "Facturas"],
    ["setup", "Inicio rápido"],
    ["precios", "Precios"],
  ];
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 3rem",
        background: "rgba(10,15,13,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#e8f5ee",
          letterSpacing: "-0.04em",
          userSelect: "none",
        }}
      >
        Stock<span style={{ color: "#22c55e" }}>.</span>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: 28 }}>
        {links.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            style={{
              color: active === id ? "#22c55e" : "rgba(255,255,255,0.38)",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.03em",
              transition: "color 0.2s",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <a
        href="https://github.com"
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "none" }}
      >
        <Btn sx={{ padding: "8px 18px", fontSize: 12.5 }}>
          ★ GitHub
        </Btn>
      </a>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  const highlighted = tick % INVENTARIO_DEMO.length;

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "100px 3rem 4rem",
        maxWidth: 1200,
        margin: "0 auto",
        gap: "4rem",
        flexWrap: "wrap",
      }}
    >
      {/* ── Texto ── */}
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <Badge>Nuevo — Facturas PDF con IGV 18%</Badge>
        </div>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2.6rem, 4.5vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-0.04em",
            color: "#e8f5ee",
            marginBottom: 20,
          }}
        >
          Inventario
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            sin caos.
          </span>
          <br />
          Facturas
          <br />
          en segundos.
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.48)",
            fontSize: 16,
            lineHeight: 1.78,
            maxWidth: 440,
            marginBottom: 36,
          }}
        >
          Script Python que gestiona tu stock, genera PDFs profesionales con
          RUC e IGV, y te avisa cuando un producto está por agotarse — todo
          desde tu terminal.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn>▶&nbsp;pip install reportlab</Btn>
          <Btn variant="outline">Ver documentación</Btn>
        </div>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: 40, marginTop: 44 }}>
          {[
            ["5", "productos demo"],
            ["IGV 18%", "automático"],
            ["PDF A4", "profesional"],
          ].map(([n, l]) => (
            <div key={n}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#22c55e",
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.28)",
                  marginTop: 2,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabla inventario animada ── */}
      <div style={{ flex: "1 1 380px", minWidth: 0 }}>
        <div
          style={{
            background: "#111a14",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow:
              "0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,197,94,0.05)",
          }}
        >
          {/* Barra de terminal */}
          <div
            style={{
              padding: "11px 16px",
              background: "rgba(0,0,0,0.38)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {["#ff5f56", "#ffbd2e", "#27c93f"].map(c => (
              <span
                key={c}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: c,
                }}
              />
            ))}
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                color: "rgba(255,255,255,0.22)",
                fontFamily: "'Fira Code', monospace",
              }}
            >
              inventario.json
            </span>
          </div>

          {/* Tabla */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Código", "Producto", "Precio", "Stock", "Estado"].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 14px",
                      textAlign: h === "Producto" ? "left" : "center",
                      color: "rgba(255,255,255,0.26)",
                      fontWeight: 500,
                      fontSize: 10,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVENTARIO_DEMO.map((p, i) => {
                const est = getEstado(p.stock, p.minimo);
                const isActive = i === highlighted;
                return (
                  <tr
                    key={p.codigo}
                    style={{
                      background: isActive
                        ? "rgba(34,197,94,0.07)"
                        : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.5s",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontFamily: "'Fira Code', monospace",
                        color: "#22c55e",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {p.codigo}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#e8f5ee",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {p.nombre}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 12,
                        textAlign: "right",
                      }}
                    >
                      S/{p.precio.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#e8f5ee",
                        fontWeight: 700,
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      {p.stock}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span
                        style={{
                          background: est.bg,
                          color: est.color,
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {est.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── SECCIÓN INVENTARIO ───────────────────────────────────────────────────────
function SeccionInventario() {
  const [ref, visible] = useFadeIn();
  const [sel, setSel] = useState(null);

  return (
    <section
      id="inventario"
      ref={ref}
      style={{
        padding: "6rem 3rem",
        maxWidth: 1200,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(44px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Badge>Módulo 1 — Control de stock</Badge>
      </div>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(1.9rem, 3vw, 2.8rem)",
          fontWeight: 800,
          color: "#e8f5ee",
          letterSpacing: "-0.03em",
          marginBottom: 12,
        }}
      >
        Control total del stock
      </h2>
      <p
        style={{
          color: "rgba(255,255,255,0.44)",
          fontSize: 15,
          maxWidth: 520,
          marginBottom: 48,
          lineHeight: 1.75,
        }}
      >
        El inventario se guarda en{" "}
        <code
          style={{
            color: "#22c55e",
            background: "rgba(34,197,94,0.1)",
            padding: "2px 7px",
            borderRadius: 5,
            fontSize: 13,
            fontFamily: "'Fira Code', monospace",
          }}
        >
          inventario.json
        </code>{" "}
        — editable, portable, sin base de datos. Alertas automáticas para
        stock bajo o agotado.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {/* Tarjetas de productos */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {INVENTARIO_DEMO.map((p, i) => {
            const est = getEstado(p.stock, p.minimo);
            const isActive = sel === i;
            return (
              <div
                key={p.codigo}
                onClick={() => setSel(isActive ? null : i)}
                style={{
                  background: isActive
                    ? "rgba(34,197,94,0.08)"
                    : "#111a14",
                  border: `1px solid ${
                    isActive
                      ? "rgba(34,197,94,0.4)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  borderRadius: 12,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.22s",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 11,
                    color: "#22c55e",
                    marginBottom: 4,
                  }}
                >
                  {p.codigo}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#e8f5ee",
                    marginBottom: 10,
                  }}
                >
                  {p.nombre}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: est.bg,
                      color: est.color,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {est.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Fira Code', monospace",
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#e8f5ee",
                    }}
                  >
                    {p.stock}
                  </span>
                </div>
                {isActive && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.42)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div>
                      Precio:{" "}
                      <b style={{ color: "#22c55e" }}>
                        S/ {p.precio.toFixed(2)}
                      </b>
                    </div>
                    <div>
                      Mínimo:{" "}
                      <b style={{ color: "#f59e0b" }}>{p.minimo} uds</b>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Snippet Python del menú */}
        <div
          style={{
            background: "#0a0f0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(0,0,0,0.4)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'Fira Code', monospace",
            }}
          >
            factura_inventario.py — menú
          </div>
          <pre
            style={{
              margin: 0,
              padding: "22px 20px",
              fontSize: 13,
              lineHeight: 2,
              overflowX: "auto",
              fontFamily: "'Fira Code', monospace",
            }}
            dangerouslySetInnerHTML={{
              __html: `<span style="color:#22c55e">def</span> <span style="color:#60a5fa">menu</span>():
  inv = <span style="color:#f59e0b">cargar_inventario</span>()

  <span style="color:#22c55e">while</span> True:
    <span style="color:#a78bfa">print</span>(<span style="color:#fbbf24">"1. Ver inventario"</span>)
    <span style="color:#a78bfa">print</span>(<span style="color:#fbbf24">"2. Generar factura PDF"</span>)
    <span style="color:#a78bfa">print</span>(<span style="color:#fbbf24">"3. Actualizar stock"</span>)
    <span style="color:#a78bfa">print</span>(<span style="color:#fbbf24">"4. Salir"</span>)

    opcion = <span style="color:#a78bfa">input</span>(<span style="color:#fbbf24">"Opción: "</span>)

    <span style="color:#22c55e">if</span> opcion == <span style="color:#fbbf24">"1"</span>:
      <span style="color:#f59e0b">mostrar_inventario</span>(inv)
    <span style="color:#22c55e">elif</span> opcion == <span style="color:#fbbf24">"2"</span>:
      <span style="color:#f59e0b">generar_factura</span>(...)
    <span style="color:#22c55e">elif</span> opcion == <span style="color:#fbbf24">"3"</span>:
      <span style="color:#f59e0b">actualizar_stock</span>(inv)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── SECCIÓN FACTURAS ─────────────────────────────────────────────────────────
function SeccionFacturas() {
  const [ref, visible] = useFadeIn();
  const { total, igv, base } = calcFactura(FACTURA_DEMO.items);

  return (
    <section
      id="facturas"
      ref={ref}
      style={{
        padding: "6rem 3rem",
        background: "rgba(34,197,94,0.025)",
        borderTop: "1px solid rgba(34,197,94,0.08)",
        borderBottom: "1px solid rgba(34,197,94,0.08)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(44px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Badge>Módulo 2 — PDF con ReportLab</Badge>
        </div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(1.9rem, 3vw, 2.8rem)",
            fontWeight: 800,
            color: "#e8f5ee",
            letterSpacing: "-0.03em",
            marginBottom: 12,
          }}
        >
          Facturas PDF profesionales
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.44)",
            fontSize: 15,
            maxWidth: 520,
            marginBottom: 48,
            lineHeight: 1.75,
          }}
        >
          Generadas con{" "}
          <code
            style={{
              color: "#22c55e",
              background: "rgba(34,197,94,0.1)",
              padding: "2px 7px",
              borderRadius: 5,
              fontSize: 13,
              fontFamily: "'Fira Code', monospace",
            }}
          >
            reportlab
          </code>{" "}
          en A4. Incluye RUC, IGV 18%, tabla de ítems y totales. El stock se
          descuenta automáticamente al facturar.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* Preview factura */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
              color: "#111",
            }}
          >
            {/* Header verde */}
            <div
              style={{
                background: "#1a6b4a",
                padding: "18px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#fff",
                  }}
                >
                  Mi Negocio S.A.C.
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.62)",
                    marginTop: 2,
                  }}
                >
                  RUC: 20123456789 · Chiclayo, Perú
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 9.5,
                    color: "rgba(255,255,255,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Factura Electrónica
                </div>
                <div
                  style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}
                >
                  {FACTURA_DEMO.numero}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {FACTURA_DEMO.fecha}
                </div>
              </div>
            </div>

            {/* Datos cliente */}
            <div
              style={{
                background: "#f5f5f0",
                padding: "9px 22px",
                borderBottom: "1px solid #e0e0d8",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 2,
                }}
              >
                Cliente
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {FACTURA_DEMO.cliente.nombre}
              </div>
              <div style={{ fontSize: 11, color: "#777" }}>
                RUC: {FACTURA_DEMO.cliente.ruc}
              </div>
            </div>

            {/* Tabla ítems */}
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
            >
              <thead>
                <tr style={{ background: "#f9f9f6" }}>
                  {["Producto", "Cant.", "P.Unit.", "IGV", "Total"].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: "7px 12px",
                        textAlign: h === "Producto" ? "left" : "right",
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 9.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        borderBottom: "1px solid #e0e0d8",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FACTURA_DEMO.items.map((item, i) => {
                  const bu  = item.precio / 1.18;
                  const iu  = (item.precio * 0.18) / 1.18;
                  const tot = item.precio * item.cantidad;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #f0f0ec",
                        background: i % 2 === 0 ? "#fff" : "#fafaf7",
                      }}
                    >
                      <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                        {item.nombre}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        {item.cantidad}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontFamily: "monospace",
                        }}
                      >
                        S/ {bu.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontFamily: "monospace",
                        }}
                      >
                        S/ {iu.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        S/ {tot.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ padding: "12px 22px", borderTop: "1.5px solid #e0e0d8" }}>
              {[
                ["Valor venta (sin IGV)", base],
                ["IGV (18%)", igv],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#666",
                    marginBottom: 4,
                  }}
                >
                  <span>{l}</span>
                  <span style={{ fontFamily: "monospace" }}>
                    S/ {v.toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1.5px solid #1a6b4a",
                  marginTop: 8,
                  paddingTop: 8,
                  fontWeight: 800,
                  color: "#1a6b4a",
                  fontSize: 14,
                }}
              >
                <span>TOTAL A PAGAR</span>
                <span style={{ fontFamily: "monospace" }}>
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Features de facturación */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                icon: "🧾",
                title: "Formato A4 listo para imprimir",
                desc: "ReportLab genera márgenes profesionales, tipografía clara y diseño limpio.",
              },
              {
                icon: "🔢",
                title: "IGV 18% automático",
                desc: "Calcula base imponible, IGV y total sin intervención manual.",
              },
              {
                icon: "📦",
                title: "Descuenta stock al facturar",
                desc: "Al generar la factura, inventario.json se actualiza en el acto.",
              },
              {
                icon: "✅",
                title: "Validación de stock previo",
                desc: "Si el stock es insuficiente, el sistema avisa antes de generar el PDF.",
              },
            ].map(f => (
              <div
                key={f.title}
                style={{
                  background: "#111a14",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}
                >
                  {f.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#e8f5ee",
                      fontSize: 13.5,
                      marginBottom: 4,
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.36)",
                      fontSize: 13,
                      lineHeight: 1.65,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECCIÓN SETUP ────────────────────────────────────────────────────────────
function SeccionSetup() {
  const [ref, visible] = useFadeIn();
  const pasos = [
    {
      num: "01",
      cmd: "pip install reportlab",
      desc: "Única dependencia. Python 3.8+ requerido.",
    },
    {
      num: "02",
      cmd: "python factura_inventario.py",
      desc: "Lanza el menú interactivo en la terminal.",
    },
    {
      num: "03",
      cmd: "# Opción 1: ver inventario",
      desc: "Visualiza el stock actual con estados de alerta.",
    },
    {
      num: "04",
      cmd: "# Opción 2: generar factura",
      desc: "Ingresa productos y datos del cliente — PDF listo.",
    },
  ];
  return (
    <section
      id="setup"
      ref={ref}
      style={{
        padding: "6rem 3rem",
        maxWidth: 1200,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(44px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Badge>Inicio rápido</Badge>
      </div>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(1.9rem, 3vw, 2.8rem)",
          fontWeight: 800,
          color: "#e8f5ee",
          letterSpacing: "-0.03em",
          marginBottom: 12,
        }}
      >
        En 3 minutos ya funciona.
      </h2>
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 15,
          marginBottom: 48,
          lineHeight: 1.75,
        }}
      >
        Sin servidores, sin bases de datos. Un script, una dependencia.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {pasos.map(p => (
          <div
            key={p.num}
            style={{
              background: "#111a14",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: "rgba(34,197,94,0.2)",
                marginBottom: 12,
              }}
            >
              {p.num}
            </div>
            <code
              style={{
                display: "block",
                background: "#0a0f0d",
                color: "#22c55e",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 11.5,
                marginBottom: 12,
                fontFamily: "'Fira Code', monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {p.cmd}
            </code>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.36)",
                lineHeight: 1.65,
              }}
            >
              {p.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECCIÓN PRECIOS ──────────────────────────────────────────────────────────
function SeccionPrecios() {
  const [ref, visible] = useFadeIn();
  return (
    <section
      id="precios"
      ref={ref}
      style={{
        padding: "6rem 3rem",
        background: "rgba(0,0,0,0.28)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(44px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ marginBottom: 16 }}>
            <Badge>Planes</Badge>
          </div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(1.9rem, 3vw, 2.8rem)",
              fontWeight: 800,
              color: "#e8f5ee",
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Simple, sin sorpresas.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.36)", fontSize: 15 }}>
            Sin contratos anuales forzados. Cancela cuando quieras.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {PLANES.map(p => (
            <div
              key={p.nombre}
              style={{
                background: p.destacado
                  ? "rgba(34,197,94,0.07)"
                  : "#111a14",
                border: p.destacado
                  ? "1.5px solid rgba(34,197,94,0.35)"
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "28px 24px",
                position: "relative",
              }}
            >
              {p.destacado && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#22c55e",
                    color: "#0a0f0d",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "4px 14px",
                    borderRadius: 999,
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  MÁS POPULAR
                </div>
              )}
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#e8f5ee",
                  marginBottom: 8,
                }}
              >
                {p.nombre}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 30,
                    color: p.destacado ? "#22c55e" : "#e8f5ee",
                  }}
                >
                  {p.precio}
                </span>
                <span
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}
                >
                  {p.periodo}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.38)",
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                {p.desc}
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingTop: 20,
                  marginBottom: 24,
                }}
              >
                {p.features.map(f => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        color: "#22c55e",
                        fontSize: 13,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ✓
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.52)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              <Btn
                variant={p.destacado ? "primary" : "outline"}
                style={{ width: "100%" }}
              >
                {p.cta}
              </Btn>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "2.5rem 3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 18,
          color: "#e8f5ee",
        }}
      >
        Stock<span style={{ color: "#22c55e" }}>.</span>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
        © 2026 Stock. Hecho para emprendedores peruanos 🇵🇪
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
        Chiclayo, Lambayeque, Perú
      </p>
    </footer>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const sections = ["inventario", "facturas", "setup", "precios"];
    const handleScroll = () => {
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 80) {
          setActiveSection(id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ background: "#0a0f0d", minHeight: "100vh" }}>
      <Nav active={activeSection} />
      <Hero />
      <SeccionInventario />
      <SeccionFacturas />
      <SeccionSetup />
      <SeccionPrecios />
      <Footer />
    </div>
  );
}
