import { apiSlice } from '../apiSlice';

export const workspaceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),
    createWorkspace: builder.mutation({
      query: (workspaceData) => ({
        url: '/workspaces',
        method: 'POST',
        body: workspaceData,
      }),
      invalidatesTags: ['Workspace'],
    }),
    getMembers: builder.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: ['Workspace'],
    }),
    inviteMember: builder.mutation({
      query: ({ workspaceId, data }) => ({
        url: `/workspaces/${workspaceId}/invite`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workspace'],
    }),
    updateMemberRole: builder.mutation({
      query: ({ workspaceId, memberUserId, data }) => ({
        url: `/workspaces/${workspaceId}/members/${memberUserId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Workspace'],
    }),
    removeMember: builder.mutation({
      query: ({ workspaceId, memberUserId }) => ({
        url: `/workspaces/${workspaceId}/members/${memberUserId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workspace'],
    }),
    deleteWorkspace: builder.mutation({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workspace'],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetMembersQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useDeleteWorkspaceMutation,
} = workspaceApi;
