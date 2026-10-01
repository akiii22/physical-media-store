export type Category = {
  id: string;
  name: string;
};

export type ProductImage = {
  id: string;
  image_url: string;
  display_order: number;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  media_type: string;
  condition: string;
  price: number;
  stock: number;
  image_url: string | null;
  categories: Category | null;
  product_images: ProductImage[];
};