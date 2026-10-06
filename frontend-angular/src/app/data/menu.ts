export interface MenuLeaf {
  title: string;
  path: string;
  icon: string; // Using string identifiers for easy rendering via lucide-angular or svg
  description?: string;
}

export interface MenuNode extends MenuLeaf {
  children?: MenuNode[];
}

export const menu: MenuNode[] = [
  { title: "Dashboard", path: "/app", icon: "layout-dashboard" },
  {
    title: "Proveedores", path: "/app/proveedores", icon: "users",
    children: [
      { title: "Directorio de Proveedores", path: "/app/proveedores/directorio", icon: "users", description: "Lista general con buscador y filtros (datos básicos, zonas, documentos, contactos, evaluación)." },
      { title: "Solicitudes de Ingreso", path: "/app/proveedores/solicitudes", icon: "user-check", description: "Bandeja para aprobación de nuevos registros." },
      { title: "Notificaciones", path: "/app/proveedores/notificaciones", icon: "bell", description: "Cartas de referencia, selección y observaciones." },
    ],
  },
  {
    title: "Comité", path: "/app/comite", icon: "gavel",
    children: [
      { title: "Comités", path: "/app/comite/lista", icon: "gavel", description: "Comités existentes y reglas de negocio (montos máximos)." },
      { title: "Miembros de Comités", path: "/app/comite/miembros", icon: "users-round" },
      { title: "Casos por Comité", path: "/app/comite/casos", icon: "briefcase", description: "Código, tipo, fecha, asistentes, casos, montos, decisión." },
    ],
  },
  { title: "Solicitudes", path: "/app/compras/requerimientos", icon: "clipboard-edit", description: "Gestión de solicitudes de compras y servicios." },
  {
    title: "Compras", path: "/app/compras", icon: "shopping-cart",
    children: [
      { title: "Licitación / Selección", path: "/app/compras/presupuestos", icon: "scale", description: "Licitación / cotización y cuadro comparativo de proveedores." },
      { title: "Órdenes de Compra", path: "/app/compras/ordenes", icon: "file-signature" },
      { title: "Recepciones de Almacén", path: "/app/compras/recepciones", icon: "package-check", description: "Registro de lo entregado vs lo pedido." },
    ],
  },
  {
    title: "Gestión Presupuestaria", path: "/app/presupuesto", icon: "pie-chart",
    children: [
      { title: "Configuración", path: "/app/presupuesto/configuracion", icon: "settings-2", description: "Límites estrictos, ejercicio fiscal, maestro de partidas, centros de costo y bloqueos." },
      { title: "Formulación Anual", path: "/app/presupuesto/formulacion", icon: "file-spreadsheet", description: "Formulación y carga del presupuesto anual." },
      { title: "Trazabilidad y Fondos", path: "/app/presupuesto/trazabilidad", icon: "git-commit", description: "Reserva de fondos: Pre-comprometido, Comprometido, Causado y Pagado." },
      { title: "Modificaciones Presupuestarias", path: "/app/presupuesto/modificaciones", icon: "arrow-left-right", description: "Traspasos, créditos adicionales y reducciones presupuestarias." },
      { title: "Consultas y Reportes", path: "/app/presupuesto/reportes", icon: "bar-chart-3", description: "Ejecución presupuestaria, desviaciones y drill-down documental." },
    ],
  },
  {
    title: "Tesorería y Finanzas", path: "/app/tesoreria", icon: "wallet",
    children: [
      { title: "Cuentas por Pagar", path: "/app/tesoreria/cxp", icon: "receipt" },
      { title: "Retenciones", path: "/app/tesoreria/retenciones", icon: "file-text", description: "IVA e ISLR — comprobantes." },
      { title: "Pagos", path: "/app/tesoreria/pagos", icon: "banknote" },
      {
        title: "Caja Chica", path: "/app/tesoreria/caja-chica", icon: "piggy-bank",
        children: [
          { title: "Parámetros", path: "/app/tesoreria/caja-chica/parametros", icon: "settings-2" },
          { title: "Movimientos", path: "/app/tesoreria/caja-chica/movimientos", icon: "arrow-left-right" },
          { title: "Soportes", path: "/app/tesoreria/caja-chica/soportes", icon: "file-box" },
        ],
      },
      {
        title: "Viáticos", path: "/app/tesoreria/viaticos", icon: "plane",
        children: [
          { title: "Parámetros", path: "/app/tesoreria/viaticos/parametros", icon: "settings-2" },
          { title: "Solicitud de Viáticos", path: "/app/tesoreria/viaticos/solicitud", icon: "file-plus" },
          { title: "Movimientos de la Solicitud", path: "/app/tesoreria/viaticos/movimientos", icon: "arrow-left-right" },
          { title: "Soportes", path: "/app/tesoreria/viaticos/soportes", icon: "file-box" },
        ],
      },
    ],
  },
  { title: "Interfaz Contable Central", path: "/app/contabilidad", icon: "arrow-left-right", description: "Transmisión de asientos contables y mapeo de cuentas con la Contabilidad Central." },
  {
    title: "Reportes y Análisis", path: "/app/reportes", icon: "bar-chart-3",
    children: [
      { title: "Gastos", path: "/app/reportes/gastos", icon: "trending-up", description: "Gastos por categoría — en qué se está gastando." },
    ],
  },
  {
    title: "Configuración Base", path: "/app/configuracion", icon: "sliders-horizontal",
    children: [
      { title: "Compañía", path: "/app/configuracion/compania", icon: "building-2" },
      { title: "Parámetros", path: "/app/configuracion/parametros", icon: "sliders-horizontal", description: "Países, ciudades, bancos, monedas, etc." },
      { title: "Lista de Valores", path: "/app/configuracion/lista-valores", icon: "list-checks" },
    ],
  },
  { title: "Auditoría", path: "/app/auditoria", icon: "scroll-text" },
  {
    title: "Seguridad", path: "/app/seguridad", icon: "shield",
    children: [
      { title: "Usuarios", path: "/app/seguridad/usuarios", icon: "key-round" },
      { title: "Roles", path: "/app/seguridad/roles", icon: "shield-check" },
    ],
  },
];

export function flatten(nodes: MenuNode[] = menu, acc: MenuLeaf[] = []): MenuLeaf[] {
  for (const n of nodes) {
    acc.push({ title: n.title, path: n.path, icon: n.icon, description: n.description });
    if (n.children) flatten(n.children, acc);
  }
  return acc;
}
