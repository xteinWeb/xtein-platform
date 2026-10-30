# GESPRO — Análisis actual y prompt de rediseño

> Fuente: recorrido en vivo de `http://192.168.11.151:8100` (Gestion → Gespro), código `Legacy/src/app/modulos/GESPRO/**`, `Legacy/src/app/shared/Tareas/**` y las llamadas al API observadas en la sesión.

---

## Parte 1 · Diagnóstico

### 1.1 Qué es hoy GESPRO (GES-001)

| Aspecto | Estado actual |
|---|---|
| Pantalla | Una sola vista: árbol (TreeList DevExtreme) con columnas Actividad, Responsable, Colaboradores, Estado, Programación, Asignado por, Descripción, Avance + pestaña Calendario (dx-scheduler). |
| Entidad | Todo es una **Actividad** con `CLASE` = TAREAS · RESPONSABILIDADES · EVENTOS · COMUNITARIAS · NODOS (proyecto = nodo). No existen *incidencia*, *sprint*, *épica*, *etiquetas*, *registro de horas*. |
| Estados | Sin Iniciar → En Proceso ↔ En Pausa → Finalizado (+ Completada/Ejecutada/Descartada). Avance fijo 0/25/50/75/100 acoplado al estado. |
| Detalle | Popup `GES_INFO` (35%×60%): formulario a la izquierda, chat/timeline/adjuntos a la derecha. |
| Programación | Recurrencia RRULE, recordatorios, sincroniza con Google Calendar. |
| Tiempo real | WebSocket: notificaciones, mensajes de actividad, recordatorios. |
| Relacionados | GES-007 Proyectos (encabezado + Gantt), GES-005 Áreas, GES-002 Organigrama, GES-006 Plantillas, GES-004 Grupos, Roles, Usuarios gestor. |

### 1.2 Back (inferido de las llamadas)

- Todo es `POST {api}/{APP}/{ruta}` con sobre `{prmAccion, prmDatos(JSON string), prmConexion, prmTokenDatos}`; respuesta `{data: "<JSON string>"}`, error en `res[0].ErrMensaje`.
- Endpoints clave: `GES00/getActividades` (`ACTIVIDADES MAESTRO`, `FILTRO AREAS`), `GES001/nueva-actividad` y `GES00/nueva-actividad` (new/update/delete — **dos rutas para lo mismo**), `GES00/estados` (sobrecargado: `ESTADOS`, `DETALLE ACTIVIDAD`, `TIMELINE`, `update status`), `GES00/save-comentarios`, `generales/cargar_archivo`, `GES007/consulta` (`CAMBIO ESTADO`), `GES00/consulta` (`VALIDAR PRECEDENTES`), `CHAT/save` (notificaciones), `generales/*ConfigObjeto` (estado del grid por usuario).
- Carga **toda** la lista de actividades del usuario y filtra en el cliente; sin paginación ni búsqueda en servidor.
- IDs nuevos calculados en el cliente (`max+1`) → riesgo de colisión.
- Permisos solo en el cliente; token en `localStorage`; claves de Google en `assets/js/google.js`.

### 1.3 Por qué el personal no lo quiere usar

| Queja | Causa observada |
|---|---|
| **"Demora mucho gestionar una tarea"** | Crear = expandir nodo → hover → "+" → editar fila → guardar; programar abre otro popup; colaboradores, otro dropdown; una fila editable a la vez; recarga completa tras cada guardado; `setTimeout` de 300–1000 ms. |
| **"Es complicado"** | Árbol con nodos virtuales (Responsabilidades/Tareas/Eventos/Proyectos) que mezcla conceptos; menú contextual con 9 acciones; reglas ocultas (no puedo finalizar, no puedo mover, no soy responsable…) que se descubren con un toast de error. |
| **"Es aburrido"** | Grid tipo ERP, gris, sin jerarquía visual, sin feedback al completar, sin una vista "lo mío de hoy", avances en saltos de 25 %. |
| **Móvil** | No es usable: la tabla se corta, los filtros desaparecen, las pestañas quedan truncadas, no hay gestos ni creación rápida. |

### 1.4 Plantillas (GES-006) y Proyectos (GES-007): dos módulos para un solo concepto

Revisado el código legado (`xtein-web-2.0/src/app/modulos/GES006`, `GES007` y `apiRest` con
`spPlantillas` / `spProyectos`) y la web de desarrollo:

| Aspecto | Plantillas GES-006 | Proyectos GES-007 |
|---|---|---|
| Cabecera | ID_DOCUMENTO, CONSECUTIVO, NOMBRE, DESCRIPCION, ESTADO, FECHA_REGISTRO, USUARIO + CATEGORIA, TIPO | los mismos 7 + RESPONSABLE, PLANTILLA, FECHA_INICIO/FIN, SUB_ESTADO, AVANCE, REFERENCIA, FOTO |
| Actividad | ID_ACTIVIDAD, ID_ACTIVIDAD_PADRE, ORDEN, RESPONSABLE, PRECEDENTES, ESTADO + OBJETIVO, EJECUTABLE | los mismos + fechas, AVANCE y todo lo de una actividad GESPRO (CLASE=TAREAS, TIPO=ID del proyecto) |
| Árbol | `dx-tree-list` propio | reutiliza el `GES000` de GESPRO |
| Vistas | formulario + árbol | Kanban por sub-estado, Formulario, Gantt |

- Un proyecto **no se puede crear sin plantilla**, y al instanciarla todas las tareas quedan con
  fecha de hoy porque la plantilla no guarda duración; además se pierden OBJETIVO y EJECUTABLE.
- Más de 600 líneas copiadas entre `GES006.component.ts` y `GES007.component.ts`
  (`opMenuRegistro`, `opPrepararBuscar`, `opIrARegistro`, `opEliminar`, `valoresObjetos`).
