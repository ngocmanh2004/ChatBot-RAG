interface Product {
  product_id: number;
  product_name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  specifications?: Record<string, string | number>;
  stock: number;
}

export default Product;
