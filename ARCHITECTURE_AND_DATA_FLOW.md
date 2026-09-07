# System Architecture & Data Flow Documentation

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React.js)                             │
│                    Port: 3000                                    │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  • Dashboard (Latest 5 Emails + Stats)                          │
│  • Inbox (All Emails with Filters)                              │
│  • Categories (Email Categories)                                │
│  • Priority (Priority-based View)                               │
│  • Tasks (Task Management)                                      │
│  • Analytics (Statistics & Charts)                              │
│  • Reports (Email Reports)                                      │
│  • Settings (System Settings)                                   │
│  • AI Intelligence (AI Features)                                │
│  • Compose (New Email Drafts)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    Socket.IO (Real-Time)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js/Express)                     │
│                     Port: 5000                                   │
├─────────────────────────────────────────────────────────────────┤
│  Gateway: WebSocket (Socket.IO)                                 │
│  Routes: /api/emails, /api/tasks, /api/analytics                │
│  Services:                                                       │
│  • emailSyncService (Outlook Sync)                              │
│  • analyticsService (Stats Calculation)                         │
│  • aiReplyService (AI Suggestions)                              │
│  • authService (Authentication)                                 │
│  Scheduler: Cron (Every 2 minutes sync)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                  Microsoft Graph API
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│              MICROSOFT OUTLOOK (Cloud)                           │
│                                                                  │
│  • User Mailbox                                                  │
│  • Calendar Events                                               │
│  • Tasks                                                         │
│  • Contacts                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│            LOCAL DATABASE (MongoDB)                              │
│                  Local Storage                                   │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                    │
│  • Email (All synced emails)                                    │
│  • Task (All tasks)                                             │
│  • Category (Email categories)                                  │
│  • User (User data)                                             │
│  • Settings (System settings)                                   │
│  • AuditLog (Event logging)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA SYNCHRONIZATION FLOW

### 1. Initial Sync (On Server Start)
```
Server Starts
    ↓
Load Scheduler
    ↓
Call syncEmailsWithOutlook()
    ↓
Get Microsoft Graph Access Token
    ↓
Fetch Emails from Graph API
    ↓
Compare with MongoDB
    ↓
Insert New Emails
Update Changed Emails
Delete Removed Emails
    ↓
Emit "sync-completed" via Socket.IO
    ↓
Clients receive update
    ↓
UI updates with new data
```

### 2. Continuous Sync (Every 2 Minutes)
```
Cron Scheduler (*/2 * * * *)
    ↓
Call syncEmailsWithOutlook()
    ↓
[Repeat initial sync flow]
    ↓
All connected clients notified
    ↓
Dashboard/Inbox auto-update
```

### 3. Real-Time Updates (User Actions)
```
User Action (Mark as Read)
    ↓
Client sends PATCH request
    ↓
Server updates MongoDB
    ↓
Server emits "email-status-changed"
    ↓
All connected clients receive event
    ↓
UIs update instantly
    ↓
Sync back to Outlook (async)
```

### 4. Real-Time Email Arrival
```
New Email in Outlook
    ↓
Scheduler fetches (every 2 min)
    ↓
New email found in Graph API
    ↓
Server inserts into MongoDB
    ↓
Server emits "new-email" event
    ↓
All clients notified
    ↓
Dashboard & Inbox update
    ↓
Browser notification (optional)
```

---

## 📡 SOCKET.IO EVENT FLOW

### Events Emitted by Server → Client

```
SYNC EVENTS:
  sync-started          → Sync operation begun
  sync-completed        → Sync finished with results
  sync-error            → Sync failed
  sync-status           → Current sync status

EMAIL EVENTS:
  new-email             → New email arrived
  email-status-changed  → Email status changed
  email-updated         → Email content updated
  email-deleted         → Email removed

TASK EVENTS:
  new-task              → New task created
  task-updated          → Task modified
  task-completed        → Task marked complete
  task-deleted          → Task removed

DASHBOARD EVENTS:
  dashboard-updated     → Dashboard needs refresh
  stats-updated         → Stats recalculated
  high-priority-alert   → Important email received

NOTIFICATION EVENTS:
  notification          → General notification
  task-reminder         → Task due soon
  high-priority-alert   → Urgent email

AI EVENTS:
  ai-reply-generated    → AI suggestions ready
  ai-analysis-complete  → Email analysis done

SYSTEM EVENTS:
  connection-status     → Connected/Disconnected
  system-error          → Server error occurred
```

