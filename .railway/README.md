# Railway Deployment Configuration

This directory contains configuration for deploying the application to Railway.

## FFmpeg Installation

The `commands/install.sh` script automatically installs FFmpeg during the deployment process. This script:

1. Runs during the build phase in Railway
2. Updates package repositories
3. Installs FFmpeg

## Verification

After deployment, you can verify FFmpeg is working by visiting:
`/api/test-ffmpeg`

This endpoint will return information about the FFmpeg installation if it's working correctly.

## Troubleshooting

If FFmpeg isn't available after deployment:

1. Check the deployment logs in Railway dashboard
2. Ensure the `.railway/commands/install.sh` file is executable (might need to run `chmod +x .railway/commands/install.sh` before committing)
3. Try redeploying the application 