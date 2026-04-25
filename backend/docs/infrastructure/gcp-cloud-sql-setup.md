# GCP Cloud SQL PostgreSQL Setup Guide

This guide walks you through setting up Google Cloud SQL PostgreSQL for the Graphfolio backend.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
- Billing enabled on your GCP project

## Step 1: Enable Cloud SQL API

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com
```

## Step 2: Create Cloud SQL PostgreSQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create graphfolio-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHOOSE_A_STRONG_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04

# Note: db-f1-micro is the smallest (cheapest) instance
# For production, consider db-g1-small or higher
```

**Cost Estimate:**
- db-f1-micro: ~$7-10/month
- db-g1-small: ~$25/month

## Step 3: Create Database and User

```bash
# Create the database
gcloud sql databases create graphfolio \
  --instance=graphfolio-db

# Create a user for the application
gcloud sql users create graphfolio_user \
  --instance=graphfolio-db \
  --password=CHOOSE_USER_PASSWORD

# Note: Save this password! You'll need it in .env
```

## Step 4: Configure Network Access

### Option A: Public IP with Authorized Networks (Recommended for Netcup VPS)

```bash
# Add your Netcup VPS IP to authorized networks
gcloud sql instances patch graphfolio-db \
  --authorized-networks=YOUR_NETCUP_VPS_IP

# To get your Netcup VPS public IP:
# SSH into your VPS and run: curl ifconfig.me
```

### Option B: Cloud SQL Proxy (For local development)

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Get your instance connection name
gcloud sql instances describe graphfolio-db --format='value(connectionName)'
# Output example: your-project-id:us-central1:graphfolio-db

# Run proxy (in a separate terminal)
./cloud-sql-proxy your-project-id:us-central1:graphfolio-db
```

## Step 5: Get Connection Details

```bash
# Get instance IP address
gcloud sql instances describe graphfolio-db --format='value(ipAddresses[0].ipAddress)'

# Get connection name (for Cloud SQL Proxy)
gcloud sql instances describe graphfolio-db --format='value(connectionName)'
```

## Step 6: Update Environment Variables

Add these to your `.env` file:

```bash
# Enable PostgreSQL
USE_POSTGRES=true

# Cloud SQL connection details
POSTGRES_HOST=<IP_ADDRESS_FROM_STEP_5>
POSTGRES_PORT=5432
POSTGRES_DB=graphfolio
POSTGRES_USER=graphfolio_user
POSTGRES_PASSWORD=<PASSWORD_FROM_STEP_3>

# Or use connection URL directly
# DATABASE_URL=postgresql://graphfolio_user:PASSWORD@IP_ADDRESS:5432/graphfolio
```

## Step 7: Test Connection

```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client

# Test connection
psql -h <POSTGRES_HOST> -U graphfolio_user -d graphfolio

# If successful, you should see:
# graphfolio=>
```

## Step 8: Run Database Migrations

```bash
# From your backend directory
cd Graphfolio-Backend

# Install dependencies
pip install -r requirements.txt

# Run migrations (this will create all tables)
python -m src.database.migrations.init_postgres
```

## Docker Configuration for Cloud SQL

When deploying with Docker on Netcup VPS, update your `.env` file:

```bash
# Production environment
ENVIRONMENT=production
USE_POSTGRES=true
DATABASE_URL=postgresql://graphfolio_user:PASSWORD@<CLOUD_SQL_IP>:5432/graphfolio
```

## Security Best Practices

1. **Never commit credentials to git**
   - Use `.env` file (already in .gitignore)
   - Or use GCP Secret Manager

2. **Use SSL connections** (optional but recommended):
   ```bash
   # Download SSL certificates
   gcloud sql ssl-certs create client-cert client-key.pem \
     --instance=graphfolio-db
   
   gcloud sql ssl-certs describe client-cert \
     --instance=graphfolio-db \
     --format='value(cert)' > client-cert.pem
   
   gcloud sql instances describe graphfolio-db \
     --format='value(serverCaCert.cert)' > server-ca.pem
   ```

3. **Restrict authorized networks** to only your VPS IP

4. **Enable automatic backups** (already done in Step 2)

## Monitoring and Maintenance

```bash
# View instance status
gcloud sql instances describe graphfolio-db

# View recent operations
gcloud sql operations list --instance=graphfolio-db

# View database size
psql -h <POSTGRES_HOST> -U graphfolio_user -d graphfolio -c "SELECT pg_size_pretty(pg_database_size('graphfolio'));"

# Create manual backup
gcloud sql backups create --instance=graphfolio-db
```

## Troubleshooting

### Connection Timeout
- Check if your VPS IP is in authorized networks
- Verify firewall rules on VPS allow outbound connections to port 5432

### Authentication Failed
- Double-check username and password
- Ensure user has permissions: `GRANT ALL PRIVILEGES ON DATABASE graphfolio TO graphfolio_user;`

### Database Not Found
- Verify database was created: `gcloud sql databases list --instance=graphfolio-db`

## Cost Optimization

- **Auto-scaling storage**: Enabled by default, only pay for what you use
- **Backup retention**: Default 7 days (adjust if needed)
- **Instance class**: Start with db-f1-micro, upgrade if needed
- **Delete unused instances**: `gcloud sql instances delete graphfolio-db`

## Migration from SQLite to PostgreSQL

See `docs/SQLITE_TO_POSTGRES_MIGRATION.md` for detailed migration steps.

---

**Next Steps:** After completing this setup, run the database migration script to create all tables.
