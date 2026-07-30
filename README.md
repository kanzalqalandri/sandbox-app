# sandbox-app

A stand-in for a real front-end application repo (`tenant-app`, …), and the **second
component of the same instance** as `sandbox-api`. Together they exercise the parts of
the delivery path a single component cannot:

- an instance whose components version independently
- a channel promotion that moves several components at once
- a rollback scoped to one component while the others stay put
- a health gate where one component goes unhealthy and the other does not

## What an app repo owns

- `src/` — the code
- `helm/` — **its own chart**, including its `ExternalSecret` and which secret keys it
  consumes
- `.github/workflows/ci.yml` — dev-owned, changes freely
- `.github/workflows/deploy.yml` — a thin caller. ~15 lines. Dispatches into
  `platform-workflows`; holds no state-repo credential.

## What CI publishes

Two artifacts and **one version string**:

- image → `<registry>/images/sandbox-app:<tag>`
- chart → `oci://<registry>/charts/sandbox-app:<version>`, with that image tag baked
  into the chart's `values.yaml`

One version string is the entire artifact identity, so promotion moves that string
between environments and rollback moves it back. Nothing is rebuilt in between.

## What this repo does not own

CD mechanics. `deploy.yml` chooses *what* and *where*; `platform-workflows` decides
*how*, identically for every app.
