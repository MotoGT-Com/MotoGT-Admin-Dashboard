/**
 * Collections service — live `/admin/collections` API.
 * Condition option catalogs still load from product/category/car services.
 */

import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  fromApiCondition,
  normalizeCollectionSlug,
  toApiCondition,
  type Collection,
  type CollectionCondition,
  type CollectionListItem,
  type CollectionProduct,
  type CollectionTranslation,
  type CreateCollectionInput,
  type ListCollectionsParams,
  type UpdateCollectionInput,
} from "@/lib/domain/collections";
import {
  loadConditionOptions,
  searchCatalogProducts,
  type CollectionConditionOptions,
} from "@/lib/collections/catalog-preview";

interface ApiCollectionDetail {
  id: string;
  storeId: string;
  type: Collection["type"];
  status: Collection["status"];
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount?: number;
  translations: Array<{
    languageId?: string;
    languageCode: string;
    title: string;
    description: string;
  }>;
  productIds: string[];
  conditions: Array<{
    id: string;
    field: string;
    operator: string;
    value: string;
    valueLabel?: string | null;
  }>;
  excludedProductIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiCollectionListItem extends ApiCollectionDetail {
  title?: string;
  productCount: number;
}

interface ApiProductCard {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  currency?: string;
  stock?: number | null;
  image?: string | null;
  categoryName?: string | null;
  productTypeName?: string | null;
  carMake?: string | null;
  position?: number | null;
}

function mapTranslation(
  t: ApiCollectionDetail["translations"][number],
): CollectionTranslation {
  return {
    languageCode: t.languageCode,
    title: t.title,
    description: t.description,
    languageId: t.languageId,
  };
}

function mapCollection(raw: ApiCollectionDetail): Collection {
  return {
    id: raw.id,
    storeId: raw.storeId,
    type: raw.type,
    status: raw.status,
    slug: normalizeCollectionSlug(raw.slug),
    imageUrl: raw.imageUrl,
    sortOrder: raw.sortOrder,
    translations: (raw.translations ?? []).map(mapTranslation),
    productIds: raw.productIds ?? [],
    conditions: (raw.conditions ?? []).map(fromApiCondition),
    excludedProductIds: raw.excludedProductIds ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    productCount: raw.productCount,
  };
}

function mapListItem(raw: ApiCollectionListItem): CollectionListItem {
  const base = mapCollection(raw);
  return {
    ...base,
    productCount: raw.productCount ?? 0,
    title: raw.title,
  };
}

function mapProductCard(raw: ApiProductCard): CollectionProduct {
  return {
    id: raw.id,
    name: raw.name,
    sku: raw.sku ?? undefined,
    price: raw.price ?? 0,
    currency: raw.currency,
    stock: raw.stock ?? null,
    image: raw.image ?? null,
    categoryName: raw.categoryName ?? undefined,
    productTypeName: raw.productTypeName ?? undefined,
    carMake: raw.carMake ?? null,
    position: raw.position ?? undefined,
  };
}

function translationsForApi(translations: CollectionTranslation[]) {
  return translations
    .filter((t) => t.title.trim() && t.description.trim())
    .map((t) => ({
      languageCode: t.languageCode as "en" | "ar",
      ...(t.languageId ? { languageId: t.languageId } : {}),
      title: t.title.trim(),
      description: t.description.trim(),
    }));
}

/** Drop data-URL images — API expects a hosted URL (max 500). */
function sanitizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:")) return null;
  if (imageUrl.length > 500) return null;
  return imageUrl;
}

function throwApiError(error: unknown, fallback: string): never {
  throw new Error(getApiErrorMessage(error, fallback));
}

class CollectionService {
  async getConditionOptions(
    storeId: string,
    languageId: string,
  ): Promise<CollectionConditionOptions> {
    return loadConditionOptions(storeId, languageId);
  }