### Events Received by Server ← Client

```
REQUEST EVENTS:
  request-sync          → Client requests immediate sync
  request-email-refresh → Client requests email list refresh
  request-stats-update  → Client requests stats recalculation

ACTION EVENTS:
  user-action           → User performed action
  email-replied         → User replied to email
  task-completed        → User marked task complete
```

---

## 📊 DATA MODEL & SCHEMAS

### Email Collection
```javascript
{
  _id: ObjectId,
  outlookId: "string",           // Microsoft Graph ID
  subject: "string",
  bodyPreview: "string",
  body: "string",
  
  sender: {
    name: "string",
    email: "string"
  },
  
  recipients: [
    {
      name: "string",
      email: "string"
    }
  ],
  
  receivedDateTime: Date,
  sentDateTime: Date,
  
  priority: "High" | "Medium" | "Low",
  isRead: boolean,
  hasAttachments: boolean,
  
  status: "Completed" | "Pending" | "Not Completed",
  
  replyThreads: [
    {
      replyFrom: "string",
      replyText: "string",
      replyTime: Date
    }
  ],
  
  categories: ["string"],
  
  createdAt: Date,
  updatedAt: Date,
  lastModifiedAt: Date
}
```

### Task Collection
```javascript
{
  _id: ObjectId,
  title: "string",
  description: "string",
  
  status: "Not Started" | "In Progress" | "Completed",
  priority: "High" | "Medium" | "Low",
  
  assignedTo: "string",  // User ID or name
  
  dueDate: Date,
  createdDate: Date,
  completedDate: Date,
  
  linkedEmailId: ObjectId,  // Reference to email if from email
  
  tags: ["string"],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Analytics Cache Collection
```javascript
{
  _id: ObjectId,
  type: "daily" | "weekly" | "monthly",
  period: "2026-07-25",
  
  stats: {
    totalEmails: number,
    completedEmails: number,
    pendingEmails: number,
    
    highPriority: number,
    mediumPriority: number,
    lowPriority: number,
    
    averageResponseTime: number,
    
    emailsPerTeamMember: {
      "employee_name": {
        total: number,
        completed: number,
        pending: number
      }
    }
  },
  
  createdAt: Date
}
```

---

## 🔐 AUTHENTICATION FLOW

```
User Visits App
    ↓
Check for Token in SessionStorage
    ↓
Token Valid?
    ├─ YES → Load Dashboard
    └─ NO → Redirect to Login
            ↓
      User Clicks "Login with Microsoft"
            ↓
      OAuth 2.0 Authorization
      (Microsoft Entra ID)
            ↓
      User Approves Permissions
            ↓
      Return Authorization Code
            ↓
      Exchange Code for Access Token
            ↓
      Store Token in SessionStorage
            ↓
      Redirect to Dashboard
```

### Token Types
```
Access Token (JWT):
  • Short-lived (15-60 minutes)
  • Sent in API request headers
  • Refreshed automatically

Refresh Token:
  • Long-lived (24-90 days)
  • Used to get new access token
  • Stored securely

ID Token:
  • Contains user info
  • Verified on server
```

---

## 🚀 PERFORMANCE FLOW

### Initial Page Load (Dashboard)
```
1. Client loads (1-2 sec)
   ├─ Parse JavaScript (~500ms)
   ├─ Load CSS (~300ms)
   ├─ Initialize React (~200ms)
   └─ Connect to Socket.IO (~500ms)

2. Fetch Dashboard Data (1-2 sec)
   ├─ Call /api/dashboard (~500ms)
   ├─ Wait for response (~500ms)
   ├─ Render components (~300ms)
   └─ Display to user (~300ms)

Total: ~2-4 seconds for full dashboard
```

### Sync Operation (Every 2 minutes)
```
1. Fetch from Outlook (2-3 sec)
   ├─ Get access token (~300ms)
   ├─ Call Graph API (~1000ms)
   ├─ Process pagination (~500ms)
   └─ Parse response (~500ms)

