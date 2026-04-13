export interface Reviews {
  id: number;
  product_id: number;
  user_id: number;
  content: string;
  rating: number;
  create_at: Date;
  username?: string;
}
