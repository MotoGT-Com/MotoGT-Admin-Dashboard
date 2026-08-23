/**
 * Seed collection documents (empty membership — products come from live catalog).
 */

import type { Collection } from "@/lib/domain/collections";

const DEFAULT_STORE = "store_default";

export const SEED_COLLECTIONS: Collection[] = [
  {
    id: "col_summer_picks",
    storeId: DEFAULT_STORE,
    type: "manual",
    status: "draft",
    slug: "summer-picks",
    imageUrl: null,
    sortOrder: 1,
    translations: [
      {
        languageCode: "en",
        title: "Summer Picks",
        description: "Curated bestsellers for the season — add products from your catalog.",
      },
      {
        languageCode: "ar",
        title: "اختيارات الصيف",
        description: "أفضل المنتجات المختارة لهذا الموسم.",
      },
    ],
    productIds: [],
    conditions: [],
    excludedProductIds: [],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-08-20T14:30:00.000Z",
  },
  {
    id: "col_bmw_fitment",
    storeId: DEFAULT_STORE,
    type: "automated",
    status: "draft",
    slug: "bmw-fitment",
    imageUrl: null,
    sortOrder: 2,
    translations: [
      {
        languageCode: "en",
        title: "BMW Fitment",
        description: "Add a car make condition to preview matching products from your catalog.",
      },
      {
        languageCode: "ar",
        title: "قطع بي إم دبليو",
        description: "أضف شرط ماركة السيارة لمعاينة المنتجات المتوافقة.",
      },
    ],
    productIds: [],
    conditions: [],
    excludedProductIds: [],
    createdAt: "2026-05-12T09:00:00.000Z",
    updatedAt: "2026-08-18T11:00:00.000Z",
  },
];

/** @deprecated use SEED_COLLECTIONS */
export const MOCK_COLLECTIONS = SEED_COLLECTIONS;
