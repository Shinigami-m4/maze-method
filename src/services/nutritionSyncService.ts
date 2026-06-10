import type { SyncTableConfig } from "./syncService";

export const nutritionSyncTables: SyncTableConfig[] = [
  {
    localTable: "meals",
    remoteTable: "meal_logs",
    columns: [
      { local: "logged_at" },
      { local: "meal_name" },
      { local: "meal_category" },
      { local: "calories" },
      { local: "protein_grams" },
      { local: "carb_grams" },
      { local: "fat_grams" },
      { local: "notes" }
    ]
  },
  {
    localTable: "daily_macro_logs",
    remoteTable: "daily_macro_logs",
    columns: [
      { local: "date" },
      { local: "calories" },
      { local: "protein_grams" },
      { local: "carb_grams" },
      { local: "fat_grams" },
      { local: "water_ounces" }
    ]
  }
];

