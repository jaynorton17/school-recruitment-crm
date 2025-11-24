# Deployment Environment Variable Analysis

## Summary of Findings
- The GitHub Actions workflow `.github/workflows/google-cloudrun-docker.yml` builds and deploys the image without providing a `VITE_GEMINI_API_KEY` build argument or environment variable. The Dockerfile expects `ARG VITE_GEMINI_API_KEY` and copies it into `ENV`, so omitting the build argument produces an image where the variable is empty, effectively removing the key on every deployment.
- The workflow does not pass any environment variables related to the Gemini API key during the build or deploy steps. No other scripts or configuration files in the repository reset `VITE_GEMINI_API_KEY` during deployment.

## Evidence
- Dockerfile defines `ARG VITE_GEMINI_API_KEY` and sets `ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY`, meaning the key must be supplied at build time. Without a build argument, the resulting image does not include the key.
- The deployment workflow builds the container with `docker build -t "$IMAGE" .` and deploys via `google-github-actions/deploy-cloudrun@v2` without any build arguments or environment variables for `VITE_GEMINI_API_KEY`.

## Recommendations
- Pass the API key as a build argument from a GitHub secret during the Docker build step, for example:
  ```yaml
  - name: Build and Push Container
    env:
      VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
    run: |
      IMAGE="${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.SERVICE }}/${{ env.SERVICE }}:${{ github.sha }}"
      docker build --build-arg VITE_GEMINI_API_KEY="$VITE_GEMINI_API_KEY" -t "$IMAGE" .
      docker push "$IMAGE"
  ```
- Alternatively, bake the key into Cloud Run runtime environment variables if you migrate to a server-side lookup, but for the current Vite build the key must be present during `docker build`.
- Add a CI check (e.g., `npm run check:gemini`) that uses the secret before deploy to ensure the key is available and valid.
