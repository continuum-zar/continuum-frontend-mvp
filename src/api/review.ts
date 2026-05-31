import api from '@/lib/api';
import type { ReviewRun, ReviewRunListResponse } from '@/types/reviewRun';

export async function startReview(
  taskId: number | string,
  runId: string,
): Promise<ReviewRun> {
  const { data } = await api.post<ReviewRun>(
    `/tasks/${taskId}/agent/runs/${runId}/review`,
  );
  return data;
}

export async function fetchReview(
  taskId: number | string,
  reviewId: string,
): Promise<ReviewRun> {
  const { data } = await api.get<ReviewRun>(
    `/tasks/${taskId}/agent/reviews/${reviewId}`,
  );
  return data;
}

export async function listReviewsForRun(
  taskId: number | string,
  runId: string,
): Promise<ReviewRunListResponse> {
  const { data } = await api.get<ReviewRunListResponse>(
    `/tasks/${taskId}/agent/runs/${runId}/reviews`,
  );
  return data;
}
