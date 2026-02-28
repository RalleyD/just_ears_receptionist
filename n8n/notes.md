# N8N Workflows

## Twilio weekly call report

| Node | What it does |
|------|--------------|
| Weekly Sched | Fires every Monday 8am |
| Fetch Twilio Calls | Hits Twilio's REST API for calls from the past 7 days (Up to 1k) |
| Transform call data | Maps raw Twilio respoinse to 16 CSV columns |
| Convert to CSV | with a date-stamped filename | 
| Send Email | send CSV as attachment via SMTP |

## Setup in n8n

1. Import — Go to Workflows → Import from File → select the JSON
2. Create credentials:
   
    HTTP Basic Auth — Username: your Twilio Account SID, Password: your Auth Token
    
    SMTP — Your email provider's SMTP settings (or swap the email node for Gmail/SendGrid if preferred)
    
3. Set the environment variable - TWILIO_ACCOUNT_SID in n8n settings -> environment variables.
4. update the recipient - in the "Send Email" node.
5. Activate the workflow
   