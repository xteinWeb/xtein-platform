# Sesión y cierre por inactividad

Las credenciales se conservan exclusivamente en memoria y se comparten entre pestañas abiertas del mismo origen y perfil del navegador mediante `BroadcastChannel`. Una nueva pestaña consulta a las demás antes de ejecutar los guards de navegación (hasta 1,5 segundos). Si encuentra una sesión vigente, entra sin pedir login. Al iniciar la plataforma se eliminan las claves antiguas de sesión de `localStorage` y `sessionStorage`; las preferencias ajenas a la sesión se conservan.

## Configuración

Editar `session` en ambos archivos del shell:

- `apps/shell/src/environments/environment.ts`: desarrollo.
- `apps/shell/src/environments/environment.prod.ts`: producción.

```typescript
session: {
  inactivityTimeoutSeconds: 15 * 60,
  useBackendTimeout: true
}
```

Con `useBackendTimeout: true`, un `TIEMPO_SESION` positivo recibido en el login tiene prioridad. El backend lo entrega en minutos; `AuthService` lo convierte a segundos. Si falta, es cero o no es válido, se usa `inactivityTimeoutSeconds`. Con `useBackendTimeout: false` se aplica siempre el tiempo configurado en el shell. Una configuración inválida usa 15 minutos, nunca una sesión indefinida. Los cambios de environment requieren compilar y reiniciar la aplicación.

## Comportamiento

- Teclado, puntero, desplazamiento y contacto táctil renuevan el plazo en una página visible.
- Consultas automáticas y renovaciones de token no cuentan como actividad.
- El control utiliza una fecha límite: al volver de suspensión o de una pestaña en segundo plano, verifica el vencimiento antes de aceptar nueva actividad.
- Al vencer se borran las credenciales, se limpian las pestañas y el catálogo, y se redirige al login.
- Cerrar una pestaña limpia sus credenciales sin cerrar las demás. Al cerrar todas, la sesión desaparece: al volver a abrir se solicita login. Recargar la única pestaña también solicita login; si otra permanece abierta, puede compartir su sesión.
- La actividad de cualquiera de las pestañas mantiene la sesión compartida. Abrir otra pestaña y renovar el token no reinician el tiempo de inactividad.
- Cerrar sesión manualmente o por inactividad cierra todas las pestañas de esa sesión. Se rechazan mensajes tardíos que intenten restaurarla.
- Si el navegador no permite `BroadcastChannel`, o ninguna pestaña responde dentro del plazo, se solicita login. No se guardan credenciales persistentes como alternativa.

El cierre sigue el mecanismo existente de `AuthService.logout()` (eliminación local de sesión). No se añadió un endpoint de revocación de tokens: el backend mantiene su propia validación y expiración del JWT.

## Archivos

- `libs/session/src/lib/storage/session-storage.service.ts`: almacenamiento en memoria y limpieza de credenciales antiguas.
- `libs/session/src/lib/models/session-policy.model.ts`: política y valor predeterminado.
- `libs/session/src/lib/services/session-activity.service.ts`: actividad y vencimiento compartidos.
- `libs/session/src/lib/services/session-tabs.service.ts`: descubrimiento de pestañas, sincronización y cierre del documento.
- `libs/session/src/lib/models/shared-session.model.ts`: contratos de mensajes de sesión.
- `libs/session/src/lib/constants/session-tabs.constants.ts`: canal y plazo de descubrimiento.
- `libs/session/src/lib/services/session.service.ts`: evita recuperar un token desde respuestas tardías después del cierre.
- `libs/session/src/public-api.ts`: exportaciones compartidas.
- `apps/shell/src/app/services/shell-session.service.ts`: limpieza del workspace y navegación al login.
- `apps/shell/src/app/app.component.ts` y `app.config.ts`: inicialización y configuración central.

Las pruebas de `libs/session` cubren la reapertura sin credenciales, limpieza selectiva, expiración, actividad de teclado, renovación de token, suspensión, descubrimiento entre pestañas, cierre de una o todas y rechazo de mensajes de sesiones cerradas.

Validación automatizada: 16 pruebas de sesión y 2 pruebas de guards de autenticación aprobadas. La comprobación visual con login real queda para el entorno del usuario.

## Comprobación en el navegador

1. Reiniciar los servidores del shell y microfrontends, cerrar las pestañas que ejecutaban la versión anterior y abrir la plataforma.
2. Iniciar sesión y abrir la misma URL en otra pestaña del mismo navegador: debe entrar sin solicitar credenciales.
3. Cerrar la primera pestaña: la segunda debe continuar funcionando.
4. Cerrar sesión manualmente teniendo dos pestañas abiertas: ambas deben mostrar login.
5. Repetir el ingreso, cerrar todas las pestañas y volver a abrir: debe solicitar login.
6. Para verificar inactividad, configurar temporalmente un plazo corto con `useBackendTimeout: false`, compilar y comprobar que la actividad en cualquiera mantiene ambas sesiones y que, al dejar de interactuar, ambas cierran.
