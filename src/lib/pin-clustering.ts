import type { PageComment } from "@/domain/entities/page-comment";

const CLUSTER_TOLERANCE = 0.05; // 5% of page height

export interface PageCommentCluster {
  pageIndex: number;
  pageY: number;
  comments: PageComment[];
}

export function clusterPageComments(comments: PageComment[]): PageCommentCluster[] {
  if (comments.length === 0) return [];

  const byPage = new Map<number, PageComment[]>();
  for (const c of comments) {
    const list = byPage.get(c.pageIndex) ?? [];
    list.push(c);
    byPage.set(c.pageIndex, list);
  }

  const clusters: PageCommentCluster[] = [];

  for (const [pageIndex, pageComments] of byPage) {
    const sorted = [...pageComments].sort((a, b) => a.pageY - b.pageY);

    for (const comment of sorted) {
      const existing = clusters.find(
        (cl) => cl.pageIndex === pageIndex && Math.abs(cl.pageY - comment.pageY) <= CLUSTER_TOLERANCE
      );
      if (existing) {
        existing.comments.push(comment);
        existing.pageY =
          existing.comments.reduce((sum, c) => sum + c.pageY, 0) / existing.comments.length;
      } else {
        clusters.push({ pageIndex, pageY: comment.pageY, comments: [comment] });
      }
    }
  }

  return clusters.sort((a, b) => a.pageY - b.pageY);
}