import { apiSlice } from '../apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    verify2fa: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-2fa',
        method: 'POST',
        body: data,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    verifyEmail: builder.query({
      query: (token) => `/auth/verify-email?token=${token}`,
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    enable2fa: builder.mutation({
      query: () => ({
        url: '/auth/enable-2fa',
        method: 'POST',
      }),
    }),
    disable2fa: builder.mutation({
      query: () => ({
        url: '/auth/disable-2fa',
        method: 'POST',
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getSessions: builder.query({
      query: () => '/auth/sessions',
      providesTags: ['Sessions'],
    }),
    revokeSession: builder.mutation({
      query: (id) => ({
        url: `/auth/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sessions'],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerify2faMutation,
  useSignupMutation,
  useLazyVerifyEmailQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useEnable2faMutation,
  useDisable2faMutation,
  useLogoutMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} = authApi;
