// MSW Mock Handlers for MS Graph & System REST API Endpoints
export const handlers = [
  // Mock Graph token & User Profile endpoint
  {
    info: { header: 'GET https://graph.microsoft.com/v1.0/me' },
    response: {
      id: 'usr-123',
      displayName: 'Enterprise User',
      mail: 'user@enterprise.com',
      userPrincipalName: 'user@enterprise.com'
    }
  },
  // Mock API Dashboard Stats
  {
    info: { header: 'GET /api/dashboard/stats' },
    response: {
      success: true,
      data: {
        totalEmails: 120,
        actionRequired: 15,
        highPriority: 8,
        pendingTasks: 5
      }
    }
  }
];
