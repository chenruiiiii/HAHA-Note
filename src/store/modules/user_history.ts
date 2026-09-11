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
    getEditedList: builder.query<ListResponse, { type: Align }>({
      query: ({ type }) => ({
        url: type === '编辑过' ? '/edited' : '/browsed',
      }),
      // 按请求的列表类型打标签，供 invalidateDocumentLists 精确失效
      providesTags: (result, error, arg) => [arg.type === '编辑过' ? 'edited' : 'browsed'],
    }),
  }),
});

export const { useGetEditedListQuery } = userHistorySlice;
