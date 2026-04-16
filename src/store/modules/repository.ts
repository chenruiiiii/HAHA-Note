import { Repository } from '@/components/layout/Start/types/list';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const repositorySlice = createApi({
  reducerPath: 'repositoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['repository'],
  endpoints: (builder) => ({
    getRepositoryList: builder.query<Repository[], void>({
      query: () => '/repository',
      providesTags: ['repository'],
    }),
  }),
});

export const { useGetRepositoryListQuery } = repositorySlice;
