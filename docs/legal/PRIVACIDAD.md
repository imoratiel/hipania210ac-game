# Política de Privacidad — Hispania 210aC

**Última actualización:** 17 de marzo de 2026
**Versión:** 1.0

---

## 1. Responsable del Tratamiento

En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos de que el responsable del tratamiento de sus datos es:

| | |
|---|---|
| **Titular** | [NOMBRE_TITULAR] |
| **NIF** | [NIF_TITULAR] |
| **Domicilio** | [DOMICILIO_TITULAR] |
| **Correo electrónico** | [EMAIL_DE_CONTACTO] |

---

## 2. Datos Personales que Tratamos

### 2.1 Datos recogidos mediante Google OAuth (registro y acceso)

Al autenticarse con su cuenta de Google, obtenemos de Google los siguientes datos:

| Dato | Origen | Finalidad |
|------|--------|-----------|
| Nombre completo | Google (campo `name`) | Identificación inicial en el juego |
| Nombre de pila | Google (campo `given_name`) | Almacenado para uso interno |
| Apellido | Google (campo `family_name`) | Almacenado para uso interno |
| Dirección de correo electrónico | Google (campo `email`) | Identificación de la cuenta, prevención de cuentas duplicadas |
| Identificador único de Google | Google (campo `sub`) | Vincular la cuenta de Google con su perfil de juego |

### 2.2 Datos introducidos por el usuario durante la inicialización

| Dato | Descripción |
|------|-------------|
| **Nombre de linaje** | Nombre familiar elegido libremente (visible en el juego como "Casa X" o "Gens X") |
| **Género** | Masculino o Femenino (determina el nombre generado del personaje) |
| **Cultura** | Selección entre culturas disponibles (Romano, Cartaginés, Íbero, Celta) |

### 2.3 Datos generados automáticamente durante el juego

- Nombre de usuario técnico (generado a partir del ID de Google)
- Color de jugador (asignado aleatoriamente)
- Estado del juego: asentamientos, ejércitos, recursos, edificios, rangos nobiliarios
- Mensajes intercambiados con otros jugadores dentro del juego
- Notificaciones de sistema

### 2.4 Datos técnicos y de actividad

- **Registros de acceso (logs):** Fecha/hora de inicio y cierre de sesión, identificador de usuario. Se almacenan en ficheros de log del servidor con finalidad de seguridad y detección de fraude.
- **Cookie de sesión:** Una cookie técnica `access_token` (JWT) que identifica su sesión activa. Ver apartado 7.

---

## 3. Finalidad y Base Jurídica del Tratamiento

| Finalidad | Base jurídica (RGPD) |
|-----------|---------------------|
| Gestionar su registro y cuenta de usuario | Art. 6.1.b) — Ejecución de un contrato (Términos y Condiciones) |
| Permitir el acceso al juego y sus funcionalidades | Art. 6.1.b) — Ejecución de un contrato |
| Mostrar su nombre de linaje a otros jugadores dentro del juego | Art. 6.1.b) — Ejecución de un contrato |
| Enviar mensajes dentro del juego a otros jugadores | Art. 6.1.b) — Ejecución de un contrato |
| Mantener registros de actividad para seguridad y detección de abusos | Art. 6.1.f) — Interés legítimo del responsable |
| Moderar contenido inapropiado (nombres, mensajes) conforme a la DSA | Art. 6.1.c) — Obligación legal |

**No se trata ningún dato con finalidad de marketing, elaboración de perfiles comerciales ni cesión a terceros con fines publicitarios.**

---

## 4. Plazo de Conservación de los Datos

| Tipo de dato | Plazo de conservación |
|--------------|----------------------|
| Datos de la cuenta de juego | Mientras la cuenta esté activa. Tras la eliminación, 12 meses adicionales para atender reclamaciones legales. |
| Mensajes entre jugadores | Mientras la cuenta esté activa. Se eliminan con la cuenta. |
| Registros de acceso (logs) | 6 meses desde su generación |
| Cookie de sesión (`access_token`) | 24 horas o hasta que cierre sesión |

---

## 5. Destinatarios de los Datos

Sus datos **no se ceden ni se venden a terceros** con fines comerciales.

### 5.1 Encargados del tratamiento

Para prestar el servicio, recurrimos a los siguientes encargados de tratamiento que actúan bajo nuestras instrucciones:

