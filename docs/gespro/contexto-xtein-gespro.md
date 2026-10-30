# Contexto: Xtein y GESPRO

Documento autocontenido para dar contexto a un chat que no conoce Xtein y no tiene acceso al código, a la base de datos ni a los artefactos. Fecha: 27 de octubre de 2026. Todo está en español neutro colombiano; la empresa de ejemplo en los diseños es **ARTDECON** (fábrica de muebles: sofás, poltronas, tapicería).

---

## 1. Qué es Xtein

**Xtein** es un ERP web para empresas colombianas (industria y comercio) hecho por la empresa Xtein. Se usa en el navegador y tiene módulos para toda la operación:

| Módulo del menú | Qué cubre |
|---|---|
| Administrador | configuración general, empresas, usuarios |
| Dispositivo asistencia | control de asistencia |
| Calidad | no conformidades, planes de acción (aplicación CAL-002) |
| Compras | órdenes de compra (OC), proveedores, seguimiento de compras |
| Cuentas por Cobrar / por Pagar | cartera |
| Financiero | contabilidad |
| **Gestión** | Áreas funcionales, **Gespro** (actividades), Organigrama, Plantillas, Proyectos, Roles, Usuarios gestor |
| Gestión Humana | personal, ausencias, cargos |
| Inventarios | bodegas, existencias, mínimos |
| Producción | órdenes de producción (OP), lotes |
| SIPROC | procesos |
| Ventas | pedidos (PV), cotizaciones, clientes |

Conceptos transversales:
- **Multiempresa**: cada empresa cliente tiene su propia base de datos SQL Server; el usuario elige empresa al iniciar sesión y el token lleva la empresa.
- **Documentos del ERP**: OC (orden de compra, p. ej. OC-4518), OP (orden de producción, p. ej. OP-3307), PV (pedido de venta), INC (incidencia / no conformidad, p. ej. INC-0139), PA (plan de acción, p. ej. PA-0139), SC (solicitud de compra).
- **Áreas funcionales y organigrama**: cada persona pertenece a un área (Administrativa, Compras, Calidad, Producción, Mantenimiento, Ventas, Gestión Humana, TI…) y a un cargo del organigrama, con jefe.
- **Agentes**: Xtein está incorporando agentes de IA y procesos autónomos (p. ej. un agente de inventarios que detecta consumo anormal; copias de seguridad automáticas; n8n). Ya existe un catálogo de agentes con permisos y auditoría (aplicaciones AGT-001/002).
- **Identificadores de aplicación**: cada pantalla del ERP es una «aplicación» con código (GES-001, CAL-002, COM-201, VEN-210…) que aparece en el árbol de menú del usuario según sus permisos.

### 1.1 Tecnología (solo lo necesario para entender decisiones)

- **Plataforma legada (en producción)**: front Angular 15 con DevExtreme, PrimeNG y Material (`xtein-web-2.0`); back Node/Express (`apiRest`) sobre SQL Server. Todo el back sigue un único protocolo: `POST /api/{APP}/{ruta}` con un «sobre» `{ prmAccion, prmDatos (JSON en texto), prmConexion { EMPRESA }, prmTokenDatos }`; cada aplicación tiene un procedimiento almacenado (SP) grande que recibe `@ACCION` y `@DATA_JSON` y hace de todo (consulta, new, update, delete, acciones sobrecargadas). Los IDs nuevos se calculan a veces en el cliente (`max+1`). Permisos mayormente en el cliente.
- **Plataforma nueva (en construcción)**: `xtein-platform`, Angular 21 con **Native Federation**: un **Shell** (menú lateral de módulos, encabezado con logo de la empresa, búsqueda, notificaciones, bandeja, usuario, pestañas de trabajo) que carga micro-frontends `mfe-*` por módulo (mfe-mcom compras, mfe-inv inventarios, mfe-prod, mfe-mfin, mfe-mthu, etc.). Librerías compartidas: `@xtein/ui` (componentes), `api-client` (`XteinApiClientService`, que hoy arma el sobre `prmAccion`), `session` (`SessionService`). Hay además una especificación aprobada para rehacer el back en **.NET** con REST (`/api/v2/...`, OpenAPI, paginación estándar, sin el sobre `prmAccion`), con GESPRO fuera de su primer hito.
- Entornos: desarrollo compartido en `192.168.11.151` (base y front de desarrollo que otros también modifican; que cambien datos ahí no es un incidente) y la web de desarrollo `xteinweb.dev.colchonessunmoon.com`.
- Marca: azul `#0F4C81`, verde `#35CCAC`; tipografía Plus Jakarta Sans (títulos Sora).

