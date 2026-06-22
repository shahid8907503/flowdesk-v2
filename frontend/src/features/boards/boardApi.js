import { apiSlice } from '../apiSlice';

export const boardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBoards: builder.query({
      query: (workspaceId) => `/boards?workspaceId=${workspaceId}`,
      providesTags: ['Board'],
    }),
    getBoardById: builder.query({
      query: (id) => `/boards/${id}`,
      providesTags: ['Board', 'Card'],
    }),
    createBoard: builder.mutation({
      query: (boardData) => ({
        url: '/boards',
        method: 'POST',
        body: boardData,
      }),
      invalidatesTags: ['Board'],
    }),
    updateBoard: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/boards/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Board'],
    }),
    deleteBoard: builder.mutation({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board'],
    }),
  }),
});

export const {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} = boardApi;