2. Database Operations (~1 sec)
   ├─ Compare with existing (~300ms)
   ├─ Insert new records (~400ms)
   └─ Update existing (~300ms)

3. Broadcast Update (~500ms)
   ├─ Emit to all clients (~200ms)
   ├─ Client receive (~300ms)
   └─ UI updates (~200ms)

Total: ~3-5 seconds per sync
```

### Dashboard Auto-Update (Every 30 seconds)
```
1. Timer fires (every 30 sec)
   ↓
2. Fetch fresh stats (~1 sec)
   ├─ Query database
   ├─ Calculate metrics
   └─ Format data
   ↓
3. Update UI (~500ms)
   ├─ Re-render components
   ├─ Animate changes
   └─ Display timestamp
   ↓
Total: ~1.5 seconds
```

---

## 🛠️ ERROR HANDLING FLOW

### Network Error
```
Request Fails (No Internet)
    ↓
Catch Error in .catch()
    ↓
Show Error Toast
"⚠️ Network error. Please check connection"
    ↓
User can retry
    ↓
Automatic retry after 30 seconds
```

### Authentication Error
```
Token Expires
    ↓
Request Returns 401
    ↓
Try to Refresh Token
    ↓
Refresh Succeeds?
├─ YES → Retry Original Request
└─ NO  → Redirect to Login
```

### Sync Error
```
Outlook API Fails
    ↓
Log Error to Console
    ↓
Emit "sync-error" event
    ↓
Show Warning to User
"⚠️ Failed to sync emails"
    ↓
Keep using cached data
    ↓
Retry sync in 5 minutes
```

---

## 📈 SCALABILITY CONSIDERATIONS

### Current System (Single Server)
```
Max Concurrent Users: ~100
Max Emails: ~10,000
Sync Frequency: Every 2 minutes
Response Time: <2 seconds
```

### Future Scaling (Multiple Servers)
```
Load Balancer
    ↓
Server 1 (Front-end server)
Server 2 (Sync server)
Server 3 (API server)
    ↓
Shared MongoDB (Replica Set)
    ↓
Distributed Cache (Redis)
```

### Performance Optimization Points
```
1. Database Indexing
   • Email: outlookId (unique)
   • Email: receivedDateTime (for sorting)
   • Email: status (for filtering)

2. Query Optimization
   • Pagination (100 items per page)
   • Selective field projection
   • Aggregation pipelines

3. Client-Side Caching
   • LocalStorage for user settings
   • In-memory cache for email list
   • Service Workers for offline mode

4. API Optimization
   • Response compression
   • Batch requests
   • WebSocket for real-time (not polling)
```

---

## 🔍 MONITORING & DEBUGGING

### Key Metrics to Monitor
```
Server Health:
  • CPU Usage
  • Memory Usage
  • Active Connections
  • Request Response Time

Sync Health:
  • Last Sync Time
  • Emails Synced
  • Sync Duration
  • Error Rate

User Activity:
  • Active Users
  • Requests per Minute
  • Error Events
  • Performance Issues
```

### Debugging Commands
```bash
# Check server logs
tail -f server/logs/sync.log
tail -f server/logs/error.log

# Check database connection
mongosh
> use outlook_db
> db.Email.countDocuments()

# Check client logs
# Browser Console (F12 → Console)
# Look for: ✅ Connected, 📧 New email, etc.

# Check socket connections
# Browser Console → Network tab → WS filter
```

---

## 📚 REFERENCE LINKS

**Microsoft Graph API:**
- Emails: https://docs.microsoft.com/en-us/graph/api/user-list-messages
- Tasks: https://docs.microsoft.com/en-us/graph/api/todo-list-lists
- Authentication: https://docs.microsoft.com/en-us/azure/active-directory

**Socket.IO:**
- Documentation: https://socket.io/docs/v4/
- Events: https://socket.io/docs/v4/emit-cheatsheet/

**React:**
- Hooks: https://react.dev/reference/react/hooks
- Context: https://react.dev/learn/passing-data-deeply-with-context

**MongoDB:**
- Query: https://docs.mongodb.com/manual/reference/operator/query/
- Aggregation: https://docs.mongodb.com/manual/aggregation/

---

**Last Updated:** July 25, 2026  
**Status:** v1.0 - Ready for Reference  
**Maintainer:** GitHub Copilot