---

## 2. Qué es GESPRO hoy (lo que se va a reemplazar)

GESPRO (aplicación **GES-001**, dentro del módulo Gestión) es el gestor de actividades de la empresa. Hoy:

- **Una sola entidad «Actividad»** con `CLASE` = TAREAS · RESPONSABILIDADES · EVENTOS · COMUNITARIAS · NODOS, con jerarquía padre/hijas (`ID_ACTIVIDAD` / `ID_ACTIVIDAD_PADRE`) y nodos virtuales raíz (−10 tareas, −20 responsabilidades, −30 eventos, −40 planes de acción, −50 comunitarias). Campos: responsable, colaboradores, asignado por, estado, programación (recurrencia RRULE, recordatorios, sincronización con Google Calendar), avance fijo 0/25/50/75/100 acoplado al estado, descripción, comentarios/chat, adjuntos, timeline de auditoría, notificaciones por WebSocket.
- **Estados**: Sin Iniciar → En Proceso ↔ En Pausa → Finalizado (+ Completada/Ejecutada/Descartada).
- **Pantalla**: un árbol (TreeList DevExtreme) con 9 columnas + pestaña Calendario; el detalle es un popup con formulario a la izquierda y chat/timeline a la derecha; menú contextual con 9 acciones; reglas ocultas que se descubren con errores.
- **Aplicaciones relacionadas**: GES-006 **Plantillas** (plantilla = cabecera + árbol de actividades con orden, objetivo, ejecutable, responsable y precedentes; sin duración), GES-007 **Proyectos** (cabecera con responsable, plantilla obligatoria, fechas, sub-estado y avance; vistas Kanban, Formulario y Gantt; las tareas del proyecto son actividades de GESPRO), GES-002 Organigrama, GES-005 Áreas, Roles (catálogo de cargos sin relación con las responsabilidades), CAL-002 **Planes de acción** de calidad (origen, causa interna/cliente, producto, análisis de causa, tareas; usa el mismo motor de actividades, nodo −40).
- **Por qué el personal no lo usa**: «demora mucho gestionar una tarea» (crear = expandir → hover → + → editar fila → guardar; cada cosa abre otro popup; recarga completa al guardar), «es complicado» (árbol que mezcla conceptos, reglas ocultas), «es aburrido» (grid gris tipo ERP, sin «lo mío de hoy»), y en el celular no sirve.
- **Hallazgos del análisis**: Plantillas y Proyectos son el mismo concepto en dos módulos (más de 600 líneas duplicadas; un proyecto no se puede crear sin plantilla; la plantilla no guarda duración y al instanciarla todas las tareas quedan con fecha de hoy; se pierden objetivo y ejecutable); los planes de acción de Calidad están aislados; estados con tres nombres distintos; IDs generados en el cliente; fuga potencial entre empresas por tomar `EMPRESA` del cuerpo de la petición.

---

## 3. Visión del nuevo GESPRO (definida por la empresa)

> **GESPRO es el gestor de procesos y productividad de las personas y de los agentes.** Organiza y documenta los procesos y las responsabilidades de cada rol, y registra y mide el trabajo de las personas de la empresa —humanas y sintéticas— midiendo su productividad. Lo que hoy se llama «Gestión» pasa a llamarse GESPRO (Áreas funcionales, Organigrama, Actividades, Plantillas, Proyectos, Roles, Usuarios gestor).

- **Todo Xtein genera actividades**: una OC dispara la gestión con el proveedor; una copia de seguridad fallida abre una tarea; un agente que detecta consumo anormal crea una actividad al responsable de compras; cualquier autorización se programa como actividad de aprobación; los planes de acción de calidad derivan en acciones correctivas que son actividades.
- **Un solo lugar para el trabajo de cada persona**: administrar la «lluvia de actividades» de forma simple.
- **Tipos de trabajo** que definen el comportamiento del flujo: Ingeniería y desarrollo (etapas ágiles o cascada, hitos), Infraestructura y obras (fases secuenciales, cronograma), Operación y soporte (tickets, SLA), Gestión y calidad (PHVA, causales, auditoría), Gobierno y coordinación (reuniones: agenda, compromisos, minutas), Desarrollo interno (metas personales, capacitación).
- **Proyectos con flujo y compuertas**: p. ej. el ciclo de desarrollo de producto de ARTDECON (ideación → sistema constructivo → desarrollo: diseño técnico y prototipado) con etapas de aprobación para pasar de un paso al siguiente.
- **Por etapas**: *Etapa 1* = actividades, proyectos (actividad maestra; hoy plantillas y proyectos), planes de acción de calidad, notificaciones, conversación y reuniones. *Fase 2* = con IA, ayudar a priorizar (Pareto, aprender a renunciar).

