import { Product } from './product';

export class Order {
  order_id?: number;
  user_id!: number;
  order_status?: string;
  create_at?: Date;
  total_amount!: number;
  address!: string;
  phone!: string;
  payment_method!: string;
  product?: Product;
}
