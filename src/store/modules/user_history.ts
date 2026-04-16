import { Align, BrowseDocument, EditDocument } from '@/components/layout/Start/types/list';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// 定义联合类型
type ListResponse = EditDocument[] | BrowseDocument[];

export const userHistorySlice = createApi({
  reducerPath: 'userHistoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/start' }),
  tagTypes: ['edited', 'browsed'],
  endpoints: (builder) => ({
    // 获取编辑历史文档
    getEditedList: builder.query<ListResponse, { type: Align; page: number; limit: number }>({
      query: ({ type, page, limit }) => ({
        url: type === '编辑过' ? '/edited' : '/browsed',
        params: { page, limit },
      }),
      // 这里的 result 类型会被推断为 ListResponse
      providesTags: (result, error, arg) => [{ type: 'edited', id: arg.type }],
    }),
  }),
});

export const { useGetEditedListQuery } = userHistorySlice;
