# 🔐 Environment Variables Management Guide

## 📋 Overview

This document explains how to securely manage environment variables for the Subscription Manager application.

---

## ✅ Current Security Status

- ✅ All `.env` files are in `.gitignore`
- ✅ `.env.example` templates provided
- ✅ No secrets committed to repository
- ✅ Secure for public or private repositories

---

## 🗂️ File Structure

```
/app/
├── .env.example              # Root environment template
├── .gitignore                # .env files excluded
├── backend/
│   ├── .env                  # Backend secrets (NEVER commit)
│   ├── .env.example          # Backend template (commit this)
│   └── .gitignore            # Backend-specific ignores
└── frontend/
    ├── .env                  # Frontend config (NEVER commit)
    ├── .env.example          # Frontend template (commit this)
    └── .gitignore            # Frontend-specific ignores
```

---

## 🚀 Setup Instructions

### For New Developers:

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd app
   ```

2. **Create backend .env**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Then edit `backend/.env` with real values:
   ```env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="subscription_manager"
   SECRET_KEY="your-super-secret-key-minimum-32-characters"
   ```

3. **Create frontend .env**
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Then edit `frontend/.env` with your values:
   ```env
   EXPO_TUNNEL_SUBDOMAIN="your-app-name"
   EXPO_PACKAGER_HOSTNAME="https://your-app-name.preview.emergentagent.com"
   EXPO_PUBLIC_BACKEND_URL="https://your-app-name.preview.emergentagent.com"
   EXPO_USE_FAST_RESOLVER="1"
   METRO_CACHE_ROOT="/app/frontend/.metro-cache"
   ```

4. **Verify .env files are ignored**
   ```bash
   git status
   # Should NOT show .env files
   ```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use `.env` files for secrets
- ✅ Add all `.env` files to `.gitignore`
- ✅ Commit `.env.example` templates
- ✅ Share secrets via secure channels (see below)
- ✅ Use strong, random `SECRET_KEY` (32+ characters)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/production

### ❌ DON'T:
- ❌ Commit `.env` files to git
- ❌ Share secrets via email or chat
- ❌ Use production secrets in development
- ❌ Hardcode secrets in code
- ❌ Share secrets in screenshots
- ❌ Reuse `SECRET_KEY` across projects

---

## 📤 How to Share Secrets Securely

### Option 1: Password Manager (RECOMMENDED)
- **1Password:** Shared vaults
- **LastPass:** Shared folders
- **Bitwarden:** Organizations
- **Keeper:** Shared folders

**Steps:**
1. Store `.env` file in password manager
2. Share vault/folder with team
3. Team members download and place in correct location

### Option 2: Encrypted Messaging
- **Signal:** End-to-end encrypted
- **Wire:** Business secure messaging
- **Keybase:** Encrypted chat & files

**Steps:**
1. Send `.env` contents via encrypted chat
2. Recipient copies to local `.env` file
3. Delete message after received

### Option 3: Secret Management Tools (ENTERPRISE)
- **HashiCorp Vault**
- **AWS Secrets Manager**
- **Google Secret Manager**
- **Azure Key Vault**

### Option 4: Encrypted File Transfer
```bash
# Encrypt .env file
gpg -c backend/.env  # Creates backend/.env.gpg

# Share .env.gpg file (safe to send via email)

# Recipient decrypts
gpg backend/.env.gpg  # Asks for password
```

---

## 🌐 Deployment Strategies

### Development (Local)
```bash
# Use .env files
cp backend/.env.example backend/.env
# Edit with local MongoDB, test keys
```

### Staging/Production

#### Option A: Platform Environment Variables
**Vercel:**
```bash
vercel env add SECRET_KEY production
vercel env add MONGO_URL production
```

**Heroku:**
```bash
heroku config:set SECRET_KEY="your-key"
heroku config:set MONGO_URL="mongodb://..."
```

**AWS Elastic Beanstalk:**
```bash
eb setenv SECRET_KEY="your-key" MONGO_URL="mongodb://..."
```

#### Option B: Docker Secrets
```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env.production  # Not in git
```

#### Option C: Kubernetes Secrets
```bash
kubectl create secret generic app-secrets \
  --from-literal=SECRET_KEY="your-key" \
  --from-literal=MONGO_URL="mongodb://..."
```

#### Option D: CI/CD Platform
**GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
env:
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
  MONGO_URL: ${{ secrets.MONGO_URL }}
```

**GitLab CI:**
```yaml
# .gitlab-ci.yml
deploy:
  variables:
    SECRET_KEY: $CI_SECRET_KEY
```

---

## 🚨 Emergency: .env Was Committed

### If you accidentally committed .env files:

1. **Remove from git immediately**
   ```bash
   # Remove from current commit
   git rm --cached backend/.env frontend/.env
   git commit -m "Remove .env files"
   git push
   ```

2. **Remove from git history** (if already pushed)
   ```bash
   # Using BFG Repo Cleaner (recommended)
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **Rotate ALL secrets immediately**
   - Generate new `SECRET_KEY`
   - Change MongoDB password
   - Revoke any API keys
   - Update all environments with new values

4. **Notify your team**
   - Alert all developers
   - Update documentation
   - Review access logs

---

## 🔑 Generating Secure SECRET_KEY

### Method 1: Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Method 2: OpenSSL
```bash
openssl rand -base64 32
```

### Method 3: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Method 4: Online (use with caution)
- https://randomkeygen.com/
- Use "Fort Knox Passwords" section
- Minimum 32 characters

---

## 📝 Environment Variable Reference

### Backend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URL` | Yes | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Yes | Database name | `subscription_manager` |
| `SECRET_KEY` | Yes | JWT signing key (32+ chars) | `your-secret-key-here` |
| `CORS_ORIGINS` | No | Allowed CORS origins | `*` or `https://app.com` |

### Frontend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EXPO_TUNNEL_SUBDOMAIN` | Yes | Expo tunnel subdomain | `my-app` |
| `EXPO_PACKAGER_HOSTNAME` | Yes | Packager hostname URL | `https://my-app.preview...` |
| `EXPO_PUBLIC_BACKEND_URL` | Yes | Backend API URL | `https://my-app.preview...` |
| `EXPO_USE_FAST_RESOLVER` | Yes | Fast resolver flag | `1` |
| `METRO_CACHE_ROOT` | No | Metro cache directory | `/app/frontend/.metro-cache` |

---

## ✅ Verification Checklist

Before pushing to repository:

- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` files are provided
- [ ] No secrets in code or comments
- [ ] `git status` doesn't show `.env` files
- [ ] Strong `SECRET_KEY` generated (32+ chars)
- [ ] Different secrets for dev/prod
- [ ] Team members know how to get secrets
- [ ] Deployment platform configured with secrets

---

## 📞 Support

If you accidentally committed secrets or have questions:

1. **Stop immediately** - Don't push more commits
2. **Follow emergency procedures** (see above)
3. **Rotate all secrets**
4. **Contact your team lead**

---

## 📚 Additional Resources

- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub - Security Best Practices](https://docs.github.com/en/code-security)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)

---

**Last Updated:** January 31, 2025  
**Version:** 1.0
