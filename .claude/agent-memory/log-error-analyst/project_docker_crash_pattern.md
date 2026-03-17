---
name: Docker crash-loop por módulo no instalado en imagen
description: Crash-loop de backend Docker cuando se añade un módulo npm sin reconstruir la imagen. Patrón: "SERVER STARTED" aparece en logs pero nunca "[CONFIG] Configuration loaded".
type: project
---

El docker-compose monta los node_modules como volumen anónimo:
```yaml
volumes:
  - ./server:/app
  - /app/node_modules  # protege node_modules del contenedor
```

Esto significa que los node_modules del contenedor son los instalados en el `RUN npm install` del Dockerfile, NO los del host Windows.

**Por qué:** Si se añade un paquete npm (ej. `google-auth-library`) y se hace `npm install` solo en el host, el contenedor NO tiene ese módulo. El `require()` lanza un error síncrono que mata el proceso antes de llegar al callback de `app.listen()`.

**Síntoma en logs:**
- server.log: "SERVER STARTED" aparece repetidamente (cada ~1 min, luego cada ~1 seg con backoff)
- server.log: NUNCA aparece "[CONFIG] Configuration loaded" después del arranque
- exceptions.log: SIN entradas para esos timestamps (crash antes de que el logger capture el error)

**Fix:** Reconstruir la imagen Docker con `docker-compose build --no-cache backend` o `docker compose up --build`.

**Cuándo aplicar:** Siempre que se modifique `package.json` del servidor (añadir/eliminar dependencias). El cambio de código fuente solo (sin cambiar dependencias) no requiere rebuild porque el bind mount de `/app` sincroniza los archivos.
