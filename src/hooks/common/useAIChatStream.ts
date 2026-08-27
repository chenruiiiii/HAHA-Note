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

/** 埋点收敛：请求开始（Q15） */
function reportStarted(retryCount: number) {
  trackPerformance('ai_generation_started', {
    route: '/ai-chat/[id]',
    retry_count: retryCount,
  });
}

/** 埋点收敛：首 token（Q15） */
function reportFirstToken(firstTokenMs: number, retryCount: number) {
  trackPerformance('ai_first_token', {
    route: '/ai-chat/[id]',
    metric_name: 'ai_first_token_ms',
    first_token_ms: firstTokenMs,
    value: firstTokenMs,
    rating: rateMetric(firstTokenMs, getBudget('ai_first_token_ms')),
    success: true,
    retry_count: retryCount,
  });
}

/** 埋点收敛：完成 / 失败（Q15） */
function reportFinished(opts: {
  totalMs?: number;
  success: boolean;
  errorType?: string;
  retryCount: number;
}) {
  trackPerformance(opts.success ? 'ai_generation_completed' : 'ai_generation_failed', {
    route: '/ai-chat/[id]',
    metric_name: 'ai_total_ms',
    total_ms: opts.totalMs,
    value: opts.totalMs,
    rating:
      typeof opts.totalMs === 'number'
        ? rateMetric(opts.totalMs, getBudget('ai_total_ms'))
        : undefined,
    success: opts.success,
    error_type: opts.errorType,
    retry_count: opts.retryCount,
  });
}

/** 埋点收敛：用户停止（Q15） */
function reportCancelled(opts: { totalMs?: number; retryCount: number }) {
  trackPerformance('ai_generation_cancelled', {
    route: '/ai-chat/[id]',
    metric_name: 'ai_total_ms',
    total_ms: opts.totalMs,
    value: opts.totalMs,
    success: false,
    retry_count: opts.retryCount,
  });
}

/**
 * 错误文案分类（Q9 / 2.3）。
 *
 * 优先按 AI SDK 错误对象自带的 `statusCode` 分类（后端双通道透传）；
 * 其余情况回退到后端透传的用户可读 message；都不满足时给出保守文案。
 * 用户手动停止产生的 AbortError 返回空字符串，由调用方决定不展示。
 */
function getFriendlyError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '';
  }

  const statusCode = (error as { statusCode?: number })?.statusCode;

  if (statusCode === 401) {
    return '密钥鉴权失败，请检查配置后重试';
  }
  if (statusCode === 429) {
    return '请求过于频繁，请稍后重试';
  }
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    return '请求参数有误，请检查后重试';
  }

  const message = (error as { message?: string })?.message;

  if (typeof message === 'string' && message) {
    return message;
  }

  return '网络连接中断，请检查网络后重试';
}

export function useAIChatStream({ chatId, onPersisted }: UseAIChatStreamProps) {
  const dispatch = useAppDispatch();
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const hasPendingRetryRef = useRef(false);
  const requestStartedAtRef = useRef<number | null>(null);
  const hasReportedFirstTokenRef = useRef(false);
  const isMountedRef = useRef(true);

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
      if (!isMountedRef.current) return;
      // 用户手动停止产生的 AbortError：不展示错误提示，不计入重试
      if (chatError.name === 'AbortError') return;

      dispatch(setChatErrorAction({ chatId, error: getFriendlyError(chatError) }));
    },
    onFinish: async ({ isAbort, isDisconnect, isError }) => {
      if (!isMountedRef.current) return;

      const totalMs = requestStartedAtRef.current
        ? Math.round(now() - requestStartedAtRef.current)
        : undefined;

      try {
        if (isAbort) {
          reportCancelled({ totalMs, retryCount: retryCountRef.current });

          dispatch(
            setChatRequestStateAction({
              chatId,
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

        // 仅网络断开执行有限自动重试；业务错误（isError）不自动重试
        if (isDisconnect && retryCountRef.current < MAX_AUTO_RETRY) {
          hasPendingRetryRef.current = true;
          const nextRetryCount = retryCountRef.current + 1;

          dispatch(
            setChatRequestStateAction({
              chatId,
              requestStatus: 'retrying',
              isPosting: true,
              retryCount: nextRetryCount,
              lastError: '流式连接中断，正在重试',
            })
          );

          clearRetryTimer();
          retryTimerRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;

            retryCountRef.current = nextRetryCount;
            requestStartedAtRef.current = now();
            hasReportedFirstTokenRef.current = false;
            reportStarted(nextRetryCount);
            clearError();
            void regenerate({
              body: {
                chatId,
              },
            });
          }, RETRY_DELAY_MS);

          return;
        }

        // 正常结束 / 错误且不自动重试：进入终结态
        const completedRetryCount = retryCountRef.current;
        retryCountRef.current = 0;
        hasPendingRetryRef.current = false;
        clearRetryTimer();

        reportFinished({
          totalMs,
          success: !(isDisconnect || isError),
          errorType: isDisconnect ? 'disconnect' : isError ? 'ai_error' : undefined,
          retryCount: completedRetryCount,
        });

        dispatch(
          setChatRequestStateAction({
            chatId,
            requestStatus: isDisconnect || isError ? 'error' : 'success',
            isPosting: false,
            lastError: isDisconnect || isError ? '生成失败，可点击重试' : '',
          })
        );
        await onPersisted?.();
      } catch (err) {
        console.error('消息持久化异常', err);
      }
    },
  });

  // 中间态驱动（Q6）：effect 只负责 status 的中间态映射（submitted / streaming），
  // 终结态（success / error / aborted / retrying）统一由业务回调写入，
  // 全部写入均携带 chatId，同一会话内幂等覆盖，消除竞争。
  useEffect(() => {
    if (status === 'submitted') {
      dispatch(
        setChatRequestStateAction({
          chatId,
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

        reportFirstToken(firstTokenMs, retryCountRef.current);
      }

      hasPendingRetryRef.current = false;
      dispatch(
        setChatRequestStateAction({
          chatId,
          requestStatus: 'streaming',
          isPosting: true,
          retryCount: retryCountRef.current,
          lastError: '',
        })
      );
    }
  }, [chatId, dispatch, status]);

  // 保持最新 stop 引用，供卸载清理使用（避免依赖过期的闭包）
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // 组件卸载兜底（2.2）：中止进行中的流式请求、清除定时器、只清理当前会话状态
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearRetryTimer();
      dispatch(resetChatRequestStateAction({ chatId }));
      void stopRef.current();
    };
  }, [chatId, clearRetryTimer, dispatch]);

  const stopStream = useCallback(async () => {
    const totalMs = requestStartedAtRef.current
      ? Math.round(now() - requestStartedAtRef.current)
      : undefined;

    reportCancelled({ totalMs, retryCount: retryCountRef.current });

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

    reportStarted(0);

    dispatch(
      setChatRequestStateAction({
        chatId,
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

      reportStarted(0);

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
