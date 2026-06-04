import api from '@/lib/api';
import type {
  ReviewRun,
  ReviewRunDetail,
  ReviewRunListResponse,
} from '@/types/reviewRun';

export async function startReview(
  taskId: number | string,
  runId: string,
): Promise<ReviewRun> {
  const { data } = await api.post<ReviewRun>(
    `/tasks/${taskId}/agent/runs/${runId}/review`,
  );
  return data;
}

/** Returns the review snapshot + persisted event timeline. */
export async function fetchReview(
  taskId: number | string,
  reviewId: string,
): Promise<ReviewRunDetail> {
  const { data } = await api.get<ReviewRunDetail>(
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
