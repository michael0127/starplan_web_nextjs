# Vercel Deployment Troubleshooting Guide

## Quick Fix Checklist

1. **Check Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Verify your project exists and is linked
   - Check the "Deployments" tab for active deployments

2. **Verify Project Linking**
   ```bash
   # Check if project is linked
   vercel ls
   
   # If not linked, link it
   vercel link
   ```

3. **Trigger New Deployment**
   ```bash
   # Deploy to production
   vercel --prod
   
   # Or push to your main branch (if auto-deploy is enabled)
   git push origin main
   ```

4. **Check Deployment URL**
   - Use the URL from Vercel dashboard, not a guessed URL
   - Format: `https://your-project.vercel.app` or `https://your-project-[hash].vercel.app`

## Common Causes

- **Deployment deleted**: Check if it was manually deleted in dashboard
- **Project not linked**: Run `vercel link` to reconnect
- **Wrong URL**: Always use URLs from Vercel dashboard
- **Build failed**: Check build logs in Vercel dashboard
- **Expired preview**: Preview deployments expire after inactivity

## Prevention

- Always verify deployment exists before sharing URLs
- Set up deployment notifications
- Use environment-specific URLs (production vs preview)
- Monitor deployment status in CI/CD pipelines

