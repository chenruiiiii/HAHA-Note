import { Repository } from '@/components/layout/Start/types/list';
import { RepoDetailType } from '@/components/layout/Repository/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ResponseData } from '@/types/response';

export const repositorySlice = createApi({
  reducerPath: 'repositoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['repository'],
  endpoints: (builder) => ({
    getRepositoryList: builder.query<Repository[], void>({
      query: () => '/repository',
      providesTags: ['repository'],
    }),
    createRepository: builder.mutation<
      ResponseData<RepoDetailType>,
      { title: string; description?: string }
    >({
      query: (body) => ({
        url: '/repository',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['repository'],
    }),
  }),
});

export const { useGetRepositoryListQuery, useCreateRepositoryMutation } = repositorySlice;