---

## 4. Decisiones de diseño ya tomadas (entrevista del 27 oct 2026, no reabrir)

1. **Proceso = responsabilidades recurrentes del rol**, documentadas en un **manual del cargo** dentro de Roles; al asignar el rol a una persona se generan sus responsabilidades y aparecen en Mi día cuando tocan (ej. proyección de compras cada martes).
2. **Compuerta de etapa bloquea la etapa siguiente**; el aprobador viene de la plantilla (por rol); la aprobación es una actividad en su Mi día con evidencias; el rechazo devuelve la etapa.
3. **Reglas de generación de actividades configurables en Ajustes, sin código**: evento (módulo + tipo) → plantilla de actividad → responsable por rol/área, SLA, prioridad. Los módulos solo emiten eventos. Límite 20 actividades por evento, profundidad máxima 3.
4. **Productividad = cumplimiento de lo asignado** (cerradas a tiempo vs. asignadas, carga, atrasos). Horas opcionales por equipo.
5. **Chat interno = conversación por actividad** (menciones, adjuntos, historial, notificaciones). Sin mensajería suelta ni canales.
6. **Primera salida = Etapa 1 completa para toda la empresa** (no piloto, no mínimo).
7. **Agente = ejecutor con responsable humano**: aparece como actor en el historial, se mide su cumplimiento, y el servidor rechaza que un agente cierre una actividad.
8. **Éxito a 90 días**: adopción ≥ 80 % (personas con ≥ 1 acción en ≥ 3 de 5 días hábiles ÷ personal activo), cierre a tiempo ≥ 85 %, 100 % de roles con manual.
9. **Fuera de la Etapa 1**: solo registro de horas, cronómetro, hoja de tiempo y costeo (se diseñan, no se construyen). Scrum opcional, incidencias de 4 categorías, PWA y app en tiendas sí entran.
10. **El manual del cargo vive en Roles** como plantilla del cargo.
11. **Responsabilidades individuales por defecto**; cada una puede marcarse **«por equipo»** (se asigna al líder del área, que reparte).
12. **Ausencias**: Gestión Humana las registra; GESPRO avisa al líder y le muestra qué reasignar con el **suplente** sugerido por rol; al regresar, las recurrentes vuelven al titular.
13. **Visibilidad** = jerarquía del organigrama (líder ve su equipo, gerencia todo) + quien asignó la actividad aunque esté fuera de la jerarquía + responsable del proyecto.
14. **Tipos de trabajo administrables** (6 de semilla); cada tipo define flujo de estados, etapas con compuertas, SLA, Scrum opcional y campos extra.
15. **Notificaciones**: siempre bandeja de Xtein; push por defecto; correo solo aprobaciones y vencimientos; preferencias por persona; sin WhatsApp. Escalamiento al líder a las 24 h de vencida.
16. **Prioridad** la fija quien asigna (o la regla); el responsable puede proponer otra con aviso. **Mi día ordena**: atrasadas → hoy por prioridad y hora → próximas.
17. **GESPRO es la agenda oficial** (reuniones + actividades con hora): disponibilidad al convocar, bloquea o advierte cruces, **sincronización bidireccional** con Google/Outlook.
18. **Reunión** = puntos de agenda + asistentes + **minuta en vivo**; cada **compromiso** (responsable, fecha) se vuelve actividad al cerrar; minuta enviada a los asistentes. Minuta con IA: fase siguiente.
19. **Etapa = actividad padre de nivel 1 del proyecto** con la compuerta como propiedad; su avance se calcula con las hijas. Un solo árbol para etapas, tareas, Gantt y actividad maestra.
20. **Administración**: rol **Administrador GESPRO** (tipos de trabajo, reglas, flujos), líderes de área (plantillas y manuales de su área), Calidad (plantillas de plan de acción); permisos parametrizados en los roles de usuario de Xtein.

