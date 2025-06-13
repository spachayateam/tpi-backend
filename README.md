## Docker

Crear imagen

```bash
docker build \
  -t registry.gitlab.com/tpi_spa/tpi-backend:v0.0.1 \
  --build-arg A_NPM_TOKEN=${NPM_TOKEN} \
  --no-cache .
```

Run image

```bash
docker container run \
  --name tpi-backend \
  -dp 3000:3000 \
  registry.gitlab.com/tpi_spa/tpi-backend:v0.0.1
```

Publicar imagen

```bash
docker --config ~/.docker/jruizh.dev image push registry.gitlab.com/tpi_spa/tpi-backend:v0.0.1
```

Descargar imagen

```bash
docker --config ~/.docker/jruizh.dev image pull registry.gitlab.com/tpi_spa/tpi-backend:v0.0.1
```