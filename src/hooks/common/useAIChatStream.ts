'use client';

import { useAppDispatch } from '@/store';
import {
  resetChatRequestStateAction,
  setChatErrorAction,
  setChatRequestStateAction,
} from '@/store/modules/chat';
import { infoMessage, warningMessage } from '@/utils/message_reminder';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useRef } from 'react';

interface UseAIChatStreamProps {
  chatId: string;
  onPersisted?: () => Promise<unknown> | unknown;
}

const MAX_AUTO_RETRY = 2;
const RETRY_DELAY_MS = 1200;

export function useAIChatStream({ chatId, onPersisted }: UseAIChatStreamProps) {
  const dispatch = useAppDispatch();
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const hasPendingRetryRef = useRef(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    regenerate,
    stop,
    clearError,
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: '/api/chat-detail',
      body: {
        chatId,
      },
    }),
    onError: (chatError) => {
      dispatch(
        setChatErrorAction({
          error: chatError.message || '对话请求失败，请稍后重试',
        })
      );
    },
    onFinish: async ({ isAbort, isDisconnect, isError }) => {
      if (isAbort) {
        dispatch(
          setChatRequestStateAction({
            requestStatus: 'aborted',
            isPosting: false,
          })
        );
        retryCountRef.current = 0;
        hasPendingRetryRef.current = false;
        clearRetryTimer();
        await onPersisted?.();
        return;
      }

      if ((isDisconnect || isError) && retryCountRef.current < MAX_AUTO_RETRY) {
        hasPendingRetryRef.current = true;
        const nextRetryCount = retryCountRef.current + 1;

        dispatch(
          setChatRequestStateAction({
            requestStatus: 'retrying',
            isPosting: true,
            retryCount: nextRetryCount,
            lastError: isDisconnect ? '流式连接中断，正在重试' : '生成异常，正在重试',
          })
        );

        clearRetryTimer();
        retryTimerRef.current = setTimeout(() => {
          retryCountRef.current = nextRetryCount;
          clearError();
          void regenerate({
            body: {
              chatId,
            },
          });
        }, RETRY_DELAY_MS);

        return;
      }

      retryCountRef.current = 0;
      hasPendingRetryRef.current = false;
      clearRetryTimer();
      dispatch(
        setChatRequestStateAction({
          requestStatus: isDisconnect || isError ? 'error' : 'success',
          isPosting: false,
        })
      );
      await onPersisted?.();
    },
  });

  useEffect(() => {
    if (status === 'submitted') {
      dispatch(
        setChatRequestStateAction({
          requestStatus: hasPendingRetryRef.current ? 'retrying' : 'submitted',
          isPosting: true,
          lastError: hasPendingRetryRef.current ? '正在重新连接流式响应' : '',
        })
      );
      return;
    }

    if (status === 'streaming') {
      hasPendingRetryRef.current = false;
      dispatch(
        setChatRequestStateAction({
          requestStatus: 'streaming',
          isPosting: true,
          retryCount: retryCountRef.current,
          lastError: '',
        })
      );
      return;
    }

    if (status === 'ready' && !error) {
      dispatch(
        setChatRequestStateAction({
          requestStatus: 'ready',
          isPosting: false,
        })
      );
      return;
    }

    if (status === 'error') {
      dispatch(
        setChatRequestStateAction({
          requestStatus: 'error',
          isPosting: false,
        })
      );
    }
  }, [dispatch, error, status]);

  useEffect(() => {
    return () => {
      clearRetryTimer();
      dispatch(resetChatRequestStateAction());
    };
  }, [clearRetryTimer, dispatch]);

  const stopStream = useCallback(async () => {
    clearRetryTimer();
    hasPendingRetryRef.current = false;
    retryCountRef.current = 0;
    await stop();
    warningMessage('已停止本次生成');
  }, [clearRetryTimer, stop]);

  const retryStream = useCallback(async () => {
    clearRetryTimer();
    retryCountRef.current = 0;
    hasPendingRetryRef.current = false;
    clearError();

    dispatch(
      setChatRequestStateAction({
        requestStatus: 'retrying',
        isPosting: true,
        lastError: '',
      })
    );

    await regenerate({
      body: {
        chatId,
      },
    });
    infoMessage('已重新发起本轮回答');
  }, [chatId, clearError, clearRetryTimer, dispatch, regenerate]);

  return {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    stopStream,
    retryStream,
  };
}
