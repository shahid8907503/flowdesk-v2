import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logOut, setCredentials } from './auth/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api', // Using absolute proxy path, which will be directed to port 5000 in Nginx or Vite configs
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Attempt token refresh
    try {
      const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
      if (refreshResult.data) {
        const { accessToken } = refreshResult.data;
        api.dispatch(setCredentials({ token: accessToken }));
        // Retry the original query
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logOut());
      }
    } catch (error) {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Workspace', 'Board', 'Card', 'Webhook', 'Audit', 'Sessions'],
  endpoints: () => ({}),
});
