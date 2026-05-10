1. Create the Render PostgreSQL database

Render dashboard → New → PostgreSQL
Choose the $6/month Basic plan
Give it a name (e.g. n8n-db)
Note the region — pick the same or closest to your Northflank N8N service

2. Get connection details from Render
Once created, Render shows you two connection strings:

Internal URL — only works between Render services (not useful here since N8N is on Northflank)
External URL — use this one
The external URL format is:


postgresql://<user>:<password>@<host>/<database>
Extract the individual components — you'll need host, port, user, password, and database name.

3. Update N8N service env vars on Northflank

Replace the current Northflank addon secret group values with these, set directly in the N8N service environment tab:


DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=<render external host>
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=<render database name>
DB_POSTGRESDB_USER=<render user>
DB_POSTGRESDB_PASSWORD=<render password>
DB_POSTGRESDB_SSL_ENABLED=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
Two things worth noting vs. your Northflank setup:

Render PostgreSQL is direct (no PgBouncer), so the statement_timeout error you hit earlier won't occur
Render requires SSL on external connections, hence SSL_ENABLED=true
4. Remove the Northflank addon secret group link

Unlink/remove the Northflank PostgreSQL secret group from the N8N service so the old DB_POSTGRESDB_* vars don't override your new ones.

5. Restart the N8N service and verify

Watch the logs for:


DB Type: PostgreSQL
Database connection recovered
Finished building workflow dependency index.
6. Re-import workflows and credentials

The Render database starts empty — same situation as before. Re-import from n8n/*.json and re-enter credentials. From this point they persist.

7. Delete the Northflank PostgreSQL addon

Once N8N is confirmed working on Render PostgreSQL, remove the Northflank addon to stop incurring cost.