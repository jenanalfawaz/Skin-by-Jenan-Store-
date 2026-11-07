CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  rating numeric(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  reviews integer NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  color text NOT NULL,
  badge text NOT NULL,
  description text NOT NULL,
  ingredients text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  best boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, product_id)
);

CREATE TABLE public.wishlist_items (
  session_id uuid NOT NULL,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, product_id)
);

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 320),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (char_length(email) <= 320),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.add_store_cart_item(
  p_session_id uuid,
  p_product_id text,
  p_quantity integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.cart_items (session_id, product_id, quantity)
  VALUES (p_session_id, p_product_id, p_quantity)
  ON CONFLICT (session_id, product_id)
  DO UPDATE SET
    quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, 99),
    updated_at = now();
$$;

REVOKE ALL ON FUNCTION public.add_store_cart_item(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_store_cart_item(uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_store_cart_item(uuid, text, integer) TO service_role;

INSERT INTO public.products (id, name, kind, price, rating, reviews, color, badge, description, ingredients, categories, best, sort_order) VALUES
  ('rose', 'Rosewater Reset Mask', 'Nourishing face mask · 60 ml', 28, 4.9, 128, 'product-art', 'BEST SELLER', 'A soft, comforting clay mask for slow Sunday skin.', 'Rosewater · Kaolin · Oat', ARRAY['Face masks','Dryness','Dullness'], true, 1),
  ('matcha', 'Matcha Melt Mask', 'Balancing face mask · 60 ml', 26, 4.8, 86, 'product-art-2', 'A JENAN FAVE', 'A fresh-feeling reset with a creamy, easy-rinse finish.', 'Matcha · Aloe · Green tea', ARRAY['Face masks','Oiliness','Texture'], true, 2),
  ('cloud', 'Cloud Nine Eye Patches', 'Cooling eye patches · 30 pairs', 32, 4.9, 174, 'product-art-4', 'MOST LOVED', 'A little under-eye pause, whenever your day asks for it.', 'Cucumber · Hyaluronic acid · Rose', ARRAY['Eye patches','Tired eyes','Dryness'], true, 3),
  ('peach', 'Peach Please Eye Patches', 'Brightening eye patches · 30 pairs', 30, 4.7, 72, 'product-art-3', 'JUST LANDED', 'Peachy-soft patches made for your morning ritual.', 'Peach extract · Caffeine · Aloe', ARRAY['Eye patches','Tired eyes','Dullness'], false, 4),
  ('duo', 'The Mask Moment Duo', 'Ritual set · 2 full-size masks', 48, 4.9, 94, 'product-art', 'SAVE 15%', 'Your two-masks-in-rotation kind of self-care set.', 'Rosewater · Matcha · Oat', ARRAY['Face masks','Dryness','Oiliness'], true, 5)
ON CONFLICT (id) DO NOTHING;
