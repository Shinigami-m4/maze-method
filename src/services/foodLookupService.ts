import { normalizeBarcodeValue } from "./barcodeService";
import { FoodLookupProduct } from "../types/nutrition";

const OPEN_FOOD_FACTS_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";
const PRODUCT_FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "generic_name",
  "serving_size",
  "nutriments"
].join(",");

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    code?: string;
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    serving_size?: string;
    nutriments?: Record<string, unknown>;
  };
};

export async function lookupFoodByBarcode(barcode: string): Promise<FoodLookupProduct> {
  const normalizedBarcode = normalizeBarcodeValue(barcode);
  if (!normalizedBarcode) {
    return createManualFoodFallback("");
  }

  try {
    // Version 1.5 uses Open Food Facts directly because it is a public product database.
    // If Maze Method later adds a backend, this request should move server-side for caching,
    // rate-limit handling, and richer food matching.
    const response = await fetch(
      `${OPEN_FOOD_FACTS_PRODUCT_URL}/${encodeURIComponent(normalizedBarcode)}.json?fields=${PRODUCT_FIELDS}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "MazeMethod/1.0 ReactNativeExpo"
        }
      }
    );

    if (!response.ok) {
      return createManualFoodFallback(normalizedBarcode);
    }

    const data = (await response.json()) as OpenFoodFactsResponse;
    if (data.status !== 1 || !data.product) {
      return createManualFoodFallback(normalizedBarcode);
    }

    return mapOpenFoodFactsProduct(normalizedBarcode, data.product);
  } catch {
    return createManualFoodFallback(normalizedBarcode);
  }
}

export function createManualFoodFallback(barcode: string): FoodLookupProduct {
  return {
    barcode,
    productName: "",
    servingSize: "",
    source: "manual",
    found: false
  };
}

function mapOpenFoodFactsProduct(
  barcode: string,
  product: NonNullable<OpenFoodFactsResponse["product"]>
): FoodLookupProduct {
  const nutriments = product.nutriments ?? {};

  return {
    barcode: product.code ?? barcode,
    productName: firstText(product.product_name, product.product_name_en, product.generic_name),
    servingSize: product.serving_size?.trim(),
    calories: firstNumber(nutriments["energy-kcal_serving"], nutriments["energy-kcal_100g"]),
    proteinGrams: firstNumber(nutriments.proteins_serving, nutriments.proteins_100g),
    carbGrams: firstNumber(nutriments.carbohydrates_serving, nutriments.carbohydrates_100g),
    fatGrams: firstNumber(nutriments.fat_serving, nutriments.fat_100g),
    source: "open_food_facts",
    found: true
  };
}

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? "Scanned food";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}