| Proveedor | Servicio | País | Garantías |
|-----------|----------|------|-----------|
| **Google LLC** | Autenticación OAuth 2.0 | EE.UU. | Decisión de adecuación (Privacy Shield sucesor) / Cláusulas Contractuales Tipo (SCCs) |

> **Nota sobre Google OAuth:** Al autenticarse con Google, usted acepta adicionalmente las [Condiciones de Servicio de Google](https://policies.google.com/terms) y su [Política de Privacidad](https://policies.google.com/privacy). La información que Google comparte con nosotros se limita a los campos indicados en el apartado 2.1.

### 5.2 Obligación legal

Podríamos comunicar datos a las Fuerzas y Cuerpos de Seguridad del Estado o a la Agencia Española de Protección de Datos (AEPD) cuando así lo exija la normativa vigente.

---

## 6. Transferencias Internacionales de Datos

Los datos son tratados mediante Google OAuth, cuyos servidores se encuentran en Estados Unidos. Esta transferencia se realiza bajo las garantías adecuadas previstas en el Capítulo V del RGPD (Cláusulas Contractuales Tipo aprobadas por la Comisión Europea).

---

## 7. Política de Cookies

Hispania 210aC utiliza exclusivamente **una cookie estrictamente necesaria**:

| Nombre | Tipo | Duración | Finalidad |
|--------|------|----------|-----------|
| `access_token` | Cookie técnica/de sesión (HttpOnly, SameSite=Lax) | 24 horas | Mantener la sesión de usuario autenticada mediante JWT. Sin esta cookie el servicio no puede prestarse. |

**No utilizamos cookies analíticas, publicitarias ni de seguimiento.**

Las cookies estrictamente necesarias no requieren su consentimiento previo conforme a la Directiva 2002/58/CE (Directiva ePrivacy) y su transposición en España (LSSI-CE). Se le informa de su uso en cumplimiento del deber de transparencia.

---

## 8. Menores de Edad

**Hispania 210aC tiene una edad mínima de uso de 14 años**, conforme al artículo 7 del RGPD y el artículo 7 de la LOPDGDD.

Si tiene conocimiento de que un menor de 14 años ha creado una cuenta, le rogamos que nos lo comunique a [EMAIL_DE_CONTACTO] para proceder a la eliminación inmediata de sus datos.

---

## 9. Derechos del Usuario

De conformidad con el RGPD (arts. 15–22), usted tiene derecho a:

| Derecho | Descripción |
|---------|-------------|
| **Acceso** | Conocer qué datos personales suyos tratamos |
| **Rectificación** | Corregir datos inexactos o incompletos |
| **Supresión ("derecho al olvido")** | Solicitar la eliminación de sus datos |
| **Oposición** | Oponerse a determinados tratamientos |
| **Limitación** | Solicitar la restricción del tratamiento en ciertos casos |
| **Portabilidad** | Recibir sus datos en formato estructurado y legible por máquina |
| **No ser objeto de decisiones automatizadas** | En Hispania 210aC no se toman decisiones con efectos jurídicos basadas exclusivamente en tratamiento automatizado |

**Cómo ejercer sus derechos:** Enviando un correo electrónico a [EMAIL_DE_CONTACTO] indicando el derecho que desea ejercer, su nombre completo y una copia de su documento de identidad.

**Plazo de respuesta:** 1 mes desde la recepción de la solicitud (prorrogable 2 meses más en casos complejos).

**Reclamación ante la AEPD:** Si considera que el tratamiento de sus datos vulnera la normativa, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD): [www.aepd.es](https://www.aepd.es) — C/ Jorge Juan, 6, 28001 Madrid.

---

## 10. Seguridad de los Datos

Aplicamos las siguientes medidas técnicas y organizativas para proteger sus datos:

- Las comunicaciones entre su navegador y el servidor se realizan mediante **HTTPS** (cifrado TLS).
- La cookie de sesión tiene los atributos `HttpOnly` (no accesible por JavaScript) y `SameSite=Lax` (protección contra CSRF).
- Los mensajes entre jugadores se almacenan en base de datos con acceso restringido al servidor.
- Las contraseñas de credenciales internas se ocultan en los registros de actividad.
- El acceso a la base de datos está restringido al servidor de la aplicación.

---

## 11. Actualizaciones de esta Política

Esta Política de Privacidad puede actualizarse para adaptarse a cambios legales o funcionales de la plataforma. La fecha de última actualización figura siempre al inicio del documento. Los cambios sustanciales se comunicarán mediante aviso visible en el juego.
