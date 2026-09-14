export interface CreatePageCommentInput {
  body: string;
  pageIndex: number;
  pageY: number;
  parentId?: string;
}