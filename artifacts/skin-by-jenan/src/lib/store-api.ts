import { supabaseClient } from "@/lib/supabase";
import type { StoreProduct } from "@workspace/api-client-react";

export {
  addStoreCartItem,
  addStoreWishlistItem,
  getStoreState,
  listStoreProducts,
  removeStoreCartItem,
  removeStoreWishlistItem,
  setStoreCartItemQuantity,
  subscribeStoreNewsletter,
  submitStoreContact,
} from "@workspace/api-client-react";

export type {
  ContactMessageInput,
  NewsletterInput,
  StoreCartItem,
  StoreProduct,
  StoreState,
} from "@workspace/api-client-react";

export async function listCatalogProducts(): Promise<StoreProduct[]> {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured for the product catalog.");
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select(
      "id,name,kind,price,rating,reviews,color,badge,description,ingredients,categories,best",
    )
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    price: Number(row.price),
    rating: Number(row.rating),
    reviews: row.reviews,
    color: row.color,
    badge: row.badge,
    desc: row.description,
    ingredients: row.ingredients,
    categories: row.categories,
    best: row.best,
  }));
}
