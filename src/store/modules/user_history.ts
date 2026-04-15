import { BrowseDocument, EditDocument } from '@/components/layout/Start/types/list';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const userHistorySlice = createApi({
  reducerPath: 'userHistoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/start' }),
  tagTypes: ['edited', 'browsed'],
  endpoints: (builder) => ({
    // 获取编辑历史文档
    getEditedList: builder.query<EditDocument[], { page: number; limit: number }>({
      query: ({ page, limit }) => ({
        url: '/edited',
        params: { page, limit },
      }),
      providesTags: ['edited'],
    }),
    // 获取浏览历史文档
    getBrowsedList: builder.query<BrowseDocument[], void>({
      query: () => '/browsed',
      providesTags: ['browsed'],
    }),
  }),
});

export const { useGetEditedListQuery, useGetBrowsedListQuery } = userHistorySlice;