Decisiones anteriores ya cerradas: PWA + app en tiendas con Capacitor; incidencias de 4 categorías (software, calidad/no conformidad con CAPA, mantenimiento, cliente/PQRS); Scrum opcional por área o proyecto (Kanban por defecto); registro de horas opcional por equipo (diseñado, no construido en Etapa 1); GESPRO vive **dentro del Shell de Xtein**, no como app aparte; **Plantillas y Proyectos se fusionan** (plantilla = proyecto sin fechas con duración y desplazamiento por actividad; «crear desde plantilla» / «guardar como plantilla»); **plan de acción = proyecto de tipo plan de acción** creado desde plantilla y enlazado a la incidencia.

Pendientes que no decide el diseño: host del backend (.NET por defecto o excepción Node), proveedores de push y correo, fuente del evento de ausencia de Gestión Humana, nombre/sector de la empresa de ejemplo, reglas de confidencialidad.

---

## 5. Modelo conceptual del nuevo GESPRO

- **Actividad** (núcleo): tipo (Tarea, Incidencia, Solicitud, Evento, Responsabilidad, Aprobación, Reunión…), clase/categoría, responsable (persona), ejecutor opcional (agente), asignado por, colaboradores y participantes, estado, prioridad, programación (inicio, fin, recurrencia), avance (padre = promedio de hijas), área, padre (jerarquía ilimitada), conversación, adjuntos, historial, visibilidad.
- **Proyecto = Plantilla** (misma entidad, bandera «es plantilla»): tipo de trabajo, etapas (actividades de nivel 1 con compuerta y aprobador por rol), actividades con duración y desplazamiento, precedentes, roles, recursos, estado en un clic (En curso / En riesgo / Con retraso), línea de tiempo, costos (opcional), capacidad.
- **Actividad maestra**: cualquier actividad con hijas puede «gestionarse como proyecto»: árbol, tablero, Mi día, panel y creación enfocados en ella, con barra superior y «volver al general».
- **Rol → Manual del cargo → Responsabilidad** (serie recurrente → ocurrencias en Mi día; individual o por equipo; suplente).
- **Regla de generación**: evento del ERP/agente → actividad con responsable por rol/área, SLA, prioridad (inbox de eventos idempotente; outbox transaccional en el módulo emisor).
- **Reunión / Compromiso / Agenda**; **Indicador de cumplimiento** por persona, agente y área; **Notificación** (bandeja, push, correo) y **Conversación de actividad**.

Flujo de ejemplo de punta a punta (usado en el prototipo): OP-3307 → Calidad reporta INC-0139 desde el celular (costura abierta, lote 2310-B) → triage con SLA → «Abrir plan de acción» → se crea PA-0139 desde la plantilla «Plan de acción · No conformidad» (contención → causa raíz → acción correctiva → preventiva → verificación de eficacia a 30 días) → la acción correctiva aparece en el Mi día de Jorge (Producción) → cronómetro, foto, comentario → Camila aprueba el cierre → verificación aprobada → el plan cierra, INC-0139 se cierra sola, la OP queda sin pendientes y el Panel suma la causa al Pareto.

---

## 6. Lo que ya existe como entregables

