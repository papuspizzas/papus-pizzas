import { useState, useEffect } from "react";

const SUPABASE_URL = "https://pljdhkukpdtdcgeaunvd.supabase.co";
const SUPABASE_KEY = "sb_publishable_4DObrGRuvugUw7Fs6zEyKw_qx5mQdqz";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
};

async function dbGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?order=id.desc`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbInsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE", headers,
  });
  if (!res.ok) throw new Error(await res.text());
}

async function dbUpdate(table, id, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers, body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const COLORS = {
  bg: "#1a0a00", card: "#2a1200", accent: "#ff6b00", accentLight: "#ff9a3c",
  red: "#e63946", green: "#2dc653", yellow: "#ffd60a",
  text: "#fff8f0", muted: "#a07850", border: "#3d1f00",
};

const TABS = [
  { id: "resumen", label: "📊 Resumen" },
  { id: "ventas", label: "💰 Ventas" },
  { id: "gastos", label: "💸 Gastos" },
  { id: "inventario", label: "📦 Inventario" },
  { id: "pagos", label: "👥 Pagos" },
];

const CATEGORIAS = ["Ingredientes", "Servicios", "Empaque", "Equipo", "Renta", "Otros"];
const EMPLEADOS = ["Empleado 1", "Tú", "Tu novio/a"];

function today() { return new Date().toISOString().split("T")[0]; }
function formatCurrency(n) { return "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 }); }

function Card({ children, style = {} }) {
  return <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>;
}

function Badge({ color, children }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{children}</span>;
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ color: COLORS.muted, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{label.toUpperCase()}</label>}
      <input {...props} style={{ background: "#0f0600", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none", fontFamily: "inherit", ...props.style }} />
    </div>
  );
}

function Btn({ children, onClick, color = COLORS.accent, small, danger, outline, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: danger ? COLORS.red : outline ? "transparent" : color,
      border: outline ? `1px solid ${color}` : "none",
      color: outline ? color : "#fff",
      borderRadius: 8, padding: small ? "6px 14px" : "10px 20px",
      fontWeight: 700, fontSize: small ? 12 : 14, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}

function StatCard({ label, value, color = COLORS.accent, sub }) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <div style={{ color: COLORS.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ color, fontSize: 26, fontWeight: 900 }}>{value}</div>
      {sub && <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function Spinner() {
  return <div style={{ textAlign: "center", padding: 40, color: COLORS.muted }}>Cargando... 🍕</div>;
}

// ── RESUMEN ──────────────────────────────────────────────────────────────────
function Resumen({ ventas, gastos, inventario, pagos }) {
  const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0);
  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const totalPagos = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const ganancia = totalVentas - totalGastos - totalPagos;
  const bajoStock = inventario.filter(i => Number(i.cantidad) <= Number(i.minimo));

  const ventasDia = {};
  ventas.forEach(v => { ventasDia[v.fecha] = (ventasDia[v.fecha] || 0) + Number(v.total); });
  const recentVentas = Object.entries(ventasDia).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7).reverse();
  const maxVenta = Math.max(...recentVentas.map(r => r[1]), 1);

  const movimientos = [
    ...ventas.map(v => ({ ...v, tipo: "venta", desc: v.descripcion })),
    ...gastos.map(g => ({ ...g, tipo: "gasto", desc: g.concepto })),
    ...pagos.map(p => ({ ...p, tipo: "pago", desc: `Pago a ${p.empleado}` })),
  ].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <StatCard label="Total Ventas" value={formatCurrency(totalVentas)} color={COLORS.green} />
        <StatCard label="Total Gastos" value={formatCurrency(totalGastos + totalPagos)} color={COLORS.red} />
        <StatCard label="Ganancia Neta" value={formatCurrency(ganancia)} color={ganancia >= 0 ? COLORS.green : COLORS.red} />
        <StatCard label="Órdenes" value={ventas.length} color={COLORS.accentLight} sub="ventas registradas" />
      </div>

      {bajoStock.length > 0 && (
        <Card style={{ borderColor: COLORS.yellow + "66" }}>
          <div style={{ color: COLORS.yellow, fontWeight: 800, marginBottom: 10 }}>⚠️ STOCK BAJO</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {bajoStock.map(i => <Badge key={i.id} color={COLORS.yellow}>{i.nombre}: {i.cantidad} {i.unidad}</Badge>)}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>VENTAS POR DÍA</div>
        {recentVentas.length === 0
          ? <div style={{ color: COLORS.muted }}>Sin ventas aún</div>
          : recentVentas.map(([fecha, monto]) => (
            <div key={fecha} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ color: COLORS.muted, fontSize: 12, minWidth: 90 }}>{fecha}</div>
              <div style={{ flex: 1, background: COLORS.border, borderRadius: 4, height: 10 }}>
                <div style={{ width: Math.round((monto / maxVenta) * 100) + "%", height: "100%", background: COLORS.accent, borderRadius: 4 }} />
              </div>
              <div style={{ color: COLORS.accentLight, fontWeight: 700, minWidth: 80, textAlign: "right" }}>{formatCurrency(monto)}</div>
            </div>
          ))}
      </Card>

      <Card>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>ÚLTIMOS MOVIMIENTOS</div>
        {movimientos.length === 0
          ? <div style={{ color: COLORS.muted }}>Sin movimientos aún</div>
          : movimientos.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{m.tipo === "venta" ? "💰" : m.tipo === "gasto" ? "💸" : "👥"}</span>
                <div>
                  <div style={{ color: COLORS.text, fontSize: 13 }}>{m.desc}</div>
                  <div style={{ color: COLORS.muted, fontSize: 11 }}>{m.fecha}</div>
                </div>
              </div>
              <div style={{ color: m.tipo === "venta" ? COLORS.green : COLORS.red, fontWeight: 700 }}>
                {m.tipo === "venta" ? "+" : "-"}{formatCurrency(m.total || m.monto)}
              </div>
            </div>
          ))}
      </Card>
    </div>
  );
}

// ── VENTAS ───────────────────────────────────────────────────────────────────
function Ventas({ ventas, reload }) {
  const [form, setForm] = useState({ fecha: today(), descripcion: "", total: "" });
  const [loading, setLoading] = useState(false);

  const agregar = async () => {
    if (!form.descripcion || !form.total) return;
    setLoading(true);
    await dbInsert("ventas", { ...form, total: Number(form.total) });
    setForm({ fecha: today(), descripcion: "", total: "" });
    await reload("ventas");
    setLoading(false);
  };

  const eliminar = async (id) => {
    await dbDelete("ventas", id);
    await reload("ventas");
  };

  const total = ventas.reduce((s, v) => s + Number(v.total), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>REGISTRAR VENTA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          <Input label="Descripción" placeholder="Ej: 5 pizzas medianas" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          <Input label="Total ($)" type="number" placeholder="0.00" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} />
        </div>
        <Btn onClick={agregar} disabled={loading}>{loading ? "Guardando..." : "+ Agregar Venta"}</Btn>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>{ventas.length} VENTAS</div>
        <Badge color={COLORS.green}>Total: {formatCurrency(total)}</Badge>
      </div>

      {ventas.map(v => (
        <Card key={v.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: COLORS.text, fontWeight: 600 }}>{v.descripcion}</div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{v.fecha}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: COLORS.green, fontWeight: 800, fontSize: 18 }}>{formatCurrency(v.total)}</span>
              <Btn small danger onClick={() => eliminar(v.id)}>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      {ventas.length === 0 && <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Sin ventas registradas</div>}
    </div>
  );
}

// ── GASTOS ───────────────────────────────────────────────────────────────────
function Gastos({ gastos, reload }) {
  const [form, setForm] = useState({ fecha: today(), concepto: "", categoria: "Ingredientes", monto: "" });
  const [loading, setLoading] = useState(false);

  const agregar = async () => {
    if (!form.concepto || !form.monto) return;
    setLoading(true);
    await dbInsert("gastos", { ...form, monto: Number(form.monto) });
    setForm({ fecha: today(), concepto: "", categoria: "Ingredientes", monto: "" });
    await reload("gastos");
    setLoading(false);
  };

  const eliminar = async (id) => { await dbDelete("gastos", id); await reload("gastos"); };
  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>REGISTRAR GASTO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          <Input label="Concepto" placeholder="Ej: Queso mozzarella" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ color: COLORS.muted, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>CATEGORÍA</label>
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={{ background: "#0f0600", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 14, fontFamily: "inherit" }}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Monto ($)" type="number" placeholder="0.00" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
        </div>
        <Btn onClick={agregar} color={COLORS.red} disabled={loading}>{loading ? "Guardando..." : "+ Agregar Gasto"}</Btn>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>{gastos.length} GASTOS</div>
        <Badge color={COLORS.red}>Total: {formatCurrency(total)}</Badge>
      </div>

      {gastos.map(g => (
        <Card key={g.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: COLORS.text, fontWeight: 600 }}>{g.concepto}</span>
                <Badge color={COLORS.muted}>{g.categoria}</Badge>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{g.fecha}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: COLORS.red, fontWeight: 800, fontSize: 18 }}>{formatCurrency(g.monto)}</span>
              <Btn small danger onClick={() => eliminar(g.id)}>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      {gastos.length === 0 && <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Sin gastos registrados</div>}
    </div>
  );
}

// ── INVENTARIO ───────────────────────────────────────────────────────────────
function Inventario({ inventario, reload }) {
  const [form, setForm] = useState({ nombre: "", cantidad: "", minimo: "", unidad: "kg" });
  const [editId, setEditId] = useState(null);
  const [editCantidad, setEditCantidad] = useState("");
  const [loading, setLoading] = useState(false);

  const agregar = async () => {
    if (!form.nombre || !form.cantidad) return;
    setLoading(true);
    await dbInsert("inventario", { ...form, cantidad: Number(form.cantidad), minimo: Number(form.minimo) });
    setForm({ nombre: "", cantidad: "", minimo: "", unidad: "kg" });
    await reload("inventario");
    setLoading(false);
  };

  const actualizar = async (id) => {
    await dbUpdate("inventario", id, { cantidad: Number(editCantidad) });
    setEditId(null);
    await reload("inventario");
  };

  const eliminar = async (id) => { await dbDelete("inventario", id); await reload("inventario"); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>AGREGAR INGREDIENTE</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Input label="Nombre" placeholder="Ej: Champiñones" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <Input label="Cantidad" type="number" placeholder="0" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} />
          <Input label="Mínimo" type="number" placeholder="0" value={form.minimo} onChange={e => setForm(f => ({ ...f, minimo: e.target.value }))} />
          <Input label="Unidad" placeholder="kg, lt, pzas" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} />
        </div>
        <Btn onClick={agregar} color={COLORS.accentLight} disabled={loading}>{loading ? "Guardando..." : "+ Agregar"}</Btn>
      </Card>

      {inventario.map(item => {
        const bajo = Number(item.cantidad) <= Number(item.minimo);
        const pct = Math.min(100, Math.round((Number(item.cantidad) / Math.max(Number(item.minimo) * 2, 1)) * 100));
        return (
          <Card key={item.id} style={{ borderColor: bajo ? COLORS.yellow + "66" : COLORS.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: COLORS.text, fontWeight: 700 }}>{item.nombre}</span>
                  {bajo && <Badge color={COLORS.yellow}>⚠️ Stock bajo</Badge>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, background: COLORS.border, borderRadius: 4, height: 8 }}>
                    <div style={{ width: pct + "%", height: "100%", background: bajo ? COLORS.yellow : COLORS.green, borderRadius: 4 }} />
                  </div>
                  <span style={{ color: bajo ? COLORS.yellow : COLORS.green, fontWeight: 700, fontSize: 14, minWidth: 90 }}>
                    {item.cantidad} / {item.minimo} {item.unidad}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                {editId === item.id ? (
                  <>
                    <input value={editCantidad} onChange={e => setEditCantidad(e.target.value)} type="number"
                      style={{ width: 70, background: "#0f0600", border: `1px solid ${COLORS.accent}`, borderRadius: 6, padding: "4px 8px", color: COLORS.text, fontFamily: "inherit" }} />
                    <Btn small onClick={() => actualizar(item.id)}>✓</Btn>
                    <Btn small outline color={COLORS.muted} onClick={() => setEditId(null)}>✕</Btn>
                  </>
                ) : (
                  <>
                    <Btn small outline color={COLORS.accent} onClick={() => { setEditId(item.id); setEditCantidad(item.cantidad); }}>Editar</Btn>
                    <Btn small danger onClick={() => eliminar(item.id)}>✕</Btn>
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      {inventario.length === 0 && <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Sin ingredientes registrados</div>}
    </div>
  );
}

// ── PAGOS ────────────────────────────────────────────────────────────────────
function Pagos({ pagos, reload }) {
  const [form, setForm] = useState({ fecha: today(), empleado: "Empleado 1", concepto: "Sueldo semanal", monto: "" });
  const [loading, setLoading] = useState(false);

  const agregar = async () => {
    if (!form.monto) return;
    setLoading(true);
    await dbInsert("pagos", { ...form, monto: Number(form.monto) });
    setForm({ fecha: today(), empleado: "Empleado 1", concepto: "Sueldo semanal", monto: "" });
    await reload("pagos");
    setLoading(false);
  };

  const eliminar = async (id) => { await dbDelete("pagos", id); await reload("pagos"); };

  const totalPorEmpleado = {};
  pagos.forEach(p => { totalPorEmpleado[p.empleado] = (totalPorEmpleado[p.empleado] || 0) + Number(p.monto); });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>REGISTRAR PAGO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ color: COLORS.muted, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>EMPLEADO</label>
            <select value={form.empleado} onChange={e => setForm(f => ({ ...f, empleado: e.target.value }))} style={{ background: "#0f0600", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 14, fontFamily: "inherit" }}>
              {EMPLEADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <Input label="Concepto" placeholder="Sueldo, bono, etc." value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} />
          <Input label="Monto ($)" type="number" placeholder="0.00" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
        </div>
        <Btn onClick={agregar} color="#9b5de5" disabled={loading}>{loading ? "Guardando..." : "+ Registrar Pago"}</Btn>
      </Card>

      {Object.keys(totalPorEmpleado).length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(totalPorEmpleado).map(([emp, total]) => (
            <StatCard key={emp} label={emp} value={formatCurrency(total)} color="#9b5de5" sub="pagado total" />
          ))}
        </div>
      )}

      {pagos.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: COLORS.text, fontWeight: 600 }}>{p.concepto}</span>
                <Badge color="#9b5de5">{p.empleado}</Badge>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{p.fecha}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#9b5de5", fontWeight: 800, fontSize: 18 }}>{formatCurrency(p.monto)}</span>
              <Btn small danger onClick={() => eliminar(p.id)}>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      {pagos.length === 0 && <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Sin pagos registrados</div>}
    </div>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("resumen");
  const [data, setData] = useState({ ventas: [], gastos: [], inventario: [], pagos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    try {
      const [ventas, gastos, inventario, pagos] = await Promise.all([
        dbGet("ventas"), dbGet("gastos"), dbGet("inventario"), dbGet("pagos"),
      ]);
      setData({ ventas, gastos, inventario, pagos });
      setError(null);
    } catch (e) {
      setError("Error conectando a la base de datos: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const reload = async (table) => {
    const rows = await dbGet(table);
    setData(d => ({ ...d, [table]: rows }));
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #2a1200, #1a0800)", borderBottom: `2px solid ${COLORS.accent}33`, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 40 }}>🍕</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.accent, letterSpacing: -0.5, lineHeight: 1 }}>Papus Pizzas</div>
          <div style={{ color: COLORS.muted, fontSize: 12, letterSpacing: 2 }}>SISTEMA DE ADMINISTRACIÓN · EN LA NUBE ☁️</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Btn small outline color={COLORS.muted} onClick={loadAll}>↻ Sync</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? COLORS.accent + "22" : "transparent",
            border: "none", borderBottom: `2px solid ${tab === t.id ? COLORS.accent : "transparent"}`,
            color: tab === t.id ? COLORS.accent : COLORS.muted,
            padding: "14px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
        {error && (
          <Card style={{ borderColor: COLORS.red + "66", marginBottom: 20 }}>
            <div style={{ color: COLORS.red }}>❌ {error}</div>
          </Card>
        )}
        {loading ? <Spinner /> : (
          <>
            {tab === "resumen" && <Resumen {...data} />}
            {tab === "ventas" && <Ventas ventas={data.ventas} reload={reload} />}
            {tab === "gastos" && <Gastos gastos={data.gastos} reload={reload} />}
            {tab === "inventario" && <Inventario inventario={data.inventario} reload={reload} />}
            {tab === "pagos" && <Pagos pagos={data.pagos} reload={reload} />}
          </>
        )}
      </div>
    </div>
  );
}
