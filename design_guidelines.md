# Design Guidelines - Just Ears Voice Receptionist Backend Service

## Project Classification: Backend API Service

This is a **headless backend service** with no visual user interface. The application consists of:
- Express.js API server
- WebSocket handlers for Twilio media streams
- OpenAI Realtime API integration
- N8N webhook orchestration

**No visual design is required** for the core functionality.

---

## Optional: Future Admin Dashboard (If Needed)

Should you decide to add a monitoring/admin interface, consider these guidelines:

### Design Approach: **Function-Differentiated Dashboard**
Reference: Linear, Vercel Dashboard, Stripe Dashboard - clean, data-focused interfaces for operational monitoring

### Core Design Elements

**Color Palette:**
- Background: 220 15% 6% (dark charcoal)
- Surface: 220 15% 10% (elevated surfaces)
- Primary: 220 90% 56% (professional blue)
- Success: 142 76% 45% (confirmation green)
- Warning: 38 92% 50% (attention amber)
- Error: 0 84% 60% (alert red)
- Text: 220 15% 95% (high contrast)

**Typography:**
- System fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Headers: font-semibold
- Body: font-normal, text-sm to text-base
- Monospace for logs: font-mono

**Layout System:**
- Spacing units: 2, 4, 8, 12, 16 (p-4, m-8, gap-4)
- Max content width: max-w-7xl
- Sidebar: w-64 fixed
- Grid layouts: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**Component Library:**
- **Navigation:** Fixed sidebar with call status, active sessions, logs
- **Data Displays:** Real-time metrics cards (active calls, success rate, avg duration), call history table, live transcript viewer
- **Forms:** Minimal - configuration inputs only
- **Overlays:** Toast notifications for call events, modal for detailed call logs
- **Status Indicators:** Color-coded badges (active/idle/error), live audio waveform visualization

**Key Screens (If Built):**
1. **Live Dashboard:** Real-time call monitoring, active session count, OpenAI connection status
2. **Call History:** Searchable table with timestamps, duration, outcomes, patient names (anonymized)
3. **System Logs:** Scrollable console output with filtering (errors, info, debug)
4. **Configuration:** Environment variable editor, webhook URL management

**No animations** - focus on real-time data updates and system reliability.

---

**Recommendation:** Keep the service headless unless monitoring requirements emerge. The backend architecture is complete and production-ready as-is.