1. **Prompt de rediseño** (`docs/gespro/analisis-y-prompt-rediseno.md`): diagnóstico del GESPRO actual, referentes (Linear, Jira, Asana —revisado el Asana de la empresa—, Todoist, Trello, Sentry, ISO 9001, MaintainX, Zendesk), metodología Scrumban, y el prompt completo para diseñar las pantallas en Claude por etapas, con la visión y las 20 decisiones integradas. Publicado como artefacto «Rediseño GESPRO Xtein» (v6).
2. **Prototipo navegable** (artefacto de diseño «GESPRO Prototipo», v38; pantallas en un lienzo, cada una con Play): **Móvil** (Mi día, Actividades árbol/tablero, reportar incidencia, detalle con aprobación/visibilidad/comentarios, agente ejecutor, ausencia, proponer prioridad, notificaciones), **Web · GESPRO en Xtein** (Mi día, Actividades con árbol, autobúsqueda, actividad maestra, filtros de estado/asignación/área, Kanban, Incidencias, Panel con widgets —adopción, agentes, Fase 2 boceto—, nuevo ítem, detalle lateral), **Calendario**, **Hoja de tiempo**, **Proyecto** (selector de proyectos, Resumen con roles/recursos/historial, estado en un clic, Cronograma/Gantt con etapas y compuertas, «Enfocar etapa», Backlog y Sprint, Costos, Capacidad, crear desde plantilla con formulario, guardar como plantilla, agregar actividades anidadas), **Ajustes** (espacio y flujo, Roles/manual del cargo, tipos de trabajo, reglas de generación con «probar regla», categorías de incidencia, permisos con «ver como»), **Reuniones y agenda** (agenda semanal sincronizada, convocar con disponibilidad y cruces, reunión en curso con minuta y compromisos), **Flujo completo** (recorrido guiado de 8 pasos y modo «hacerlo yo vista a vista» por las pantallas reales), **Sistema visual** y **Trazabilidad** (criterio → pantalla). En construcción: pantalla **Plantillas** con flujo de creación y permisos.
3. **Especificación** (`.omc/specs/deep-interview-gespro-vision.md`): 20 rondas, ambigüedad final 8 %, criterios de aceptación CA-01…CA-19, ontología.
4. **Plan de consenso** (`.omc/plans/gespro-etapa1-diseno.md`, aprobado por Architect y Critic, pendiente de ejecución): bloques A (prompt) y B (prototipo) ya ejecutados; C (arquitectura) y D (migración) pendientes. Decisiones del ADR: `apps/mfe-gespro` nuevo con ID de aplicación **GES-100** (no reutilizar GES-001), puerto 4214, Gantt nuevo en `libs/ui`; una sola tabla `GES_ACTIVIDAD` (tipo, padre, `hierarchyid`) con satélites 1:1; series separadas de ocurrencias para recurrentes; participantes, menciones, bandeja, inbox de eventos con clave de idempotencia y profundidad; cierre materializado del organigrama para la visibilidad; agentes desde el catálogo AGT-001/002; API **REST v2** (`/api/v2/ges`) con autenticación Bearer (identidad y empresa del token) detrás de un `GesproApiService`; host .NET por defecto (excepción Node en `/api/gespro/v2` solo con aprobación y salida a 6 meses); worker multiempresa (recurrencias, SLA, consumidor de eventos, cierre de organigrama, calendario); migración con **corte único** para toda la empresa, bloqueo del legado dentro de los SP, delta por fecha o hash, legado en solo lectura 30 días; 7 fases ≈ 25 semanas (F0 decisiones · F1 actividades y Mi día · F2 roles/manual y ausencias · F3 proyectos, compuertas, Gantt, Scrum, incidencias · F4 reglas y agentes · F5 reuniones y calendario · F6 push, WebSocket, Panel, Capacitor, corte).

---

## 7. Glosario rápido

- **Mi día**: pantalla inicial con lo que debo hacer hoy (atrasadas, hoy, próximos días, responsabilidades del cargo, aprobaciones pendientes, compromisos de reuniones).
- **Actividad maestra**: nodo con hijas gestionado como proyecto.
- **Compuerta**: aprobación obligatoria al final de una etapa que bloquea la siguiente.
- **Manual del cargo**: lista de responsabilidades recurrentes de un rol, en Roles.
- **Regla de generación**: configuración evento → actividad.
- **Tipo de trabajo**: categoría que define el comportamiento del flujo (estados, etapas, SLA, Scrum, campos).
- **Incidencia**: problema a atender, de categoría software, calidad, mantenimiento o cliente, con SLA.
- **Plan de acción**: proyecto de tipo plan de acción enlazado a una no conformidad.
- **Panel**: tablero de widgets para líderes y gerencia (carga, atrasos, SLA, adopción, agentes).
- **GES-100**: código de aplicación propuesto para el nuevo GESPRO en el Shell.

## 8. Personas y datos de ejemplo usados en los diseños

Laura Martínez (LM, gerente administrativa, «yo» en el prototipo), Andrés Rojas (AR, Compras), Camila Pérez (CP, Calidad), Jorge Gómez (JG, Producción), Diana Suárez (DS, Ventas), Óscar Mejía (líder de compras), Ana Castro (líder de bodega), Wilson Páez (operario de bodega); Agente de inventarios. Proyectos: «Lanzamiento línea Nórdica» (PRY-012), «Desarrollo de producto · Silla Nórdica 2027» (PRY-014, 3 etapas con compuerta), plan de acción PA-0139 (costura abierta, lote 2310-B, INC-0139, OP-3307). Documentos: OC-4518 (Textiles Andinos), OC-4490, PV-20877, SC-0921. Fecha de referencia de los diseños: lunes 26 de octubre de 2026.
