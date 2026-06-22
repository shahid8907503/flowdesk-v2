import { apiSlice } from '../apiSlice';

export const cardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCard: builder.mutation({
      query: (cardData) => ({
        url: '/cards',
        method: 'POST',
        body: cardData,
      }),
      invalidatesTags: ['Card', 'Board'],
    }),
    getCardById: builder.query({
      query: (id) => `/cards/${id}`,
      providesTags: (result, error, id) => [{ type: 'Card', id }],
    }),
    updateCard: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/cards/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Card', id }, 'Board'],
    }),
    moveCard: builder.mutation({
      query: ({ id, columnId, position }) => ({
        url: `/cards/${id}/move`,
        method: 'PUT',
        body: { columnId, position },
      }),
      invalidatesTags: ['Board', 'Card'],
    }),
    deleteCard: builder.mutation({
      query: (id) => ({
        url: `/cards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board', 'Card'],
    }),
    // Timer
    startTimer: builder.mutation({
      query: ({ id, boardId }) => ({
        url: `/cards/${id}/start-timer`,
        method: 'POST',
        body: { boardId }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Card', id }, 'Board'],
    }),
    stopTimer: builder.mutation({
      query: ({ id, boardId }) => ({
        url: `/cards/${id}/stop-timer`,
        method: 'POST',
        body: { boardId }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Card', id }, 'Board'],
    }),
    // Nested Comments
    addComment: builder.mutation({
      query: ({ cardId, text }) => ({
        url: `/cards/${cardId}/comments`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: (result, error, { cardId }) => [{ type: 'Card', id: cardId }],
    }),
    // Nested Attachments
    addAttachment: builder.mutation({
      query: ({ cardId, data }) => ({
        url: `/cards/${cardId}/attachments`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { cardId }) => [{ type: 'Card', id: cardId }],
    }),
    // Bulk Card Move Transaction
    bulkMove: builder.mutation({
      query: (data) => ({
        url: '/cards/bulk-move',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Board', 'Card'],
    }),
  }),
});

export const {
  useCreateCardMutation,
  useGetCardByIdQuery,
  useUpdateCardMutation,
  useMoveCardMutation,
  useDeleteCardMutation,
  useStartTimerMutation,
  useStopTimerMutation,
  useAddCommentMutation,
  useAddAttachmentMutation,
  useBulkMoveMutation,
} = cardApi;
