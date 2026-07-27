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
import { getBudget, rateMetric, trackPerformance } from '@/lib/performance';

interface UseAIChatStreamProps {
  chatId: string;
  onPersisted?: () => Promise<unknown> | unknown;
}

const MAX_AUTO_RETRY = 2;
const RETRY_DELAY_MS = 1200;

function now() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

export function useAIChatStream({ chatId, onPersisted }: UseAIChatStreamProps) {
  const dispatch = useAppDispatch();
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const hasPendingRetryRef = useRef(false);
  const requestStartedAtRef = useRef<number | null>(null);
  const hasReportedFirstTokenRef = useRef(false);

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
      const totalMs = requestStartedAtRef.current
        ? Math.round(now() - requestStartedAtRef.current)
        : undefined;

      trackPerformance('ai_generation_failed', {
        route: '/ai-chat/[id]',
        metric_name: 'ai_total_ms',
        total_ms: totalMs,
        value: totalMs,
        success: false,
        error_type: chatError.name || 'ai_error',
        retry_count: retryCountRef.current,
      });

      dispatch(
        setChatErrorAction({
          error: chatError.message || '对话请求失败，请稍后重试',
        })
      );
    },
    onFinish: async ({ isAbort, isDisconnect, isError }) => {
      const totalMs = requestStartedAtRef.current
        ? Math.round(now() - requestStartedAtRef.current)
        : undefined;

      if (isAbort) {
        trackPerformance('ai_generation_cancelled', {
          route: '/ai-chat/[id]',
          metric_name: 'ai_total_ms',
          total_ms: totalMs,
          value: totalMs,
          success: false,
          retry_count: retryCountRef.current,
        });

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
          requestStartedAtRef.current = now();
          hasReportedFirstTokenRef.current = false;
          trackPerformance('ai_generation_started', {
            route: '/ai-chat/[id]',
            retry_count: retryCountRef.current,
          });
          clearError();
          void regenerate({
            body: {
              chatId,
            },
          });
        }, RETRY_DELAY_MS);

        return;
      }

      const completedRetryCount = retryCountRef.current;
      retryCountRef.current = 0;
      hasPendingRetryRef.current = false;
      clearRetryTimer();

      trackPerformance(isDisconnect || isError ? 'ai_generation_failed' : 'ai_generation_completed', {
        route: '/ai-chat/[id]',
        metric_name: 'ai_total_ms',
        total_ms: totalMs,
        value: totalMs,
        rating: typeof totalMs === 'number' ? rateMetric(totalMs, getBudget('ai_total_ms')) : undefined,
        success: !(isDisconnect || isError),
        error_type: isDisconnect ? 'disconnect' : isError ? 'ai_error' : undefined,
        retry_count: completedRetryCount,
      });

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
      if (requestStartedAtRef.current && !hasReportedFirstTokenRef.current) {
        const firstTokenMs = Math.round(now() - requestStartedAtRef.current);
        hasReportedFirstTokenRef.current = true;

        trackPerformance('ai_first_token', {
          route: '/ai-chat/[id]',
          metric_name: 'ai_first_token_ms',
          first_token_ms: firstTokenMs,
          value: firstTokenMs,
          rating: rateMetric(firstTokenMs, getBudget('ai_first_token_ms')),
          success: true,
          retry_count: retryCountRef.current,
        });
      }

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
    const totalMs = requestStartedAtRef.current
      ? Math.round(now() - requestStartedAtRef.current)
      : undefined;

    trackPerformance('ai_generation_cancelled', {
      route: '/ai-chat/[id]',
      metric_name: 'ai_total_ms',
      total_ms: totalMs,
      value: totalMs,
      success: false,
      retry_count: retryCountRef.current,
    });

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
    requestStartedAtRef.current = now();
    hasReportedFirstTokenRef.current = false;

    trackPerformance('ai_generation_started', {
      route: '/ai-chat/[id]',
      retry_count: 0,
    });

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

  const trackedSendMessage = useCallback(
    (...args: Parameters<typeof sendMessage>) => {
      requestStartedAtRef.current = now();
      hasReportedFirstTokenRef.current = false;
      retryCountRef.current = 0;

      trackPerformance('ai_generation_started', {
        route: '/ai-chat/[id]',
        retry_count: 0,
      });

      return sendMessage(...args);
    },
    [sendMessage]
  );

  return {
    messages,
    status,
    error,
    sendMessage: trackedSendMessage,
    setMessages,
    stopStream,
    retryStream,
  };
}
