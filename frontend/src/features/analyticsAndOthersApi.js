import { apiSlice } from './apiSlice';

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBurndown: builder.query({
      query: (boardId) => `/analytics/burndown?boardId=${boardId}`,
    }),
    getTimeTracking: builder.query({
      query: (boardId) => `/analytics/time-tracking?boardId=${boardId}`,
    }),
  }),
});

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: ({ workspaceId, action, userId, page = 1, limit = 50 }) => {
        let url = `/audit-logs?workspaceId=${workspaceId}&page=${page}&limit=${limit}`;
        if (action) url += `&action=${action}`;
        if (userId) url += `&userId=${userId}`;
        return url;
      },
      providesTags: ['Audit'],
    }),
  }),
});

export const webhookApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWebhooks: builder.query({
      query: (workspaceId) => `/webhooks?workspaceId=${workspaceId}`,
      providesTags: ['Webhook'],
    }),
    createWebhook: builder.mutation({
      query: (data) => ({
        url: '/webhooks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Webhook'],
    }),
    deleteWebhook: builder.mutation({
      query: (id) => ({
        url: `/webhooks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Webhook'],
    }),
  }),
});

export const aiApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateSubtasks: builder.mutation({
      query: (data) => ({
        url: '/ai/generate-subtasks',
        method: 'POST',
        body: data,
      }),
    }),
    generateSprintPlan: builder.mutation({
      query: (data) => ({
        url: '/ai/sprint-plan',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetBurndownQuery,
  useGetTimeTrackingQuery,
  useGetAuditLogsQuery,
  useGetWebhooksQuery,
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
} = webhookApi;

export const { useGetBurndownQuery: useGetBurndown, useGetTimeTrackingQuery: useGetTimeTracking } = analyticsApi;
export const { useGetAuditLogsQuery: useGetAuditLogs } = auditApi;
export const { useGetWebhooksQuery: useGetWebhooks, useCreateWebhookMutation: useCreateWebhook, useDeleteWebhookMutation: useDeleteWebhook } = webhookApi;
export const { useGenerateSubtasksMutation: useGenerateSubtasks, useGenerateSprintPlanMutation: useGenerateSprintPlan } = aiApi;
