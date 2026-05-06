# Manual de Usuario — Gestio Web

**Sistema CRM Empresarial para Gestión Multi-Tienda**

---

## Índice

1. [Acceso y Primeros Pasos](#1-acceso-y-primeros-pasos)
2. [Panel Principal (Dashboard)](#2-panel-principal-dashboard)
3. [Inventario](#3-inventario)
4. [Clientes](#4-clientes)
5. [Proveedores](#5-proveedores)
6. [Facturación](#6-facturación)
7. [Tiendas](#7-tiendas)
8. [Consignaciones](#8-consignaciones)
9. [Caja](#9-caja)
10. [Punto de Venta (POS)](#10-punto-de-venta-pos)
11. [Equipos y Tareas](#11-equipos-y-tareas)
12. [Reportes](#12-reportes)
13. [Notificaciones](#13-notificaciones)
14. [Configuración](#14-configuración)
15. [Sistema de Permisos](#15-sistema-de-permisos)
16. [Monedas y Tasas de Cambio](#16-monedas-y-tasas-de-cambio)
17. [Preguntas Frecuentes](#17-preguntas-frecuentes)

---

## 1. Acceso y Primeros Pasos

### 1.1 Iniciar Sesión

1. Abre `https://gestio-web.vercel.app` en tu navegador.
2. Introduce tu **correo electrónico** y **contraseña**.
3. Haz clic en **Iniciar Sesión**.

> Si tu organización tiene activada la verificación de correo, verifica tu email antes de poder acceder.

### 1.2 Crear una Cuenta

1. En la pantalla de login, haz clic en **Crear Cuenta**.
2. Completa: nombre completo, correo, contraseña.
3. Si estás creando tu primera organización, introduce el nombre de la empresa.
4. Si recibiste una invitación, el formulario de registro ya estará pre-llenado con la organización y el rol asignado.

### 1.3 Aceptar una Invitación

Si recibiste un correo de invitación:

1. Abre el enlace del correo.
2. Si ya tienes cuenta → inicia sesión y haz clic en **Aceptar Invitación**.
3. Si eres nuevo → crea tu cuenta y se te añadirá automáticamente como miembro de la organización.

### 1.4 Seleccionar Organización

Si perteneces a varias organizaciones:

1. Tras iniciar sesión, verás un selector de organización en la barra superior.
2. Haz clic sobre el nombre de la organización activa.
3. Selecciona la organización deseada de la lista.

> Todos los datos que veas y modifiques estarán ligados a la organización activa. Cambiar de organización cambia todo el contexto.

### 1.5 Seleccionar Tienda

1. En la barra superior, junto al nombre de la organización, verás el nombre de la tienda activa.
2. Haz clic para abrir el selector de tiendas.
3. Selecciona la tienda donde estás operando.

> El stock, los movimientos de caja y las ventas se registran por tienda. Asegúrate de tener la tienda correcta seleccionada.

---

## 2. Panel Principal (Dashboard)

El Dashboard es la primera pantalla tras iniciar sesión. Muestra un resumen del estado del negocio:

- **Métricas clave**: ventas del período, inventario, clientes activos.
- **Gráficos**: tendencias de ventas, productos más vendidos.
- **Alertas**: stock bajo, tareas pendientes.

**Uso:** El Dashboard es de solo lectura. No se requieren acciones aquí. Úsalo para una visión rápida del estado de tu organización.

---

## 3. Inventario

### 3.1 Productos

**Ver productos:**
1. Ve a **Inventario → Productos** en la barra lateral.
2. Usa la barra de búsqueda para encontrar un producto por nombre o SKU.
3. Usa los filtros por categoría.
4. Haz clic en un producto para ver sus detalles.
5. Cada tarjeta de producto muestra en su footer la **moneda del precio** y el **stock total** across todas las tiendas.

**Crear un producto:**
1. Haz clic en **Nuevo Producto**.
2. Completa los campos:
   - **Nombre** (obligatorio)
   - **SKU** (obligatorio, código interno)
   - **Código de barras** (opcional)
   - **Categoría** (selecciona o crea una nueva)
   - **Precio de venta** y **Costo**
   - **Moneda del precio** — cada producto define su precio en una moneda específica (CUP, USD, EUR, MLC, USDT, etc.). Por defecto usa la moneda de la tienda activa.
   - **Tasa de impuesto** (%)
   - **Descripción**
3. **Stock inicial** (opcional): al crear el producto puedes añadir directamente el stock en una o más tiendas:
   - Haz clic en **Agregar tienda**.
   - Selecciona la tienda y escribe la cantidad.
   - Puedes añadir stock en múltiples tiendas a la vez.
   - El sistema registrará automáticamente movimientos de tipo **Apertura** para cada entrada.
4. Haz clic en **Crear**.

> Si no defines stock inicial, el producto se crea sin inventario. Puedes añadirlo después desde su ficha de detalle con el botón **Agregar Stock** o desde **Inventario → Movimientos**.

**Importar productos desde CSV:**
1. Haz clic en **Importar CSV**.
2. Descarga la plantilla de ejemplo para ver el formato.
3. Completa tu archivo — la columna `price_currency_code` permite definir la moneda de cada producto usando su código ISO (CUP, USD, EUR, USDT, etc.).
4. Sube el archivo y revisa la vista previa antes de confirmar.

**Ficha del producto:**
1. Haz clic en un producto en la lista o ve a **Nuevo Producto** para crear uno nuevo.
2. La ficha incluye:
   - **Información general**: nombre, SKU, código de barras, categoría, descripción.
   - **Precios y Stock**: precio de venta, moneda, costo, tasa de impuesto.
   - **Stock por Tienda**: tabla mostrando cantidad disponible, reservada y mínimo por cada tienda. Si el producto no tiene stock aún, verás un botón **Agregar Stock** que te lleva a registrar un movimiento de apertura.
3. Puedes editar y guardar los cambios. Eliminar un producto lo marca como inactivo (no se borra permanentemente).

**Variantes:**
1. En la vista de detalle del producto, ve a la pestaña **Variantes**.
2. Cada variante tiene su propio SKU, precio y stock.
3. Úsalas cuando un producto tiene diferentes presentaciones (ej: camiseta en S, M, L).

### 3.2 Categorías

Las categorías organizan los productos de forma jerárquica (pueden tener sub-categorías).

1. Ve a **Inventario → Categorías**.
2. Haz clic en **Nueva Categoría**.
3. Opcionalmente selecciona una categoría padre para crear una sub-categoría.

### 3.3 Movimientos de Stock

Cada vez que el stock de un producto cambia, se registra un movimiento. Existen 10 tipos:

| Tipo | Cuándo se usa |
|---|---|
| **Compra** | Se recibió mercancía de un proveedor |
| **Venta** | Se vendió un producto |
| **Ajuste** | Corrección manual del stock |
| **Transferencia entrada** | Stock recibido de otra tienda |
| **Transferencia salida** | Stock enviado a otra tienda |
| **Devolución** | Un cliente devolvió un producto |
| **Daño** | Producto dañado o perdido |
| **Consignación entrada** | Stock recibido en consignación |
| **Consignación salida** | Stock enviado en consignación |
| **Apertura** | Stock inicial del producto |

**Ver movimientos:**
1. Ve a **Inventario → Movimientos**.
2. Filtra por fecha, producto o tienda.

### 3.4 Transferencias entre Tiendas

Para mover stock de una tienda a otra:

1. Ve a **Inventario → Transferencias**.
2. Haz clic en **Nueva Transferencia**.
3. Selecciona la **tienda origen** y la **tienda destino**.
4. Añade los productos y cantidades.
5. Confirma la transferencia.

> La transferencia genera automáticamente un movimiento de salida en la tienda origen y uno de entrada en la destino.

### 3.5 Reporte de Inventario

El reporte muestra el estado actual del inventario con las siguientes métricas:

- **Unidades Totales**: suma real de cantidades de stock (no solo conteo de registros).
- **Valor Total (costo)**: valor del inventario basado en el costo de cada producto.
- **Stock Bajo**: productos cuyo stock está por debajo del mínimo definido (`min_quantity`) para esa tienda.

**Gráficos:**
- **Inventario por Producto**: barras con el stock total de los 10 productos con más unidades (agregado across todas las tiendas).
- **Distribución por Categoría**: gráfico circular mostrando la proporción de stock por categoría.

**Exportar CSV:** Incluye columnas de producto, SKU, variante, tienda, cantidad, reservado y disponible.

### 3.6 Alertas de Stock Bajo

Cuando un producto alcanza o baja de su stock mínimo (`min_quantity`):

- Aparece una notificación en el panel de notificaciones.
- Se puede consultar la lista de alertas en **Inventario → Alertas**.
- El reporte de inventario también muestra una tabla de productos con stock bajo, indicando la cantidad actual vs. el mínimo requerido.

---

## 4. Clientes

### 4.1 Lista de Clientes

1. Ve a **Clientes → Lista** o **Clientes → Clientes**.
2. Busca por nombre, código o email.
3. Filtra por tipo (individual o empresa), tags o estado.
4. Haz clic en un cliente para ver su ficha completa.

### 4.2 Crear un Cliente

1. Haz clic en **Nuevo Cliente**.
2. Completa:
   - **Nombre** o **Razón Social**
   - **Tipo**: Individual o Empresa
   - **Email**, **Teléfono**
   - **NIT/ID fiscal** (si aplica)
   - **Límite de crédito**
3. Añade **tags** para categorizar (ej: "VIP", "Mayorista").
4. Guarda.

### 4.3 Ficha del Cliente

La ficha incluye:

- **Datos generales**: nombre, contacto, saldo actual, límite de crédito.
- **Contactos**: personas asociadas al cliente (nombre, cargo, teléfono, email).
- **Direcciones**: de facturación, envío u otras.
- **Notas**: comentarios internos con fecha y autor.

**Añadir una nota:**
1. En la ficha del cliente, ve a la sección **Notas**.
2. Escribe el contenido y guarda. La nota se timestamp con tu usuario y la fecha actual.

### 4.4 Exportar Clientes

1. En la lista de clientes, haz clic en **Exportar CSV**.
2. Se descarga un archivo con todos los clientes visibles según tus filtros.

---

## 5. Proveedores

El manejo de proveedores es idéntico al de clientes, pero enfocado en la cadena de suministro.

1. Ve a **Clientes → Proveedores**.
2. Crear, editar y gestionar proveedores con los mismos campos: contactos, direcciones y notas.

> Cuando recibes mercancía de un proveedor, el movimiento de stock se registra como **Compra**.

---

## 6. Facturación

El proceso de facturación sigue un flujo de tres etapas:

```
Oferta → Prefactura → Factura
```

### 6.1 Ofertas

Una oferta es un presupuesto o cotización enviada a un cliente.

**Crear una oferta:**
1. Ve a **Facturación → Ofertas**.
2. Haz clic en **Nueva Oferta**.
3. Selecciona el **cliente** y la **tienda**.
4. Añade **productos** con cantidad, precio y descuentos si aplica.
5. Revisa los totales (subtotal, impuestos, descuento, total).
6. Guarda como **Borrador** o cambia el estado a **Enviada**.

**Estados de una oferta:**
- **Borrador**: en preparación.
- **Enviada**: entregada al cliente.
- **Aceptada**: el cliente la aprobó → puede convertirse en prefactura.
- **Rechazada**: el cliente la rechazó.
- **Expirada**: superó la fecha de validez.

### 6.2 Prefacturas

Una prefactura es un documento interno que requiere aprobación antes de facturar.

**Crear una prefactura:**
1. Ve a **Facturación → Prefacturas**.
2. Puedes crear desde cero o convertir una oferta aceptada.
3. Añade productos, revisa totales.
4. Envía a **Aprobación**.

**Estados:**
- **Borrador** → **Pendiente de Aprobación** → **Aprobada** o **Rechazada**.

> Solo usuarios con permiso de aprobación pueden aprobar prefacturas.

### 6.3 Facturas

La factura es el documento final de cobro.

**Crear una factura:**
1. Ve a **Facturación → Facturas**.
2. Haz clic en **Nueva Factura** o convierte una prefactura aprobada.
3. Completa los datos del cliente, productos, forma de pago.
4. Emite la factura.

**Estados:**
- **Borrador** → **Emitida** → **Pagada** o **Cancelada**.

**Estado de pago:**
- **Pendiente**: no se ha registrado ningún pago.
- **Parcial**: se ha pagado una parte.
- **Pagada**: el total está cubierto.

**Registrar un pago:**
1. Abre la factura emitida.
2. Haz clic en **Registrar Pago**.
3. Introduce: **monto**, **método** (efectivo, tarjeta, transferencia), y referencia opcional.
4. El sistema hereda automáticamente la moneda y tasa de cambio de la factura.
5. Guarda. El estado de pago se actualizará a **Parcial** o **Pagada** según corresponda.

> Puedes registrar múltiples pagos parciales hasta cubrir el total de la factura.

**Descargar PDF:**
- Una vez emitida, la factura tiene un botón **Descargar PDF** que genera un archivo imprimible usando la función de impresión del navegador.

**Notas de crédito:**
- Se crean para anular total o parcialmente una factura emitida.
- Disponibles desde la vista de detalle de la factura.

### 6.4 Multi-moneda

Cada producto define su precio en una moneda específica. Al crear una oferta, prefactura o factura:

1. La moneda del documento se selecciona al crearlo (por defecto, la moneda de la tienda activa).
2. Los precios de los productos se **convierten automáticamente** a la moneda del documento usando las tasas de cambio vigentes.
3. Puedes cambiar la moneda del documento en cualquier momento — los precios se reconvierten.
4. Al convertir una oferta o prefactura a factura, puedes elegir una moneda diferente a la original — los precios se convierten en el proceso.
5. Los **pagos** heredan la moneda y tasa de cambio de la factura padre.

> El sistema usa el CUP como moneda pivote para todas las conversiones. Ejemplo: EUR → CUP → USD.

---

## 7. Tiendas

### 7.1 Gestión de Tiendas

1. Ve a **Tiendas** en la barra lateral.
2. Verás la lista de todas las tiendas de la organización.
3. Cada tienda tiene:
   - **Nombre** y **código**
   - **Moneda** asignada
   - **Dirección** y datos de contacto
   - Estado activa/inactiva

**Crear una tienda:**
1. Haz clic en **Nueva Tienda**.
2. Completa nombre, código, moneda y dirección.
3. Asigna usuarios que tendrán acceso a esta tienda.

### 7.2 Jerarquía de Tiendas

Las tiendas pueden tener una **tienda padre** (ej: una tienda principal y varias sucursales). Esto se configura en el detalle de la tienda.

---

## 8. Consignaciones

La consignación permite enviar stock a un socio (cliente o proveedor) para que lo venda en nombre de la organización.

### 8.1 Crear una Consignación

1. Ve a **Consignaciones → Nueva**.
2. Selecciona el **socio** (cliente o proveedor) y la **tienda**.
3. Añade los **productos** y cantidades a consignar.
4. Guarda. La consignación queda en estado **Activa**.

### 8.2 Registrar Ventas y Devoluciones

**Registrar una venta:**
1. Abre la consignación activa.
2. Haz clic en **Registrar Venta**.
3. Selecciona el producto y la cantidad vendida.
4. Guarda.

**Registrar una devolución:**
1. Abre la consignación.
2. Haz clic en **Registrar Devolución**.
3. Indica producto y cantidad devuelta.

### 8.3 Liquidar una Consignación

Cuando la consignación está completa:

1. Abre la consignación.
2. Haz clic en **Liquidar**.
3. Revisa el resumen: productos enviados, vendidos, devueltos.
4. Calcula la comisión del socio.
5. Confirma la liquidación. La consignación pasa a estado **Completada**.

### 8.4 Estados

| Estado | Significado |
|---|---|
| **Activa** | En curso, sin movimientos registrados |
| **Parcial** | Se han registrado algunas ventas |
| **Completada** | Liquidada completamente |
| **Cancelada** | Anulada antes de completarse |

---

## 9. Caja

### 9.1 Sesiones de Caja

Cada turno de trabajo en una tienda requiere una sesión de caja.

**Abrir caja:**
1. Ve a **Caja → Sesiones**.
2. Haz clic en **Abrir Caja**.
3. Introduce el **monto de apertura** (efectivo inicial en la caja).
4. Confirma. La sesión queda **Abierta**.

**Cerrar caja:**
1. Ve a la sesión activa.
2. Haz clic en **Cerrar Caja**.
3. Introduce el **monto de cierre** (efectivo real contado).
4. El sistema calcula el **monto esperado** (apertura + ingresos - egresos) y la **diferencia**.
5. Confirma el cierre.

### 9.2 Movimientos de Caja

Durante una sesión abierta, puedes registrar:

- **Ingreso**: dinero que entra (no venta, ej: préstamo recibido).
- **Egreso**: dinero que sale (no compra, ej: pago de servicio).
- **Depósito**: dinero llevado al banco.
- **Retiro**: dinero retirado de la caja.

**Registrar un movimiento:**
1. En el detalle de la sesión, haz clic en **Nuevo Movimiento**.
2. Selecciona tipo, monto, y añade una nota descriptiva.
3. Guarda.

---

## 10. Punto de Venta (POS)

La interfaz POS está diseñada para ventas rápidas en el mostrador.

### 10.1 Acceder al POS

1. Ve a **POS** en la barra lateral.
2. Requiere una **sesión de caja abierta**. Si no hay, el sistema te indicará abrir una.

### 10.2 Realizar una Venta

1. **Buscar producto**: usa la barra de búsqueda o navega por categorías.
2. **Añadir al carrito**: haz clic en el producto.
3. **Ajustar cantidad**: en el carrito, modifica la cantidad.
4. **Seleccionar cliente**: opcional, para ventas a crédito o con datos del cliente.
5. **Cobrar**: haz clic en **Cobrar**.
6. Selecciona el **método de pago** (efectivo, tarjeta, transferencia).
7. Confirma. Se genera la factura automáticamente y se descuenta el stock.

### 10.3 Órdenes en Espera

Puedes guardar una orden incompleta y recuperarla después:

1. Haz clic en **Guardar Orden**.
2. La orden queda en espera.
3. Para recuperarla, haz clic en **Recuperar Orden** y selecciónala.

---

## 11. Equipos y Tareas

### 11.1 Equipos de Trabajo

1. Ve a **Equipos → Lista**.
2. Cada equipo tiene un **nombre**, **descripción** y **color** identificativo.
3. Los miembros de un equipo tienen roles: **Líder** o **Miembro**.

**Crear un equipo:**
1. Haz clic en **Nuevo Equipo**.
2. Asigna miembros y roles.

### 11.2 Horarios

1. Ve a **Equipos → Horarios**.
2. Configura horarios semanales por usuario y tienda.
3. Cada horario especifica día de la semana, hora de inicio y hora de fin.

### 11.3 Tareas

1. Ve a **Equipos → Tareas**.
2. Cada tarea tiene:
   - **Título** y descripción
   - **Asignado a**: un miembro del equipo
   - **Fecha límite**
   - **Estado**: Pendiente → En Progreso → Completada
   - **Prioridad**: Baja, Media, Alta

**Crear una tarea:**
1. Haz clic en **Nueva Tarea**.
2. Completa los campos y asigna al responsable.
3. Guarda.

---

## 12. Reportes

Los reportes proporcionan análisis del negocio.

### 12.1 Reporte de Ventas

- Ventas por día, semana, mes.
- Productos más vendidos.
- Métodos de pago utilizados.
- Filtro por rango de fechas y tienda.

### 12.2 Reporte de Inventario

- Valor total del inventario.
- Productos con stock bajo.
- Movimientos de stock en el período.

### 12.3 Reporte Financiero

- Resumen de ingresos y gastos.
- Facturas pendientes de pago.
- Balance general por período.

### 12.4 Log de Auditoría

- Registro automático de todos los cambios en el sistema.
- Quién hizo qué, cuándo, y qué datos cambiaron.
- Solo visible para usuarios con permisos de auditoría.

> Los reportes se pueden **exportar** a CSV para análisis externo.

---

## 13. Notificaciones

### 13.1 Panel de Notificaciones

El ícono de campana en la barra superior muestra las notificaciones en tiempo real.

- **Punto rojo**: hay notificaciones no leídas.
- Haz clic para abrir el panel lateral con la lista de notificaciones.
- Haz clic en una notificación para ver sus **detalles completos** en un diálogo.

### 13.2 Tipos de Notificación

| Tipo | Cuándo se genera |
|---|---|
| **Tasa de cambio** | Se actualiza, inserta o elimina una tasa de cambio |
| **Nuevo miembro** | Un usuario se une a la organización |
| **Stock bajo** | Un producto alcanza el stock mínimo |
| **Tarea asignada** | Se te asigna una nueva tarea |
| **Transferencia** | Stock transferido entre tiendas |
| **Invitación pendiente** | Has sido invitado a una organización |
| **Invitación aceptada** | Un usuario aceptó tu invitación |
| **Cambio de horario** | Tu horario de trabajo fue modificado |

### 13.3 Detalle de Notificación

Al abrir una notificación, verás:

- **Título** y fecha de creación.
- **Tipo** con badge de color.
- **Mensaje** descriptivo con contexto relevante.
- Si es una **tasa de cambio**: verás la tasa anterior y la nueva con fechas, horas y diferencia.
- Si es un **nuevo miembro**: verás el email del miembro, su rol y la fecha de ingreso.
- Si es una **invitación**: verás el nombre de la organización, quién te invitó, tu rol asignado, y botones para **Aceptar** o **Rechazar** directamente desde el diálogo.
- Estado **Leída / No leída**.

### 13.4 Marcar como Leída

- **Individual**: haz clic en la notificación.
- **Todas**: en el panel, haz clic en **Marcar todas como leídas**.

---

## 14. Configuración

La configuración se organiza en pestañas en la parte inferior de la pantalla, optimizada para uso en móvil y escritorio:

| Pestaña | Contenido |
|---|---|
| 👤 Perfil | Datos personales, contraseña |
| 🏢 Organización | Nombre, logo, datos fiscales |
| 👥 Miembros | Invitaciones, gestión de equipo |
| 🔑 Permisos | Roles y accesos |
| 💱 Tasas | Tasas de cambio |

### 14.1 Perfil
2. Actualiza tu **nombre completo**, **teléfono** y **foto de perfil**.
3. Cambia tu **contraseña** si es necesario.

### 14.2 Organización

Ve a la pestaña **Organización** en Configuración.
2. Aquí puedes ver y editar el nombre, logo y datos fiscales de la organización.

### 14.3 Miembros del Equipo

Ve a la pestaña **Miembros** en Configuración.
2. Verás la lista de todos los miembros con su rol y estado.

**Invitar un nuevo miembro:**
1. Haz clic en **Invitar Miembro**.
2. Introduce el **email**, selecciona el **rol** (Propietario, Administrador, Miembro).
3. Haz clic en **Enviar Invitación**.
4. El invitado recibirá un correo con el enlace para unirse.

**Gestionar miembros existentes:**
- Cambiar rol (solo Owner puede cambiar roles de otros miembros).
- Eliminar miembro de la organización.
- Ver invitaciones pendientes desde el panel de **Notificaciones** — puedes aceptar o rechazar directamente desde allí.

### 14.4 Permisos

Los permisos se gestionan por rol. Ve a la pestaña **Permisos** en Configuración.

- **Owner**: todos los permisos.
- **Admin**: gestión completa excepto cambiar roles de miembros.
- **Member**: solo lectura y operaciones básicas (POS, abrir caja).

### 14.5 Tasas de Cambio

Ve a la pestaña **Tasas** en Configuración.
2. Aquí se gestionan las tasas de cambio entre monedas (CUP, USD, EUR, MLC).
3. Las tasas tienen fecha de validez (desde/hasta).

**Integración con El Toque:**
- Si la organización tiene configurado un token de El Toque, las tasas se actualizan automáticamente desde este servicio.
- Las actualizaciones generan notificaciones con detalle de la tasa anterior y la nueva.

---

## 15. Sistema de Permisos

Tu rol determina qué puedes hacer en el sistema:

| Función | Owner | Admin | Member |
|---|---|---|---|
| Ver dashboard | ✅ | ✅ | ✅ |
| Crear/editar productos | ✅ | ✅ | ❌ |
| Ajustar stock | ✅ | ✅ | ❌ |
| Ver clientes | ✅ | ✅ | ✅ |
| Crear/editar clientes | ✅ | ✅ | ❌ |
| Crear/editar facturas | ✅ | ✅ | ❌ |
| Aprobar prefacturas | ✅ | ✅ | ❌ |
| Acceder al POS | ✅ | ✅ | ✅ |
| Abrir/cerrar caja | ✅ | ✅ | ✅ |
| Ver reportes | ✅ | ✅ | ✅ |
| Gestionar miembros | ✅ | Parcial | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ |

> Si una función no aparece en tu interfaz, es porque no tienes permiso para acceder a ella.

---

## 16. Monedas y Tasas de Cambio

### 16.1 Monedas Disponibles

| Código | Nombre | Símbolo |
|---|---|---|
| **CUP** | Peso Cubano | ₱ |
| **USD** | Dólar Estadounidense | $ |
| **EUR** | Euro | € |
| **MLC** | Moneda Libremente Convertible | MLC |
| **USDT** | Tether USD (TRC20) | ₮ |
| **BTC** | Bitcoin | ₿ |
| **TRX** | TRON | TRX |
| **BNB** | Binance Coin | BNB |

### 16.2 Cómo Funcionan las Tasas

- Cada tienda tiene una **moneda base**.
- Las tasas de cambio permiten convertir precios entre monedas.
- Las tasas tienen un **período de validez** (fecha desde / fecha hasta).
- Solo las tasas activas dentro de su período se usan para conversiones.

### 16.3 Gráfico de Tasas

En la sección de Tasas de Cambio hay un gráfico que muestra la evolución de las tasas en los **últimos 7 días**. El eje Y se ajusta automáticamente al rango de los datos para visualizar mejor las diferencias.

### 16.4 Widget del Dashboard

En el Dashboard verás una tarjeta con las tasas actuales de **EUR, USD y USDT** frente al CUP, incluyendo el porcentaje de cambio respecto a la tasa anterior.

---

## 17. Preguntas Frecuentes

### ¿Olvidé mi contraseña, cómo la recupero?

En la pantalla de login, haz clic en **¿Olvidaste tu contraseña?**. Introduce tu email y recibirás un enlace para resetearla.

### ¿Puedo pertenecer a más de una organización?

Sí. Puedes ser miembro de varias organizaciones. Usa el selector en la barra superior para cambiar entre ellas.

### ¿Por qué no veo ciertas secciones en el menú?

Tu rol no incluye permisos para esas secciones. Contacta al Owner o Admin de tu organización si necesitas acceso.

### ¿Qué pasa si cierro la caja con diferencia?

La diferencia (positiva o negativa) se registra en el cierre. El Owner/Admin puede revisar las diferencias en los reportes de caja.

### ¿Cómo exporto datos?

En las listas de clientes, productos y reportes, busca el botón **Exportar CSV**. Se descargará un archivo con los datos filtrados actualmente.

### ¿Las notificaciones son en tiempo real?

Sí. Las notificaciones llegan instantáneamente gracias a la suscripción en tiempo real de Supabase.

### ¿Puedo deshacer una venta?

Las facturas emitidas no se eliminan. Para corregir, crea una **nota de crédito** que anule parcial o totalmente la factura.

### ¿Cómo añado stock a un producto que ya existe?

Desde la ficha del producto, haz clic en **Agregar Stock**. Esto te llevará a registrar un movimiento de tipo **Apertura** o **Ajuste** según corresponda. También puedes ir a **Inventario → Movimientos → Nuevo Movimiento**.

### ¿Los precios se convierten automáticamente entre monedas?

Sí. Cada producto tiene su moneda de precio definida. Al añadir ese producto a una oferta, prefactura o factura en otra moneda, el precio se convierte usando las tasas de cambio vigentes. Puedes ver la moneda de cada producto en el footer de su tarjeta en la lista de productos.

### ¿Puedo descargar una factura como PDF?

Sí. Una vez emitida, la factura muestra un botón **Descargar PDF** que genera un archivo imprimible.

### ¿Mi invitación expiró, qué hago?

Las invitaciones expiran a los 7 días. Solicita al Owner/Admin que te envíe una nueva invitación.

### ¿El sistema funciona sin internet?

No. Gestio Web requiere conexión a internet para funcionar, ya que todos los datos se almacenan en la nube (Supabase).

---

*Manual versión 1.1 — Mayo 2026*
