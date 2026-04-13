import type { AttributeInfo } from "langchain/chains/query_constructor";

const ProductAttribute: AttributeInfo[] = [
  {
    name: "category",
    description:
      "Product category, for example: Laptop, Dien thoai, May tinh bang, Tai nghe, Phu kien",
    type: "string",
  },
  {
    name: "brand",
    description:
      "Product brand/manufacturer, for example: Apple, Samsung, Dell, Asus, Lenovo, Sony",
    type: "string",
  },
  {
    name: "price",
    description: "Product price in VND (integer)",
    type: "number",
  },
  {
    name: "stock",
    description:
      "Stock quantity. stock > 0 means in stock, stock = 0 means out of stock.",
    type: "number",
  },
  {
    name: "doc_type",
    description:
      "Document type in vector store: product, faq, policy",
    type: "string",
  },
  {
    name: "policy_type",
    description:
      "Used when doc_type is policy. Supported values: return, shipping, warranty, payment, privacy.",
    type: "string",
  },
];

export default ProductAttribute;
