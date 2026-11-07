import { randomUUID } from "node:crypto";
import {
  Router,
  type IRouter,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import {
  AddStoreCartItemBody,
  AddStoreWishlistItemParams,
  GetStoreStateResponse,
  ListStoreProductsResponse,
  RemoveStoreCartItemParams,
  RemoveStoreWishlistItemParams,
  SetStoreCartItemQuantityBody,
  SetStoreCartItemQuantityParams,
  SubmitStoreContactBody,
  SubscribeStoreNewsletterBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const SESSION_COOKIE = "jenan_store_session";
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StoreCartRow = { product_id: string; quantity: number };
type StoreWishlistRow = { product_id: string };
type ProductRow = {
  id: string;
  name: string;
  kind: string;
  price: string | number;
  rating: string | number;
  reviews: number;
  color: string;
  badge: string;
  description: string;
  ingredients: string;
  categories: string[];
  best: boolean;
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required to secure store sessions.");
}

const storeSession: RequestHandler = (req, res, next) => {
  const signedId = req.signedCookies?.[SESSION_COOKIE];
  const sessionId =
    typeof signedId === "string" && UUID_PATTERN.test(signedId)
      ? signedId
      : randomUUID();

  if (sessionId !== signedId) {
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/api/store",
    });
  }

  res.locals.storeSessionId = sessionId;
  next();
};

router.use(storeSession);

function getSupabaseCredentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Supabase server credentials are not configured.");
  }
  return { url: url.replace(/\/+$/, ""), key };
}

async function supabaseRequest<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, key } = getSupabaseCredentials();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Accept", "application/json");
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${url}/rest/v1/${endpoint}`, {
    ...init,
    headers,
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}).`);
  }
  return (body ? JSON.parse(body) : undefined) as T;
}

function sessionId(res: Response): string {
  return res.locals.storeSessionId as string;
}

async function getStoreState(res: Response) {
  const id = sessionId(res);
  const [cartRows, wishlistRows] = await Promise.all([
    supabaseRequest<StoreCartRow[]>(
      `cart_items?select=product_id,quantity&session_id=eq.${encodeURIComponent(id)}&order=created_at.asc`,
    ),
    supabaseRequest<StoreWishlistRow[]>(
      `wishlist_items?select=product_id&session_id=eq.${encodeURIComponent(id)}&order=created_at.desc`,
    ),
  ]);

  return GetStoreStateResponse.parse({
    cart: cartRows.map((row) => ({
      productId: row.product_id,
      quantity: row.quantity,
    })),
    wishlist: wishlistRows.map((row) => row.product_id),
  });
}

function safely(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch((err: unknown) => {
      logger.error({ err }, "Store API request failed");
      if (!res.headersSent) {
        res.status(503).json({
          error: "The store service is temporarily unavailable.",
        });
      } else {
        next(err);
      }
    });
  };
}

router.get(
  "/products",
  safely(async (_req, res) => {
    const rows = await supabaseRequest<ProductRow[]>(
      "products?select=id,name,kind,price,rating,reviews,color,badge,description,ingredients,categories,best&order=sort_order.asc",
    );
    const products = rows.map((row) => ({
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
    res.json(ListStoreProductsResponse.parse(products));
  }),
);

router.get(
  "/state",
  safely(async (_req, res) => {
    res.json(await getStoreState(res));
  }),
);

router.post(
  "/cart/items",
  safely(async (req, res) => {
    const parsed = AddStoreCartItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await supabaseRequest("rpc/add_store_cart_item", {
      method: "POST",
      body: JSON.stringify({
        p_session_id: sessionId(res),
        p_product_id: parsed.data.productId,
        p_quantity: parsed.data.quantity,
      }),
    });
    res.json(await getStoreState(res));
  }),
);

router.patch(
  "/cart/items/:productId",
  safely(async (req, res) => {
    const params = SetStoreCartItemQuantityParams.safeParse(req.params);
    const body = SetStoreCartItemQuantityBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const filters = new URLSearchParams({
      session_id: `eq.${sessionId(res)}`,
      product_id: `eq.${params.data.productId}`,
    });
    await supabaseRequest(`cart_items?${filters.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        quantity: body.data.quantity,
        updated_at: new Date().toISOString(),
      }),
    });
    res.json(await getStoreState(res));
  }),
);

router.delete(
  "/cart/items/:productId",
  safely(async (req, res) => {
    const params = RemoveStoreCartItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const filters = new URLSearchParams({
      session_id: `eq.${sessionId(res)}`,
      product_id: `eq.${params.data.productId}`,
    });
    await supabaseRequest(`cart_items?${filters.toString()}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    res.json(await getStoreState(res));
  }),
);

router.put(
  "/wishlist/items/:productId",
  safely(async (req, res) => {
    const params = AddStoreWishlistItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await supabaseRequest(
      "wishlist_items?on_conflict=session_id,product_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          session_id: sessionId(res),
          product_id: params.data.productId,
        }),
      },
    );
    res.json(await getStoreState(res));
  }),
);

router.delete(
  "/wishlist/items/:productId",
  safely(async (req, res) => {
    const params = RemoveStoreWishlistItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const filters = new URLSearchParams({
      session_id: `eq.${sessionId(res)}`,
      product_id: `eq.${params.data.productId}`,
    });
    await supabaseRequest(`wishlist_items?${filters.toString()}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    res.json(await getStoreState(res));
  }),
);

router.post(
  "/contact",
  safely(async (req, res) => {
    const parsed = SubmitStoreContactBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    await supabaseRequest("contact_messages", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        message: parsed.data.message.trim(),
      }),
    });
    res.status(201).json({ success: true });
  }),
);

router.post(
  "/newsletter",
  safely(async (req, res) => {
    const parsed = SubscribeStoreNewsletterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    await supabaseRequest("newsletter_subscribers?on_conflict=email", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        email: parsed.data.email.trim().toLowerCase(),
      }),
    });
    res.status(201).json({ success: true });
  }),
);

export default router;
