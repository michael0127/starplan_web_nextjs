/**
 * useAsyncTask - 异步任务轮询 Hook
 * 
 * 用于轮询 Celery 异步任务的状态和结果
 * 
 * 使用示例：
 * ```tsx
 * const { startPolling, stopPolling, taskStatus, isPolling, result, error } = useAsyncTask();
 * 
 * // 开始轮询
 * startPolling(taskId, {
 *   onSuccess: (result) => console.log('Task completed:', result),
 *   onError: (error) => console.error('Task failed:', error),
 * });
 * 
 * // 取消轮询
 * stopPolling();
 * ```
 */
import { useState, useCallback, useRef, useEffect } from 'react';

// 任务状态类型
export type TaskStatus = 
  | 'PENDING'      // 等待中
  | 'STARTED'      // 已开始
  | 'PROGRESS'     // 进行中
  | 'EXTRACTING'   // 提取中 (CV)
  | 'ANALYZING'    // 分析中 (JD)
  | 'RANKING'      // 排名中
  | 'MATCHING'     // 匹配中
  | 'SUCCESS'      // 成功
  | 'FAILURE'      // 失败
  | 'REVOKED';     // 已取消

// 任务状态响应
export interface TaskStatusResponse {
  success: boolean;
  taskId: string;
  type: 'single' | 'batch';
  status?: TaskStatus;
  ready: boolean;
  result?: Record<string, unknown>;
  error?: string;
  progress?: Record<string, unknown>;
  // 批量任务特有
  total?: number;
  completed?: number;
  results?: Array<{
    task_id: string;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
  }>;
}

// 轮询选项
export interface PollingOptions {
  interval?: number;          // 轮询间隔 (ms)，默认 2000
  maxAttempts?: number;       // 最大尝试次数，默认 150 (5分钟)
  isBatch?: boolean;          // 是否是批量任务
  onProgress?: (progress: Record<string, unknown>) => void;
  onSuccess?: (result: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

export function useAsyncTask() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, unknown> | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef<PollingOptions>({});

  // 清理轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 查询任务状态
  const fetchTaskStatus = useCallback(async (id: string, isBatch: boolean): Promise<TaskStatusResponse | null> => {
    try {
      const url = isBatch 
        ? `/api/tasks/${id}?batch=true`
        : `/api/tasks/${id}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching task status:', err);
      return null;
    }
  }, []);

  // 开始轮询
  const startPolling = useCallback((
    newTaskId: string,
    options: PollingOptions = {}
  ) => {
    // 保存选项
    optionsRef.current = {
      interval: 2000,
      maxAttempts: 150,
      isBatch: false,
      ...options,
    };
    
    // 重置状态
    setTaskId(newTaskId);
    setTaskStatus('PENDING');
    setIsPolling(true);
    setResult(null);
    setError(null);
    setProgress(null);
    setAttempts(0);
    
    // 清除旧的轮询
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // 立即执行一次
    const poll = async () => {
      const { isBatch, maxAttempts, onProgress, onSuccess, onError } = optionsRef.current;
      
      setAttempts(prev => {
        const newAttempts = prev + 1;
        
        // 检查是否超过最大尝试次数
        if (newAttempts >= (maxAttempts || 150)) {
          stopPolling();
          const timeoutError = 'Task polling timeout';
          setError(timeoutError);
          onError?.(timeoutError);
          return newAttempts;
        }
        
        return newAttempts;
      });
      
      const statusData = await fetchTaskStatus(newTaskId, isBatch || false);
      
      if (!statusData) {
        return;
      }
      
      // 更新状态
      if (statusData.status) {
        setTaskStatus(statusData.status);
      }
      
      // 更新进度
      if (statusData.progress) {
        setProgress(statusData.progress);
        onProgress?.(statusData.progress);
      }
      
      // 批量任务进度
      if (statusData.type === 'batch' && statusData.total && statusData.completed !== undefined) {
        const batchProgress = {
          total: statusData.total,
          completed: statusData.completed,
          percentage: Math.round((statusData.completed / statusData.total) * 100),
        };
        setProgress(batchProgress);
        onProgress?.(batchProgress);
      }
      
      // 检查是否完成
      if (statusData.ready) {
        stopPolling();
        
        if (statusData.error) {
          setError(statusData.error);
          onError?.(statusData.error);
        } else if (statusData.result) {
          // 检查结果中是否有错误
          if (statusData.result.success === false) {
            const errorMsg = (statusData.result.error as string) || 'Task failed';
            setError(errorMsg);
            onError?.(errorMsg);
          } else {
            setResult(statusData.result);
            setTaskStatus('SUCCESS');
            onSuccess?.(statusData.result);
          }
        } else if (statusData.results) {
          // 批量任务结果
          const batchResult = {
            results: statusData.results,
            total: statusData.total,
            completed: statusData.completed,
          };
          setResult(batchResult);
          setTaskStatus('SUCCESS');
          onSuccess?.(batchResult);
        }
      }
    };
    
    // 立即执行第一次
    poll();
    
    // 设置轮询
    intervalRef.current = setInterval(poll, optionsRef.current.interval);
  }, [fetchTaskStatus, stopPolling]);

  // 取消任务
  const cancelTask = useCallback(async () => {
    if (!taskId) return false;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        stopPolling();
        setTaskStatus('REVOKED');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error cancelling task:', err);
      return false;
    }
  }, [taskId, stopPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // 操作
    startPolling,
    stopPolling,
    cancelTask,
    // 状态
    taskId,
    taskStatus,
    isPolling,
    result,
    error,
    progress,
    attempts,
    // 辅助
    isSuccess: taskStatus === 'SUCCESS',
    isFailure: taskStatus === 'FAILURE' || !!error,
    isPending: taskStatus === 'PENDING' || taskStatus === 'STARTED',
    isInProgress: ['PROGRESS', 'EXTRACTING', 'ANALYZING', 'RANKING', 'MATCHING'].includes(taskStatus || ''),
  };
}

export default useAsyncTask;
