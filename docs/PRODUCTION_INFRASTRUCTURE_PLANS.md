# Production infrastructure plans

## Locked current plans

| Boundary    | Plan                                              | Initial shape                             |
| ----------- | ------------------------------------------------- | ----------------------------------------- |
| Frontend    | Cloudflare static Worker / Pages-compatible build | Free static hosting                       |
| API edge    | Cloudflare Workers Paid                           | Standard usage model                      |
| API compute | Render Standard                                   | 1 CPU, 2 GB RAM, one instance             |
| Graph       | AuraDB Professional                               | 2 GB memory, 1 CPU, 4 GB included storage |

The active Render and Aura resources are in Virginia / AWS `us-east-1` geography. `master` is the
production branch. The public API hostname remains `api.current-flow.net`.

## Selected future plans, not provisioned

| Boundary                | Selected plan                                             | Activation trigger                                                       |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Private relational data | Render Postgres Basic-1gb, PostgreSQL 17, 10 GB, Virginia | First private persisted user feature                                     |
| Object artifacts        | Cloudflare R2                                             | Production raw releases, Canon XML, exports, or large compiled artifacts |
| Background compute      | Separate Render worker using the same release image       | First resumable job beyond an ordinary request                           |

Postgres external access is disabled after administrative setup; application traffic uses Render's
internal URL. R2 implements the existing `ObjectStore` boundary and never becomes an operational
knowledge database.

## Explicit exclusions

Do not add Kubernetes, Redis, a service mesh, a second graph, an in-process distributed rate
limiter, or autoscaling before measurements justify it. Do not store private user data in Neo4j or
source artifacts in Git.