- Estados del Kanban con tres nombres distintos (En Progreso / En Proceso / En Pausa / Pausado);
  errores al abrir proyectos de prueba ("fecha final debe ser mayor", "Error en Acción:
  DESARROLLO SOFTWARE" porque el TIPO de la plantilla se usa como acción del SP).
- La pestaña Plantillas ya aparece **embebida dentro de Proyectos**: en la práctica se usan juntos.
- **Planes de acción**: ya existen en **CAL-002 (Calidad)** con `spPlanAccion` y la clase de
  actividad `PLANES DE ACCION` (nodo `-40`) sobre el mismo motor de GESPRO, con origen, causa
  interna/cliente, producto y análisis de causa. Están aislados: ni Proyectos ni GESPRO los ven.

**Conclusión:** la plantilla es un proyecto sin fechas ni responsable, y el plan de acción es un
proyecto con campos de calidad. Los tres caben en una sola entidad.

### 1.5 Roles y permisos en la base de Xtein (consultado en desarrollo, solo lectura)

- **Rol del sistema** (`USUARIOS.ID_ROL` → `ROLES`): ADM Administrador del sistema, ACA Auxiliar
  contable y administrativo, ALM Almacenista, COM Compras, CON Contador, EDC Ejecutivo de cuenta,
  INV Inventarios, LDP. Solo precarga permisos por aplicación (`ROLES_APLICACIONES`: crear,
  modificar, eliminar, buscar, listar); el menú de cada usuario sale de sus aplicaciones asociadas.
- **Cargo** (`CARGOS`, en el menú se llama «Roles», GES-003): Gerente General; Líder de TI, Planta,
  Marketing, Ventas, Diseño, Procesos, Calidad, Costos, Compras, Inventarios, Mantenimiento,
  Talento; Analistas (soporte, contable, tesorería, abastecimiento, nómina, SST…); Auxiliares;
  Técnico de prototipado; Gestor de acciones correctivas; Coordinador de producción.
  `ITM_CARGOS_RESPONSABLES` liga cargo → persona (Líder de Calidad, de Compras, de Producción…).
- **Área funcional** (`AREAS`): jerárquica por `ID_AREA_SUPERIOR` (Dirección ejecutiva › Financiera
  › Contabilidad…; Operaciones › Compras › Abastecimiento; Producción › Plantas › Líneas…), con
  `ID_CARGO` del cargo responsable del área. El **equipo de un líder** se infiere: persona →
  responsabilidad (actividad con `TIPO = cargo`) → cargo → área → áreas hijas. Hoy esa cadena está
  vacía (0 responsabilidades ligadas a cargo).
- **El token de sesión no lleva rol ni cargo** (solo usuario y empresa): el rol se resuelve en el
  servidor. GESPRO legado no distingue roles: quien crea, responsable, colaborador y grupo; no hay
  aprobador ni líder; «Usuarios gestor» son grupos de chat.
- **La prioridad está vacía en el 100 % de las actividades**: nadie la usa. La fecha de vencimiento
  sí existe en todas.

### 1.6 Activos que vale la pena conservar (el "ADN Xtein")

1. **Responsabilidades por cargo** (tareas permanentes/recurrentes ligadas al organigrama): ningún Jira/Asana lo trae así.
2. **Áreas funcionales + organigrama**: visibilidad por área y jefatura.
3. **Recurrencia y recordatorios** robustos.
4. **Timeline de auditoría automático** + chat por actividad.
5. **Integración con el ERP** (compras, ventas, producción, calidad…): el potencial más diferencial es enlazar tareas e incidencias con documentos del ERP.
6. Plantillas de proyecto y precedentes (dependencias).

---

## Parte 2 · Referentes y metodología

| Referente | Lo que tomamos |
|---|---|
| **Linear** | Velocidad: creación en 1 tecla, paleta de comandos (Ctrl+K), atajos, triage de entrada, ciclos cortos, UI limpia. |
| **Jira / YouTrack** | Tipos de ítem (tarea, incidencia, historia, épica), flujos de estado configurables, sprints, backlog. |
| **Asana / ClickUp** (revisado el Asana que usa hoy la empresa) | "Mis tareas" con secciones Hoy / Próximo / Más tarde que se reordenan arrastrando; múltiples vistas del mismo dato (lista, tablero, calendario, cronograma); botón «+ Crear» global; panel lateral de detalle con navegación entre tareas; Resumen del proyecto con roles e historial; estado del proyecto en un clic; aprobaciones; inicio con widgets; visibilidad por tarea y capacidad del equipo (módulo Clientes). |
| **Todoist / Things** | Captura rápida con lenguaje natural (`Revisar OC 1234 @ana mañana 3pm !alta #compras`), gestos y satisfacción al completar. |
| **«El poder de lo simple» (Jack Trout) · «Solo una cosa» · Pareto** | Una idea por pantalla; sentido común y lenguaje de la empresa, sin jerga; menos información (señal, no ruido); lo primero, primero: el 20 % que importa arriba y el resto plegado. |
| **Trello / Monday** | Tablero Kanban visual, tarjetas legibles, color con significado. |
| **Sentry / GitHub Issues / Jira Service Mgmt** | Seguimiento de errores: severidad, reproducibilidad, entorno, evidencias, SLA, duplicados, vínculo a la tarea que lo corrige. |
| **Software de calidad (ISO 9001: no conformidades y CAPA)** | Flujo no conformidad → causa raíz → acción correctiva/preventiva → verificación de eficacia. |
| **MaintainX / Fiix (mantenimiento)** | Reporte de falla con foto desde el celular, órdenes de trabajo por activo, MTTR, tiempo de equipo detenido. |
| **Zendesk / Freshdesk (servicio al cliente)** | PQRS con canal de entrada, SLA, plazos de respuesta y encuesta de satisfacción. |

**Metodología propuesta: Scrumban adaptable por equipo**
- **Kanban** por defecto (operación diaria, áreas no-TI): columnas = estados, límites WIP, métricas de flujo (lead/cycle time, throughput, tareas envejecidas).
- **Scrum opcional** para cualquier área o proyecto que lo active (TI, calidad, comercial, producción…): backlog priorizado, sprints de 1–4 semanas, tallas o puntos, burndown, revisión y retro.
- **Bandeja de triage** para incidencias y solicitudes entrantes (como Linear/Jira SM).
- **Responsabilidades** = trabajo recurrente del cargo, que aparece solo en "Mi día" cuando le toca.
- Prioridad tipo **Eisenhower simplificada** (Urgente · Alta · Media · Baja), SLA en incidencias.

---

## Parte 3 · Prompt de rediseño

> Cópialo tal cual en la herramienta de diseño/código (Claude, Claude Design, Figma AI, v0…). Las secciones marcadas **[AJUSTAR]** son decisiones de negocio a confirmar.

````markdown
# Rol
Actúa como Product Designer senior + arquitecto front-end especializado en herramientas de
productividad y gestión de incidencias (nivel Linear, Asana, Jira, Todoist, Jira Service
Management, MaintainX, Zendesk). Diseña el nuevo **GESPRO**, el módulo de gestión de tareas,
proyectos e incidencias (software, calidad, mantenimiento y clientes) de **Xtein**, un ERP colombiano modular
(compras, ventas, inventarios, producción, calidad, gestión humana, financiero).

# Visión (definida por la empresa)
**GESPRO es el gestor de procesos y productividad de las personas y de los agentes.** Organiza y
documenta los procesos y las responsabilidades de cada rol, y registra y mide el trabajo de las
personas de la empresa —humanas y sintéticas (agentes de IA)— midiendo su productividad como
**cumplimiento de lo asignado** (cerradas a tiempo frente a asignadas, carga y atrasos), no como
minutos registrados. Lo que hoy se llama «Gestión» en Xtein pasa a llamarse **GESPRO** y
agrupa Áreas funcionales, Organigrama, Actividades (el GES-001 actual, que cambia de nombre),
Plantillas, Proyectos, Roles y Usuarios gestor.

- **Todo Xtein genera actividades.** Cualquier proceso o aplicación del ERP, y cualquier agente,
  puede crear una actividad con responsable, seguimiento y medición en GESPRO: una orden de
  compra dispara la gestión con el proveedor; un proceso autónomo de copias de seguridad abre una
  tarea de atención ante una eventualidad; un agente que detecta consumo anormal de insumos crea
  una actividad al responsable de compras por posible desabastecimiento; cualquier proceso que
  requiera autorización la programa como una actividad de aprobación; los planes de acción de
  calidad (analizados incluso con IA) derivan en acciones correctivas que son actividades GESPRO.
- **Un solo lugar para el trabajo de cada persona.** El éxito de GESPRO es administrar la
  complejidad del día a día y la «lluvia de actividades» de forma simple para las personas.
- **Tipos de trabajo.** Las actividades se organizan por tipo de trabajo, y el tipo define el
  comportamiento del flujo:

  | Categoría | Actividades | Comportamiento del flujo |
  |---|---|---|
  | Ingeniería y desarrollo | proyecto de software, I+D de producto | etapas ágiles o en cascada, hitos, código/diseño |
  | Infraestructura y obras | construcción civil | fases secuenciales estrictas, cronograma de obra |
  | Operación y soporte | mantenimiento, soporte a usuario | flujo de tickets, SLA, estados de resolución |
  | Gestión y calidad | planes de acción, solución de problemas | ciclos PHVA, causales, auditoría |
  | Gobierno y coordinación | reuniones | agenda, compromisos, minutas |
  | Desarrollo interno | proyectos personales, capacitación | tareas individuales, seguimiento de metas |

- **Proyectos con flujo y compuertas.** Ejemplo: el ciclo de desarrollo de productos de ARTDECON
  define los pasos obligados para crear un producto (ideación → definición del sistema
  constructivo → desarrollo: diseño técnico y prototipado) con **etapas de aprobación** para pasar
  de un paso al siguiente; las tareas que surgen del proyecto se gestionan en Actividades.
- **Por etapas, hasta permear todo Xtein.**
  - *Etapa 1*: gestión de actividades, proyectos (actividad maestra; hoy plantillas y
    proyectos), planes de acción de calidad, notificaciones, conversación por actividad y
    reuniones con agenda y minuta.
  - *Fase 2*: con IA o algoritmos especializados, y a partir de los indicadores de cada persona,
    GESPRO ayuda a definir prioridades: es más que un «to-do»; hace evidente el principio de
    Pareto para que el equipo aprenda a hacer las renuncias y elecciones correctas.

# Decisiones de diseño de la Visión (Etapa 1) — ya tomadas, no reabrir
1. **Proceso = responsabilidades del rol.** Cada rol (asociado a un área funcional) tiene un
   **manual del cargo** en Roles: responsabilidades recurrentes con qué, cada cuánto y evidencia.
   Al asignar el rol a una persona, GESPRO genera sus responsabilidades y las muestra en Mi día el
   día que tocan (p. ej. «proyección de compras» cada martes).
2. **Compuerta de etapa bloquea la etapa siguiente.** El aprobador viene de la plantilla (por rol);
   la aprobación es una actividad en su Mi día con evidencias y comentarios; el rechazo devuelve la
   etapa. Las hijas de la etapa siguiente quedan «Bloqueada por compuerta» con el motivo visible.
3. **Reglas de generación configurables** en Ajustes, sin código: evento del ERP o del agente →
   plantilla de actividad → responsable por rol/área y SLA (vencimiento). Los módulos solo emiten
   eventos. Límite de 20 actividades por evento y profundidad máxima 3 (cascadas).
4. **Productividad = cumplimiento de lo asignado**; las horas son opcionales por equipo.
5. **Chat interno = conversación por actividad** (@menciones, adjuntos, historial, notificaciones);
   no hay mensajes sueltos ni canales.
6. **Primera salida = Etapa 1 completa para toda la empresa** (actividades, responsabilidades por
   rol, proyectos con etapas y compuertas, plantillas, planes de acción, notificaciones,
   conversación y reuniones).
7. **Agente = ejecutor con responsable humano.** El agente aparece como actor en el historial
   («Ejecuta: Agente de inventarios · Responsable: Laura»), se mide su cumplimiento, y el servidor
   rechaza que un agente cierre una actividad: la cierra la persona responsable.
8. **Éxito a 90 días**: adopción ≥ 80 %, cierre a tiempo ≥ 85 %, 100 % de roles con manual.
9. **Fuera de la Etapa 1**: solo registro de horas, cronómetro, hoja de tiempo y costeo.
10. **El manual del cargo vive en Roles** como plantilla del cargo (Roles evoluciona).
11. **Responsabilidades individuales por defecto**; cada una puede marcarse **«por equipo»** y
    entonces se asigna al líder del área, que la reparte.
12. **Ausencias**: Gestión Humana registra la ausencia; GESPRO avisa al líder del área y le muestra
    las actividades a reasignar con el **suplente** sugerido por rol; al regresar, las recurrentes
    vuelven al titular.
13. **Visibilidad**: jerarquía del organigrama (el líder ve a su equipo, gerencia ve todo) + quien
    asigna la actividad aunque esté fuera de la jerarquía + el responsable del proyecto.
14. **Tipos de trabajo administrables** en Ajustes (6 de semilla: ingeniería y desarrollo,
    infraestructura y obras, operación y soporte, gestión y calidad, gobierno y coordinación,
    desarrollo interno); cada tipo define flujo de estados, etapas con compuertas, SLA, Scrum
    opcional y campos extra.
15. **Notificaciones**: siempre en la bandeja de Xtein; push por defecto en celular/PWA; correo solo
    para aprobaciones y vencimientos; preferencias por persona; sin WhatsApp. Escalamiento al
    líder a las 24 h de vencida.
16. **Semáforo por fecha en vez de prioridad** (reemplaza la decisión anterior sobre prioridad
    manual): la fecha la fija quien asigna; el responsable puede **proponer otra fecha** con aviso
    al asignador, que la acepta. **Mi día ordena**: rojas (vencidas y de hoy) → amarillas → verdes,
    y dentro de cada color por hora.
17. **GESPRO es la agenda oficial** (reuniones + actividades con hora): al convocar muestra la
    disponibilidad de cada invitado y bloquea o advierte el cruce; sincronización **bidireccional**
    con Google/Outlook para quien la active.
18. **Reunión** = agenda de puntos + asistentes + **minuta en vivo**; cada **compromiso**
    (responsable, fecha) se convierte en actividad enlazada a la minuta al cerrar la reunión; la
    minuta se envía a los asistentes. Minuta con agente de IA: fase siguiente.
19. **Etapa = actividad padre de nivel 1 del proyecto** con la compuerta como propiedad; su avance se
    calcula con las hijas. Un solo árbol para etapas, tareas, Gantt y actividad maestra.
20. **Administración**: rol **Administrador GESPRO** (tipos de trabajo, reglas, flujos), líderes de
    área (plantillas y manuales de su área), Calidad (plantillas de plan de acción); los permisos
    se parametrizan en los roles de usuario de Xtein.

# Principios: simple, funcional y por rol
Estas reglas mandan sobre todo lo demás; donde choquen con otra sección, ganan estas.
1. **Una idea por pantalla.** Cada vista responde una sola pregunta. Mi día: «¿qué hago ahora?».
   Mi equipo: «¿quién necesita ayuda?». Proyecto: «¿vamos a tiempo?». Panel: «¿qué área va en rojo?».
2. **Lo primero, primero (Pareto).** Mi día abre con UNA tarjeta grande «Lo primero» (la actividad
   más urgente por semáforo y hora) y debajo una lista corta; lo demás, plegado. GESPRO es más que
   un «to-do»: es la herramienta que ayuda a elegir y a renunciar.
3. **Sentido común, sin jerga.** Palabras de la empresa: «proyecto», «etapa», «aprobación», «me llegó
   del sistema». Nunca «actividad maestra», «compuerta», «regla de generación», «CA-xx» en pantalla.
4. **Menos texto.** Sin notas explicativas, leyendas, «datos de ejemplo» ni frases que describan la
   pantalla. Un título, los datos, las acciones. Lo que necesite explicación va en un tooltip.
5. **Menos elementos.** Máximo 4 pestañas por rol, un botón primario por pantalla, columnas:
   nombre · responsable · semáforo · estado. Lo demás vive en el detalle, bajo «Más».
6. **Semáforo en vez de prioridad.** Por fecha de vencimiento: **verde** > 8 días, **amarillo**
   2–7 días, **rojo** ≤ 1 día o vencida; un punto de color grande con el texto «vence mañana» /
   «vencida hace 2 días». La prioridad manual desaparece de la interfaz.
7. **Nombres, no iniciales.** Responsable con nombre completo; donde no quepa, iniciales con tooltip.
8. **Vistas por rol.** Cada persona entra a la vista de su rol (ver «Vistas por rol»); nadie ve
   funciones de otro rol mezcladas en su pantalla.

# Vistas por rol (de la base de datos real de Xtein)
| Vista | Quién (regla con los datos de Xtein) | Pestañas (máx. 4) | Pregunta que responde |
|---|---|---|---|
| **Colaborador** | cualquier usuario con cargo no líder (analista, auxiliar, técnico, operario) | Mi día · Mis actividades · Agenda | ¿qué hago ahora? |
| **Líder de área** | cargo «Líder de …» o cargo responsable del área (`AREAS.ID_CARGO`, `ITM_CARGOS_RESPONSABLES`) | Mi día · Mi equipo · Proyectos · Agenda | ¿quién de mi equipo necesita ayuda y qué apruebo? |
| **Gerencia** | Gerente General (o superior en el organigrama) | Panel · Proyectos · Agenda | ¿qué área va en rojo? |
| **Administrador GESPRO** | `ID_ROL = ADM` | Ajustes (Roles y manuales · Tipos de proyecto · Plantillas · Reglas) | ¿cómo se configura? |
| *Calidad* (variante de líder) | Líder de calidad / Gestor de acciones correctivas | lo del líder + Planes de acción dentro de Proyectos | — |

- **Mi equipo** (líder) = las personas de su área y de las áreas hijas del organigrama, con semáforo
  agregado (cuántas rojas / amarillas / verdes), atrasadas y carga; filtro por área de la jerarquía;
  clic en una persona → sus actividades. Aquí viven las aprobaciones pendientes, las fechas
  propuestas por aceptar y las ausencias con «Reasignar».
- **Panel** (gerencia) = la misma idea por áreas: una fila por área con semáforo, cumplimiento
  contra las metas (80 % adopción, 85 % a tiempo) y atrasadas. Sin widgets ni «agregar widget».
- La app móvil es la vista Colaborador; el líder ve además «Mi equipo».
- En el prototipo, un selector **«Entrar como»** (Camila · Líder de calidad; Andrés · Analista de
  abastecimiento; Laura · Gerente general; Administrador GESPRO) cambia pestañas y pantalla inicial.

# Las 10 mejoras pedidas por la empresa (obligatorias)
1. **Semáforo** verde / amarillo / rojo por fecha de vencimiento (> 8 días, 2–7, ≤ 1 o vencida).
2. **Responsables con nombre**; iniciales solo con el nombre en tooltip.
3. **Fecha**: la define quien pide la actividad; quien la recibe puede **proponer otra fecha** y se
   notifica a quien la pidió para que acepte; mientras tanto, chip «Fecha propuesta: 3 nov».
4. **Evidencia al finalizar**: al marcar Hecho se pregunta «¿Cómo lo soportas?»: *adjuntar soporte*
   (documento/foto), *que confirme quien la pidió* (queda «Por confirmar» hasta que acepte) o *sin
   soporte*. Si la creó el sistema (regla, agente), se confirma sola al cumplirse.
5. **Incidencias integradas**: no son un módulo ni una pestaña; son actividades de tipo
   «Incidencia» con categoría (software, calidad, mantenimiento, cliente) y SLA como fecha de
   vencimiento; se crean desde «+ Crear → Incidencia» o desde el documento del ERP y aparecen en Mi
   día y en Mi equipo con un chip de categoría. El «Centro de incidencias» desaparece.
6. **Panel del líder = Mi equipo**, con filtro por jerarquía de áreas funcionales.
7. **Tiempo**: se registra al finalizar («¿Cuánto te tomó?», opcional) o con el cronómetro del
   detalle; alimenta la hoja de tiempo. Nada más.
8. **Reuniones**: el **acta** es un documento aparte de la reunión; de cada punto se puede crear
   una **actividad, responsabilidad, proyecto o evento** con responsable y fecha. Al convocar,
   GESPRO muestra la agenda de cada invitado y avisa el conflicto antes de guardar.
9. **Plantillas**: modelo del GESPRO actual (cabecera: código, nombre, tipo, categoría, estado;
   árbol: actividad, actividad padre, orden, responsable por cargo, precedentes, ejecutable,
   duración) y, por tipo de proyecto, los **datos asociados** que pedirá cada proyecto (desarrollo
   de producto → código de producto; plan de acción → no conformidad; mantenimiento → activo).
   Dos pasos: Datos y Actividades. Sin galerías ni versiones recargadas.
10. **Mantenerlo simple y funcional**: quitar todo lo que no responde la pregunta de la pantalla.

# Alcance: herramienta de TODA la empresa
GESPRO es la herramienta única de trabajo de toda la organización, no de TI: gerencia,
administrativo, financiero, compras, ventas, bodega, producción, calidad, mantenimiento,
gestión humana y servicio al cliente. Reemplaza al GESPRO actual (GES-001) y debe:
- Servir igual a quien trabaja en un escritorio y a quien está en planta o en la calle con el
  celular, incluidos usuarios con poca experiencia digital.
- Organizarse según la estructura real de Xtein: **áreas funcionales y organigrama** definen los
  espacios, quién ve qué y a quién se escala; los **cargos** traen sus responsabilidades
  recurrentes automáticamente cuando alguien ocupa el cargo.
- Permitir trabajo **entre áreas** (una solicitud de ventas a bodega, una no conformidad que
  genera trabajo en producción y compras) sin perder trazabilidad.
- Visibilidad por niveles: la persona ve lo suyo y lo que comparte; el líder ve su área; la
  gerencia ve el consolidado. Ítems privados o confidenciales (p. ej. de gestión humana)
  [AJUSTAR reglas de confidencialidad].
- Integrarse con todos los módulos del ERP: desde cualquier documento se puede crear una tarea o
  reportar una incidencia, y el documento muestra sus ítems vinculados.
- **Migrar lo existente** sin que nadie pierda nada: actividades, responsabilidades por cargo,
  recurrencias, recordatorios, comentarios, adjuntos e historial del GESPRO actual; las
  plantillas (GES-006), los proyectos (GES-007) y los planes de acción de Calidad (CAL-002).
- **Vivir dentro de Xtein**, no como app aparte. En web, GESPRO se abre en el marco del Shell:
  menú lateral de módulos con **Gestion → Gespro** marcado, encabezado con el logo de la
  empresa (p. ej. ARTDECON), búsqueda, notificaciones, bandeja y usuario, y la barra de
  pestañas de Xtein (Gespro junto a Tablero y las demás aplicaciones abiertas). La navegación
  propia de GESPRO va como **barra de vistas dentro del área de trabajo** (Mi día, Actividades,
  Incidencias, Panel del líder, Calendario, Hoja de tiempo, Proyectos, Ajustes), nunca como un
  segundo menú lateral. En móvil se conserva la barra superior de Xtein (menú, logo de la
  empresa, usuario) y debajo la navegación de GESPRO. Usar los logos y colores reales de la
  marca (azul #0F4C81, verde #35CCAC).
- **Adopción**: incluir onboarding guiado en la primera entrada, plantillas listas por área
  (p. ej. "Cierre contable", "Recepción de mercancía", "Orden de mantenimiento"), ayudas en
  contexto, y un tablero de adopción por área (usuarios activos, ítems creados y cerrados a
  tiempo) para acompañar el cambio.

# Problema a resolver
El GESPRO actual es una grilla jerárquica tipo ERP. El personal no lo usa porque:
1. Gestionar una tarea toma demasiados pasos (crear, asignar, programar y comentar ocurren en
   popups y filas distintas, una a la vez, con recargas lentas).
2. Es complicado: mezcla en un solo árbol responsabilidades, tareas, eventos y proyectos; las
   reglas (quién puede editar, cuándo se puede finalizar) se descubren por mensajes de error.
3. Es aburrido: denso, gris, sin feedback ni sensación de avance.
4. No sirve en el celular.

# Objetivo y métricas de éxito
- Crear una tarea completa en **≤ 5 segundos / 1 pantalla** (web y móvil).
- Cambiar estado, reasignar o comentar en **≤ 2 toques**.
- Que cada usuario abra GESPRO y vea en < 1 s **qué debe hacer hoy**.
- A 90 días de salir a producción: **adopción ≥ 80 %** (personas con ≥ 1 acción en GESPRO en
  ≥ 3 de 5 días hábiles de la semana ÷ personal activo), **cierre a tiempo ≥ 85 %** (cerradas con
  fecha de cierre ≤ fin ÷ actividades con fin en el periodo) y **100 % de los roles con manual**
  cargado (roles con ≥ 1 responsabilidad activa ÷ roles con ocupante).
- Totalmente usable en móvil (375 px) con una mano.
- **Medir la productividad** como cumplimiento: por persona, agente, área y proceso, asignadas,
  cerradas a tiempo, atrasadas y **carga** (abiertas atrasadas + abiertas con fin en los próximos
  7 días). Sin registro de horas obligatorio.

# Usuarios (personas)
- **Operativo** (bodega, producción, ventas en calle): sobre todo móvil; quiere ver lo suyo,
  marcar hecho, adjuntar foto, comentar. Poca tolerancia a formularios.
- **Líder de área / jefe**: asigna, prioriza, ve la carga de su equipo, detecta atrasos.
- **Gerencia**: avance de proyectos y salud por área, sin entrar al detalle.
- **TI / desarrollo y soporte**: gestiona incidencias de software; suele trabajar con sprints.
- **Líder de cualquier área que active Scrum**: planifica sprints sin conocimientos de agilidad.
- **Calidad**: registra no conformidades, analiza causas y hace seguimiento a planes de acción.
- **Mantenimiento**: recibe reportes de fallas desde planta (a menudo con foto), atiende y
  cierra órdenes.
- **Servicio al cliente**: registra PQRS/reclamos y responde dentro del plazo.
- **Cualquier empleado**: debe poder **reportar** una incidencia en segundos desde el celular
  (foto + texto + categoría), aunque no la gestione.

# Conceptos (modelo mental simple — UNA palabra por concepto)
- **Actor**: una actividad la ejecuta una **persona** o un **agente ejecutor** (IA o proceso
  autónomo); los agentes también crean actividades y se les mide igual que a las personas, pero
  siempre con un responsable humano que supervisa y cierra.
- **Rol → Manual del cargo → Responsabilidad**: el rol (en Roles, ligado a un área funcional) tiene
  un manual con responsabilidades recurrentes (qué, cada cuánto, evidencia, individual o «por
  equipo», suplente); cada ocupante recibe sus responsabilidades como actividades en Mi día.
- **Etapa**: actividad padre de nivel 1 de un proyecto; puede llevar **compuerta** (aprobador por
  rol) que bloquea la etapa siguiente hasta aprobar.
- **Regla de generación**: evento (módulo + tipo) → plantilla de actividad → responsable por
  rol/área y SLA (vencimiento); configurable en Ajustes.
- **Reunión / Compromiso / Agenda**: la reunión ocupa la agenda de cada asistente, tiene puntos y
  minuta en vivo; sus compromisos se vuelven actividades al cerrarla; la agenda se sincroniza con
  Google/Outlook en dos vías.
- **Tipo de trabajo** (categoría de la visión): define el comportamiento del flujo del proyecto o
  de la actividad (etapas y compuertas de aprobación, tickets con SLA, PHVA, reuniones con
  minutas, metas personales).
- **Ítem de trabajo** con tipo: `Tarea`, `Incidencia` (bug/error), `Solicitud`, `Evento`,
  `Responsabilidad` (recurrente del cargo) y `Aprobación` (pide a alguien Aprobar · Solicitar
  cambios · Rechazar; sirve para calidad, compras y respuestas a clientes). Todos comparten la misma tarjeta y el mismo detalle;
  el tipo solo activa campos extra.
- **Proyecto** (contenedor con fechas, responsable, tipo y, opcionalmente, sprints). **Plantillas y
  proyectos son la misma entidad**: una plantilla es un proyecto marcado como plantilla, sin
  fechas ni responsable, cuyas actividades guardan **duración en días y desplazamiento** respecto
  al inicio (además de objetivo, ejecutable, responsable sugerido por cargo y precedentes). «Crear
  proyecto desde plantilla» calcula las fechas reales a partir de la fecha de inicio y «Guardar
  como plantilla» hace el camino inverso. Una plantilla en uso no se puede borrar.
- **Tipo de proyecto**: `Proyecto`, `Plan de acción`, `Cierre periódico`, `Mantenimiento mayor`…
  El tipo activa campos extra en el Resumen. **Plan de acción** = proyecto de tipo plan de
  acción, creado desde la plantilla «No conformidad → contención → causa raíz → acción
  correctiva/preventiva → verificación de eficacia», **enlazado a la incidencia que lo origina**
  y con los campos de CAL-002 (origen, producto/lote, causa interna o de cliente, análisis de
  causa). No es un módulo aparte: aparece en Mi día, en el árbol y en el Panel como cualquier
  proyecto.
- **Espacio / Área** (áreas funcionales y organigrama de Xtein).
- **Jerarquía padre → hijas**: cualquier tarea puede tener subtareas, y estas a su vez las suyas
  (varios niveles, como hoy en GESPRO). La tarea padre calcula sola su avance, fechas de inicio y
  fin, horas y costo a partir de sus hijas. Se ve como árbol que se expande y contrae (lista,
  Gantt) y como subtareas dentro del detalle; en el tablero la tarjeta muestra "2/3 subtareas".
  Botón "+ subtarea" en cada fila; si una tarea sin hijas recibe su primera subtarea, su trabajo
  registrado se conserva. Además de las subtareas existe un **checklist** simple para pasos
  pequeños que no necesitan responsable ni fecha.
- **Dependencias** ("bloqueado por") visibles como un chip, no como regla oculta.
- **Semáforo** (por fecha de vencimiento; sin prioridad manual), **evidencia de cierre** (soporte,
  confirmación de quien pidió, o automática del sistema), **etiquetas**, **estimación** (tallas S/M/L,
  puntos u horas) y **tiempo registrado** (opcional por equipo, ver "Registro de horas").
- **Incidencia** = cualquier problema que hay que atender, con una **categoría** que cambia el
  formulario y el flujo:
  | Categoría | Ejemplos | Campos propios |
  |---|---|---|
  | **Software** (bug Xtein) | error en una pantalla, cálculo mal, caída | módulo/aplicación ERP, pasos para reproducir, resultado esperado vs. obtenido, entorno, versión, captura/video |
  | **Calidad** (no conformidad) | producto fuera de especificación, devolución interna, hallazgo de auditoría | producto/lote, orden de producción, proceso, cantidad afectada, origen (interna, proveedor, auditoría), análisis de causa raíz (5 porqués / Ishikawa), acción correctiva y preventiva (CAPA), verificación de eficacia |
  | **Mantenimiento** | daño de máquina, falla eléctrica, infraestructura | activo/equipo, ubicación, tipo (correctivo, preventivo, predictivo), parada de producción sí/no, repuestos usados, tiempo fuera de servicio |
  | **Cliente** (PQRS/reclamo) | queja, garantía, entrega tardía | cliente, pedido/factura, canal de entrada, tipo PQRS, plazo legal de respuesta, respuesta enviada, satisfacción |
- **Campos comunes de toda incidencia**: título, descripción, categoría, severidad
  (Crítica · Alta · Media · Baja), área responsable, reportado por, evidencias (fotos, video,
  archivos), SLA (tiempo de respuesta y de solución), duplicada de, ítems relacionados y
  "resuelta por" (enlace a las tareas de corrección).
- Las categorías y sus campos son **configurables** (plantillas de incidencia), no código fijo.
- Una incidencia puede generar tareas o un proyecto; desde una no conformidad de calidad el botón
  «Abrir plan de acción» crea el proyecto de tipo plan de acción desde su plantilla y lo deja
  enlazado en ambos sentidos (la incidencia muestra el avance del plan).
- **Vínculo al ERP**: un ítem puede enlazarse a un documento Xtein (OC, pedido, orden de
  producción, no conformidad de calidad…) y abrirse desde ese documento. Esto es diferencial.

# Flujo de estados (configurable por espacio/proyecto)
Por defecto: `Por hacer → En curso → En revisión → Hecho` + `Bloqueado`, `Bloqueada por compuerta`
(con el motivo visible: «esperando aprobación de la etapa Diseño técnico por Camila») y `Cancelado`.
Incidencias, base común: `Nueva → En triage → Asignada → En atención → Resuelta → Verificada /
Cerrada` (+ `Rechazada`, `Duplicada`). Variaciones por categoría:
- Software: agrega `No reproducible` y `En pruebas` antes de Resuelta.
- Calidad: `Análisis de causa → Plan de acción → Ejecución → Verificación de eficacia → Cerrada`.
- Mantenimiento: `En espera de repuesto` y registro del tiempo de equipo detenido.
- Cliente: `Respondida al cliente` y cierre con confirmación/encuesta; alerta del plazo legal.
- El SLA se muestra como semáforo (a tiempo · por vencer · vencido) y escala automáticamente al
  jefe del área cuando vence.
- El avance se calcula (subtareas/checklist) o se ajusta con slider libre; no 0/25/50/75/100.
- Las reglas (precedentes sin terminar, hijas abiertas, permisos) se muestran ANTES:
  botón deshabilitado con motivo visible ("Bloqueado por: Cotizar proveedor").

# Metodología: Kanban por defecto, Scrum opcional para cualquiera
- Todo espacio (área) o proyecto arranca en **Kanban**: tablero por estados, límites WIP
  opcionales y métricas de flujo (tiempo de ciclo, throughput, ítems envejecidos).
- **Cualquier área o proyecto** —no solo TI— puede **activar Scrum** con un interruptor en sus
  ajustes, y desactivarlo sin perder datos. Al activarlo aparecen: Backlog, Sprints,
  Planificación, Burndown y Retro; al no activarlo, esas pantallas no existen para ese equipo.
- Lenguaje amigable para equipos no técnicos: se puede renombrar "Sprint" por "Ciclo" o
  "Quincena" y estimar con tallas (S · M · L) en vez de puntos [configurable por equipo].
- Configuración por equipo: duración del sprint (1–4 semanas), día de inicio, capacidad por
  persona, qué estados cuentan como "Hecho" y si las incidencias entran al sprint o se atienden
  fuera de él (flujo continuo con SLA).
- Ceremonias guiadas y ligeras, no reuniones obligatorias:
  - **Planificación**: arrastrar del backlog al sprint viendo la capacidad del equipo.
  - **Diario**: vista "qué hice / qué haré / qué me bloquea" que se llena sola con la actividad
    del día; el líder la revisa en el celular.
  - **Revisión**: resumen automático de lo terminado para compartir con gerencia.
  - **Retro**: tablero simple (Bien · Mejorar · Acciones); las acciones se vuelven tareas.
- Al cerrar un sprint: lo no terminado se mueve al siguiente o al backlog con un toque, y se
  muestra la velocidad y el cumplimiento del equipo.
- Un proyecto con Scrum puede vivir dentro de un área con Kanban (y viceversa); la vista
  "Mi día" de la persona mezcla ambos sin que tenga que saber qué metodología usa cada equipo.

# Registro de horas y costeo (opcional por equipo)
- Se **activa por área o proyecto** con un interruptor; si está apagado, no aparece nada de
  tiempo en la interfaz de ese equipo.
- **Cronómetro** en la tarjeta y en el detalle del ítem: iniciar / pausar / detener con un toque.
  Un solo cronómetro activo por persona, visible siempre (barra superior en web, burbuja
  flotante y notificación persistente en móvil). Si se olvida encendido, avisa y permite
  corregir.
- **Registro manual** rápido: "2h 30m ayer" sobre el ítem, o desde una **hoja de tiempo
  semanal** (filas = ítems, columnas = días) para quien prefiere cargar todo al final.
- Cada registro guarda: persona, ítem, fecha, duración, nota opcional, facturable sí/no
  [AJUSTAR] y tipo de actividad (p. ej. desarrollo, reunión, desplazamiento, mantenimiento).
- **Estimado vs. real** por ítem, sprint y proyecto, con alerta cuando se supera lo estimado.
- **Costeo de proyectos**: costo = horas × tarifa del cargo/persona (tomada de Gestión Humana o
  configurada en el proyecto) + costos directos (repuestos, materiales, compras vinculadas desde
  el ERP). Presupuesto vs. ejecutado, desviación y proyección al cierre.
- **Aprobación** opcional del líder (semanal) antes de que las horas cuenten para costos;
  registros aprobados quedan bloqueados.
- En incidencias de mantenimiento, el tiempo registrado alimenta el MTTR y el costo de la orden.
- **Capacidad del equipo**: horas asignadas vs. disponibles por persona, semana y proyecto
  (a partir de la estimación y la jornada del cargo) para no sobrecargar a nadie al asignar.
- Privacidad: cada persona ve sus horas; el líder ve las de su equipo; las tarifas y costos
  solo los ven roles autorizados (gerencia, financiero, líder del proyecto).
- Reportes: horas por persona, área, proyecto, cliente y tipo de actividad; exportables a
  Excel y enlazables al módulo financiero del ERP.

# Vistas (el mismo dato, varias formas)
1. **Mi día** (pantalla por defecto de todos): una tarjeta grande **«Lo primero»** (la actividad
   más urgente por semáforo y hora, con un solo botón «Hecho») y debajo una lista corta ordenada
   por semáforo: rojas (vencidas y de hoy, incluidas aprobaciones pendientes y compromisos de
   reuniones), amarillas, verdes; responsabilidades del cargo del día incluidas. Una línea
   «Sugerencia: empieza por…» (boceto de la Fase 2). Marcar hecho con un toque abre la evidencia
   de cierre. Sin secciones recargadas, sin contadores decorativos, sin leyendas.
2. **Bandeja de notificaciones** (campana): asignaciones nuevas, menciones, fechas propuestas,
   aprobaciones; acciones rápidas (aceptar, abrir). No es una pestaña.
2b. **Incidencias dentro de Mis actividades y Mi equipo**: filtro «Ver: Todas · Tareas ·
   Incidencias · Responsabilidades»; la incidencia es un ítem con chip de categoría y SLA como
   vencimiento; el líder del área la ve en Mi equipo y la asigna. Sin centro de incidencias.
2c. **Reportar incidencia** = «+ Crear → Incidencia» (también desde el FAB y desde cualquier
   documento del ERP): categoría → foto → una frase → enviar; los campos propios de la categoría
   aparecen al elegirla.
3. **Árbol de actividades** (evolución de la lista; vista principal de «Actividades»): todas las
   actividades de mi gestión en jerarquía padre → hijas, con la misma estructura del Gantt pero
   sin el periodo de ejecución. Columnas: actividad, responsable, colaboradores, estado,
   semáforo, vencimiento y avance (el padre calcula el suyo con sus hijas). Expandir/contraer
   por nodo o todo, edición rápida y menú contextual (clic derecho o botón ⋯): abrir detalle,
   agregar subtarea, finalizar/reabrir, inactivar/activar y **gestionar como actividad maestra**.
   - **Autobúsqueda** en el árbol mientras se escribe (nombre, código o persona, sin importar
     tildes): resalta la coincidencia, abre solos los nodos necesarios y muestra los padres de lo
     encontrado para no perder el contexto.
   - **Selector de Vista: General | Actividad maestra.**
     - *General*: todas mis actividades agrupadas en Responsabilidades, Tareas, Eventos y
       Comunitarias.
     - *Actividad maestra*: desde el árbol, sobre un nodo o tarea con hijas, la opción
       «Gestionar como actividad maestra» configura todo GESPRO (árbol, tablero, Mi día, panel y
       creación de tareas) para gestionar solo esa actividad y sus subordinadas, como si fuera un
       proyecto. Una **barra superior fija** muestra cuál es la actividad maestra (ruta, avance,
       subordinadas abiertas, responsable) con el botón **«Volver al árbol general»**.
   - **Barra de filtros de gestión** (aplica al árbol y al tablero):
     - *Estado*: Activas | Finalizadas | Inactivas (con conteo).
     - *Asignación* (combinables): **Responsable** (las que tengo asignadas), **Asignados** (las
       que yo asigné a otra persona y de las que no soy responsable), **Colaborador** (donde
       participo como colaborador).
     - *Área*: al elegir un área de la empresa se listan sus responsables que tienen actividades
       asociadas (con conteo) y se filtra por ellos; se puede afinar marcando responsables.
4. **Tablero Kanban** con arrastrar y soltar, límites WIP y swimlanes opcionales por responsable.
   Por defecto las columnas son el flujo de estados; un proyecto o actividad maestra puede definir
   además **secciones propias** (p. ej. «Pausadas», «Esperando cliente») que se ven como grupos en
   el árbol y como columnas en el tablero.
5. **Calendario** (día/semana/mes) con arrastrar para reprogramar; sincroniza con Google.
6. **Proyecto**: pestaña **Resumen** (descripción, roles —encargado y miembros—, recursos clave
   como enlaces y documentos del ERP, y una línea de tiempo con hitos y actualizaciones),
   **Estado del proyecto en un clic** (En curso · En riesgo · Con retraso, con comentario corto)
   visible en la cabecera del proyecto, en la barra de actividad maestra y en el Panel,
   **Costos** y **Cronograma / Gantt** con dependencias. Arriba, un **selector de mis proyectos**
   (con su tipo como chip) y las acciones **«Crear desde plantilla»** (galería de plantillas con
   tipo, número de actividades y duración estimada; al elegir una se piden fecha de inicio y
   responsable y se calculan las fechas) y **«Guardar como plantilla»**. Un proyecto de tipo plan
   de acción muestra en el Resumen la tarjeta **«Origen y análisis de causa»** (incidencia,
   origen, producto/lote, causa raíz, acción correctiva y preventiva, verificación de eficacia)
   y oculta Costos si no lleva presupuesto.
7. **Backlog + Sprint** (cualquier área o proyecto que active Scrum): planificación con
   capacidad, diario, burndown, revisión, retro y cierre.
8. **Mi equipo (líder) y Panel (gerencia)**: ver «Vistas por rol». Una lista por persona o por
   área con semáforo agregado, atrasadas, carga y cumplimiento contra las metas; filtro por
   jerarquía de áreas funcionales; sin widgets. Las métricas de detalle (tiempo de ciclo,
   reincidencias, MTTR, Pareto de causas) viven en un informe aparte, no en la pantalla principal.
9. **Roles · Manual del cargo** (en Roles, dentro de GESPRO): por rol, ocupantes, suplente y lista
   de responsabilidades (nombre, recurrencia, evidencia, «por equipo»); vista previa «genera N
   responsabilidades en Mi día de…»; el líder de área edita solo los roles de su área.
10. **Reuniones y agenda**: agenda semanal (reuniones + actividades con hora, origen GESPRO /
    Google / Outlook, estado de sincronización), **convocar** con disponibilidad por invitado y
    advertencia o bloqueo de cruces, y la **reunión en curso** con puntos, asistencia, minuta en
    vivo y compromisos que se vuelven actividades al cerrar (minuta enviada a los asistentes;
    espacio «Minuta con IA · próximamente»).
11. **Ajustes de GESPRO**: tipos de trabajo (estados, etapas y compuertas, SLA, Scrum, campos),
    reglas de generación (con «Probar regla»), categorías de incidencia, permisos (Administrador
    GESPRO · líder de área · Calidad · operativo) y Roles/manual.
12. **Ausencias**: banner para el líder con las actividades a reasignar y el suplente sugerido;
    las recurrentes vuelven al titular al terminar la ausencia.
13. **Preferencias de notificación**: bandeja (siempre), push (por defecto), correo solo para
    aprobaciones y vencimientos; sin WhatsApp.
Visibilidad en todas las vistas: jerarquía del organigrama + quien asigna + responsable del proyecto.
Vistas guardadas y filtros compartibles sobre la barra de filtros de gestión (estado,
asignación, área), que evoluciona los checks actuales "Mis actividades / Asignadas / Colaborador".

# Interacciones clave (lo que hace que sea rápido)
- **Captura rápida** global: botón **«+ Crear»** en el encabezado de Xtein (visible desde
  cualquier pantalla, con menú Tarea · Incidencia · Proyecto · Mensaje), FAB en móvil y tecla
  `C` en web. Un solo campo
  con lenguaje natural en español: `Revisar OC 1234 @ana mañana 3pm !alta #compras` →
  responsable, fecha y etiqueta se reconocen como chips editables. Enter = creada.
- **Formulario «+ Nueva actividad»** para cuando se necesita más que la captura rápida: botón
  visible en Mi día y en Actividades (web) y opción «Más opciones» dentro del botón + (móvil),
  que lleva lo ya escrito. Se abre en el panel lateral (web) o en una hoja deslizable (móvil),
  nunca en un popup. Campos: **nombre** (único obligatorio), **clase** (Tareas,
  Responsabilidades, Eventos, Comunitarias), **actividad padre** (lista con todo el árbol con
  sangría por nivel, o «ninguna» para dejarla en la raíz), **responsable** (por defecto yo),
  **colaboradores** (varios, sin repetir al responsable), **programación** (inicio, fin
  opcional y repetición: no se repite, cada día, cada semana, cada mes), **área**
  y **descripción** opcional.
  - Al elegir un padre, la clase y el área se heredan de él; si cambio la clase y no coincide con
    la del padre, el padre se quita.
  - Con una actividad maestra activa, el padre viene elegido y la lista solo muestra sus
    subordinadas.
  - Una nota muestra a quién se notificará antes de crear («Se notificará a Andrés»).
  - Al crear, la actividad queda seleccionada dentro de su padre (que se abre solo) y aparece en
    Mi día si soy responsable o colaborador.
  - **«Agregar subtarea»** (menú contextual del árbol, panel de detalle o hoja de opciones en
    móvil) abre este mismo formulario con el padre ya elegido.
- **Detalle en panel lateral** (web) / **hoja deslizable** (móvil), nunca un popup modal que tape
  todo. Todo editable en el sitio: título, campos como chips, descripción enriquecida, subtareas,
  adjuntos (arrastrar, pegar o cámara), actividad y comentarios en un solo hilo con @menciones
  y filtro "solo comentarios / historial". En la cabecera del panel: flechas **anterior /
  siguiente** para recorrer la lista sin cerrarlo, **expandir** a pantalla completa y **copiar
  enlace** del ítem. Antes de enviar un comentario se indica «Se notificará a N personas».
  **Visibilidad por ítem**: solo colaboradores (por defecto) o visible para el área / el
  cliente, base del portal de cliente sin darle acceso al proyecto.
- **Paleta de comandos** `Ctrl+K` (también la lupa del encabezado de Xtein): buscar cualquier
  ítem, proyecto o persona, crear, cambiar estado, ir a proyecto.
- Atajos (web): `C` crear, `E` editar, `A` asignar, `S` estado, `D` fecha.
- **Gestos (móvil)**: deslizar → hecho; deslizar ← posponer/reprogramar; mantener → mover/
  multiselección.
- **Edición masiva** (selección múltiple: asignar, mover, cambiar estado).
- **Guardado optimista** inmediato con opción "Deshacer" (sin recargar la lista).
- **Plantillas** de ítem y de proyecto (p. ej. "Reporte de incidencia", "Cierre de mes",
  "Lanzamiento de producto", "Plan de acción · No conformidad"). Las de proyecto se gestionan
  dentro de Proyectos, no en un módulo aparte.
- **Recurrencia** en lenguaje humano ("cada lunes", "el último día hábil del mes").
- Recordatorios y notificaciones push (web y móvil) configurables por el usuario.

# Que no sea aburrido (sin volverse un juego)
- Microinteracciones: check animado y pequeña celebración al cerrar el día o el sprint.
- Anillo de progreso diario/semanal en "Mi día"; racha opcional.
- Avatares, colores con significado, estados vacíos amables e ilustrados con acción sugerida.
- Tono de voz cercano y en español neutro colombiano ("¡Listo! Te quedan 3 para hoy").
- Modo oscuro.

# Móvil (requisito de primer nivel)
- Diseñar **mobile-first**; la web se expande desde el móvil, no al revés.
- Navegación inferior: *Mi día · Bandeja · Actividades · Buscar* + FAB "Crear".
- **Actividades en el celular**: el mismo árbol de la web (Árbol | Tablero) con sangría
  limitada para que quepa en 375 px, nombre en dos líneas y debajo responsable, estado, fecha,
  «2/3 hijas» y avance. Selector Vista General | Actividad maestra, campo de autobúsqueda y una
  fila deslizable de filtros (estado, Responsable, Asignados, Colaborador, Área).
  - **Mantener presionada** una actividad (o tocar ⋯) abre una **hoja de opciones**: gestionar
    como actividad maestra, abrir detalle, agregar subtarea, finalizar o reabrir, inactivar o
    activar.
  - Los filtros se ajustan en una **hoja de filtros** (estado con conteo, asignación con la
    explicación de cada opción, áreas y sus responsables con actividades) con el botón
    «Ver N actividades».
  - Con una actividad maestra activa, una **barra azul fija** bajo el encabezado de Xtein la
    muestra en todas las pantallas (Mi día, Bandeja, Actividades, Buscar) con su avance y el
    botón «Volver al general»; Mi día y el tablero quedan limitados a esa actividad.
  - Lo que se marca como hecho en Mi día se refleja en el árbol y al revés.
- Objetivos táctiles ≥ 44 px, uso con una mano, funciona con señal débil (cola offline y
  sincronización al reconectar), cámara para evidencias, notificaciones push.
- Entrega doble desde **una sola base Angular**:
  1. **PWA instalable** (web y escritorio): service worker, manifest, instalación desde el
     navegador, push web.
  2. **App en tiendas** (Google Play y App Store) empaquetada con **Capacitor**.
- En Capacitor usar plugins nativos: push (FCM/APNs), cámara y galería, archivos, compartir,
  háptica, biometría para volver a entrar, deep links (abrir un ítem desde la notificación o
  un enlace), badge con el número de pendientes y almacenamiento local para el modo offline.
- Capa de plataforma (`isNative` / web) para que el mismo componente use la API nativa o la web
  sin duplicar pantallas.
- Microfrontends en la app de tienda: los remotos (`mfe-gespro`) van **empaquetados dentro del
  build nativo** (un shell móvil que incluye GESPRO), no se descargan en caliente, para cumplir
  las políticas de Apple/Google sobre código remoto. Las actualizaciones de solo web se pueden
  publicar por OTA dentro de lo que permiten las tiendas.
- Diseño adaptado a cada plataforma: safe areas (notch), botón atrás de Android, gesto de volver
  de iOS, teclado que no tape los campos, splash e ícono de la app.
- Entregar también los requisitos de publicación: íconos, capturas, textos de la ficha, política
  de privacidad y justificación de permisos (cámara, notificaciones).

# Restricciones técnicas (plataforma Xtein)
- Angular 21, standalone, signals; microfrontend **Native Federation** (`mfe-gespro`, expone
  `./ApplicationHost`) dentro del Shell Xtein; código de aplicación `GES-001`.
- Usar el design system **@xtein/ui** y DevExtreme 25.2 cuando aporte (Scheduler, Gantt);
  crear en `libs/ui` lo que falte: tarjeta de ítem, selector de personas con avatar, chips de
  estado/semáforo, timeline, barra de progreso, hoja inferior móvil.
- Tokens semánticos de color como CSS vars (estado, semáforo, severidad, tipo) con contraste
  AA en claro y oscuro; nada de colores en línea.
- Acceso al back vía `XteinApiClientService` (sobre `prmAccion/prmDatos`), sesión desde
  `SessionService`, toolbar/workspace runtime de la plataforma.
- Back a proponer (manteniendo el estilo actual de endpoints `GES0xx`): paginación y búsqueda en
  servidor, IDs generados por el servidor, permisos validados en servidor, un endpoint por acción
  (no sobrecargar `/GES00/estados`), eventos WebSocket por cambio de ítem, nuevas entidades
  (incidencia, sprint, etiqueta, checklist, registro de tiempo, vínculo a documento ERP).
- Accesibilidad WCAG 2.2 AA, teclado completo, lectores de pantalla.
- Rendimiento: listas virtualizadas, primera vista útil < 1 s con 5 000 ítems.

# Entregables que te pido (diseño y prototipo navegable)
Trabaja **por etapas** y espera mi revisión al final de cada una antes de seguir.

**Formato del prototipo**
- Prototipo **HTML interactivo y navegable** (un solo archivo por etapa, sin backend):
  se hace clic entre pantallas, se abren paneles/hojas, se arrastran tarjetas, se marca hecho,
  funciona la captura rápida y el cronómetro corre. Estado en memoria; datos de ejemplo.
- Cada pantalla en **dos marcos lado a lado o con selector**: móvil (390×844, estilo app
  instalada con navegación inferior y FAB) y web (1440×900, con barra lateral del Shell Xtein).
- Selector de **tema claro / oscuro** y de **rol** (Operativo · Líder · Gerencia) para ver cómo
  cambia lo que se muestra.
- **Datos de ejemplo realistas** de una empresa colombiana cliente de Xtein con planta de
  producción [AJUSTAR nombre/sector]: nombres en
  español, áreas reales (Compras, Producción, Calidad, Mantenimiento, Ventas, Gestión Humana,
  Financiero), tareas, incidencias de las 4 categorías, responsabilidades por cargo, un proyecto
  con sprints y horas registradas. Nada de "Lorem ipsum".
- Todo el texto de la interfaz en español; fechas y moneda en formato Colombia (COP).

La prioridad de negocio es la **Etapa 1 de la visión** (actividades, proyectos como actividad
maestra, planes de acción de calidad, notificaciones, conversación por actividad y reuniones);
el registro de horas y el costeo se **diseñan pero no se construyen** en esta etapa; la **Fase 2** (prioridades
asistidas por IA, Pareto por persona) solo necesita un boceto de cómo se vería en Mi día y en el
Panel.

**Etapa 1 · Fundamentos**
1. Arquitectura de información y mapa de navegación (móvil y web) como diagrama.
2. Sistema visual: paleta con tokens semánticos (estado, semáforo, severidad, tipo, SLA) en
   claro y oscuro, tipografía, espaciado, radios, sombras, iconografía y microanimaciones.
3. Hoja de componentes: tarjeta de ítem, chips (estado, semáforo, persona, fecha, etiqueta),
   selector de personas con avatar, captura rápida, panel/hoja de detalle, barra de progreso,
   semáforo SLA, cronómetro, estados vacíos, toasts con "Deshacer", navegación inferior y FAB.

**Etapa 2 · MVP navegable**
Todo dentro del marco de Xtein: Mi día, Bandeja, Árbol de actividades (autobúsqueda, vista
General | Actividad maestra con su barra superior, barra de filtros de gestión, menú contextual),
Kanban, Detalle de ítem (panel en web / hoja en móvil con anterior/siguiente, expandir, copiar
enlace) con comentarios, @menciones, aviso de a quién se notifica, subtareas y adjuntos, botón
«+ Crear» global en el encabezado de Xtein, Formulario de nueva actividad, Captura rápida con lenguaje natural, paleta de comandos
(Ctrl+K), onboarding de primera entrada y estados vacíos.

**Etapa 3 · Incidencias**
Reportar incidencia (flujo mínimo con foto, una variante por categoría), Centro de incidencias
(triage por categoría y área, semáforo SLA, duplicados), Detalle de incidencia por categoría
(software, calidad con causa raíz y CAPA, mantenimiento con activo y tiempo detenido, cliente
con plazo de respuesta), ítem de Aprobación (aprobar / solicitar cambios / rechazar).

**Etapa 4 · Planeación y tiempo**
Calendario, Proyecto (selector de proyectos, Resumen con roles e historial, estado en un clic,
costos y Gantt, galería «Crear desde plantilla» y «Guardar como plantilla», ejemplo de proyecto
de tipo plan de acción enlazado a una no conformidad), Backlog y Sprint (planificación con capacidad,
diario, burndown, retro), Cronómetro activo (web y móvil), Hoja de tiempo semanal, Aprobación de
horas.

**Etapa 5 · Gestión y ajustes**
Panel del líder y de gerencia con widgets arrastrables (carga, capacidad del equipo, atrasos,
SLA, métricas de flujo, costos, adopción por área), visibilidad por ítem y portal de cliente,
Ajustes de espacio/proyecto (activar Scrum, activar registro de horas, flujo de estados, plantillas
de incidencia y de proyecto, tipos de proyecto, límites WIP).

**En cada etapa entrega además**
- Lista de flujos recorridos en el prototipo con el **número de toques/clics** frente al GESPRO
  actual (p. ej. crear tarea asignada con fecha: hoy ~8 clics y 2 popups → objetivo 1 campo +
  Enter).
- Notas de diseño breves: decisiones tomadas, alternativas descartadas y preguntas abiertas.
- Criterios de accesibilidad aplicados (contraste, tamaños táctiles, foco de teclado).

**Fuera de esta entrega** (se harán después, a partir del prototipo aprobado): modelo de datos y
endpoints, implementación en Angular/`mfe-gespro`, plan de migración y despliegue. Aun así, no
diseñes nada que contradiga las restricciones técnicas de arriba.

# Lo que NO quiero
- Grillas densas como pantalla principal, ni árboles que se abran todos a la vez: los niveles
  se expanden a demanda y la tarea padre siempre resume a sus hijas.
- Popups modales para editar.
- Reglas que el usuario descubra por un mensaje de error.
- Rehacer conceptos con nombres distintos en cada pantalla.
- Copiar Jira con toda su complejidad: la mayoría de usuarios no son de TI.
- Más de 4 pestañas por rol, varios botones primarios por pantalla o funciones de varios roles
  mezcladas en una vista.
- Textos explicativos, leyendas y notas de ayuda dentro de las pantallas.
- Prioridad manual: solo semáforo por fecha.
````

---

## Parte 4 · Decisiones a confirmar antes de usar el prompt

1. ~~**Móvil**~~ → **Decidido:** PWA instalable + app en Play Store / App Store con Capacitor.
2. ~~**Incidencias**~~ → **Decidido:** software + calidad (no conformidades/CAPA) + mantenimiento + clientes (PQRS).
3. ~~**Scrum**~~ → **Decidido:** opcional; cualquier área o proyecto lo activa (Kanban por defecto).
4. ~~**Registro de horas**~~ → **Decidido:** opcional por equipo, con cronómetro, hoja de tiempo y costeo de proyectos.
5. ~~**Herramienta destino**~~ → **Decidido:** Claude, para diseño de pantallas y prototipo navegable por etapas.
6. ~~**Las 20 decisiones de la Visión**~~ → **Decididas** en entrevista (27 oct 2026) y listadas en la
   sección «Decisiones de diseño de la Visión (Etapa 1)» del prompt; especificación en
   `.omc/specs/deep-interview-gespro-vision.md` y plan de consenso en `.omc/plans/gespro-etapa1-diseno.md`.
   Quedan por decidir fuera del prompt: host del backend (.NET o excepción Node), proveedores de push y
   correo, fuente de ausencias de Gestión Humana, y nombre/sector de la empresa de ejemplo [AJUSTAR].

## Parte 5 · Cómo usarlo en Claude

1. Pega el prompt completo (Parte 3) en una conversación nueva; Claude entregará solo la **Etapa 1**.
2. Revisa, pide ajustes en la misma conversación y luego escribe: `Aprobado. Sigue con la Etapa 2.`
3. Si la conversación se alarga, abre una nueva con el prompt + el archivo HTML aprobado de la etapa anterior y: `Continúa con la Etapa N respetando este sistema visual.`
4. Para comparar, adjunta capturas del GESPRO actual (lista de actividades y popup de detalle).
5. El prototipo aprobado será la base de la implementación en `mfe-gespro`.
