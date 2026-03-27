# Production Promotion Contract

This repository publishes frontend release images on tag pushes and dispatches deployment metadata to `continuum-frontend-prod`.

## Trigger
- Git tag push matching `v*`.

## Dispatch target
- Repository: `continuum-frontend-prod`
- Event type: `frontend_release_ready`

## Payload
```json
{
  "service": "frontend",
  "tag": "v1.2.3",
  "image": "myacr.azurecr.io/continuum-frontend",
  "digest": "sha256:...",
  "source_repo": "owner/continuum-MVP",
  "source_sha": "<commit-sha>",
  "source_ref": "refs/tags/v1.2.3"
}
```

## Required secrets/variables
- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- `ACR_NAME`
- `PROD_DISPATCH_TOKEN` (PAT with `repo` scope)
- Optional: `PROD_REPO_OWNER` (defaults to current owner)