  async searchProducts(
    storeId: string,
    languageId: string,
    opts?: {
      search?: string;
      categoryId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return searchCatalogProducts(storeId, languageId, opts);
  }

  async listCollections(
    params: ListCollectionsParams,
  ): Promise<{ collections: CollectionListItem[]; total: number }> {
    try {
      const response = await apiClient.get<{
        collections: ApiCollectionListItem[];
        total: number;
      }>("/admin/collections", {
        storeId: params.storeId,
        search: params.search || undefined,
        type: params.type ?? "all",
        status: params.status ?? "all",
        page: 1,
        limit: 100,
      });
      const data = response.data.data;
      return {
        collections: (data.collections ?? []).map(mapListItem),
        total: data.total ?? 0,
      };
    } catch (error) {
      throwApiError(error, "Failed to load collections");
    }
  }

  async getCollection(id: string): Promise<{ collection: Collection }> {
    try {
      const response = await apiClient.get<{ collection: ApiCollectionDetail }>(
        `/admin/collections/${id}`,
      );
      return { collection: mapCollection(response.data.data.collection) };
    } catch (error) {
      throwApiError(error, "Failed to load collection");
    }
  }

  async previewMembership(input: {
    storeId: string;
    languageId?: string;
    type: Collection["type"];
    productIds?: string[];
    conditions?: CollectionCondition[];
    excludedProductIds?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CollectionProduct[]> {
    try {
      const response = await apiClient.post<{
        products: ApiProductCard[];
        total: number;
        page: number;
        limit: number;
      }>("/admin/collections/preview", {
        storeId: input.storeId,
        type: input.type,
        productIds: input.productIds ?? [],
        conditions: (input.conditions ?? []).map(toApiCondition),
        excludedProductIds: input.excludedProductIds ?? [],
        search: input.search || undefined,
        languageId: input.languageId || undefined,
        page: input.page ?? 1,
        limit: input.limit ?? 50,
      });
      return (response.data.data.products ?? []).map(mapProductCard);
    } catch (error) {
      throwApiError(error, "Failed to preview collection products");
    }
  }

  async listCollectionProducts(
    id: string,
    opts?: {
      languageId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ products: CollectionProduct[]; total: number }> {
    try {
      const response = await apiClient.get<{
        products: ApiProductCard[];
        total: number;
      }>(`/admin/collections/${id}/products`, {
        languageId: opts?.languageId,
        search: opts?.search,
        page: opts?.page ?? 1,
        limit: opts?.limit ?? 50,
      });
      const data = response.data.data;
      return {
        products: (data.products ?? []).map(mapProductCard),
        total: data.total ?? 0,
      };
    } catch (error) {
      throwApiError(error, "Failed to load collection products");
    }
  }

  async createCollection(input: CreateCollectionInput): Promise<Collection> {
    try {
      const response = await apiClient.post<{ collection: ApiCollectionDetail }>(
        "/admin/collections",
        {
          storeId: input.storeId,
          type: input.type,
          status: input.status ?? "draft",
          slug: normalizeCollectionSlug(input.slug || "collection"),
          imageUrl: sanitizeImageUrl(input.imageUrl),
          sortOrder: input.sortOrder ?? 0,
          translations: translationsForApi(input.translations),
          productIds: input.type === "manual" ? input.productIds ?? [] : [],
          conditions:
            input.type === "automated"
              ? (input.conditions ?? []).map(toApiCondition)
              : [],
          excludedProductIds: input.excludedProductIds ?? [],
        },
      );
      return mapCollection(response.data.data.collection);
    } catch (error) {
      throwApiError(error, "Failed to create collection");
    }
  }

  async updateCollection(
    id: string,
    input: UpdateCollectionInput,
  ): Promise<Collection> {
    try {
      const body: Record<string, unknown> = {};
      if (input.type !== undefined) body.type = input.type;
      if (input.status !== undefined) body.status = input.status;
      if (input.slug !== undefined) {
        body.slug = normalizeCollectionSlug(input.slug);
      }
      if (input.imageUrl !== undefined) {
        body.imageUrl = sanitizeImageUrl(input.imageUrl);
      }
      if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder;
      if (input.translations !== undefined) {
        body.translations = translationsForApi(input.translations);
      }
      if (input.productIds !== undefined) body.productIds = input.productIds;
      if (input.conditions !== undefined) {
        body.conditions = input.conditions.map(toApiCondition);
      }
      if (input.excludedProductIds !== undefined) {
        body.excludedProductIds = input.excludedProductIds;
      }

      const response = await apiClient.patch<{
        collection: ApiCollectionDetail;
      }>(`/admin/collections/${id}`, body);
      return mapCollection(response.data.data.collection);
    } catch (error) {
      throwApiError(error, "Failed to update collection");
    }
  }

  async duplicateCollection(id: string): Promise<Collection> {
    try {
      const response = await apiClient.post<{ collection: ApiCollectionDetail }>(
        `/admin/collections/${id}/duplicate`,
      );
      return mapCollection(response.data.data.collection);
    } catch (error) {
      throwApiError(error, "Failed to duplicate collection");
    }
  }

  async deleteCollection(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/collections/${id}`);
    } catch (error) {
      throwApiError(error, "Failed to delete collection");
    }
  }
}

export const collectionService = new CollectionService();
