// ── SkiDestination ──

export const skiDestinationConfig = {
  entityName: "SkiDestination",
  displayName: "יעדי סקי",
  contentFields: [
    "name", "name_en", "country", "region",
    "latitude", "longitude",
    "nearest_airport", "nearest_airports",
    "airport_distances", "drive_times",
    "lower_elevation", "upper_elevation",
    "ski_season", "season_start_date", "season_end_date",
    "difficulty_level", "budget_level",
    "average_cost_per_night", "ski_pass_price",
    "description", "highlights",
    "image_url", "video_url", "youtube_url", "website_url",
    "is_beginner_friendly",
    "total_piste_km", "blue_piste_km", "red_piste_km", "black_piste_km",
    "has_kosher_option", "kosher_whatsapp_message",
    "is_featured", "is_published",
    "live_cam_embed_url",
  ],
  systemFields: ["id", "created_date", "updated_date", "created_by_id"],
  requiredFields: ["name", "country", "nearest_airport", "budget_level"],
  naturalKey: (r) =>
    `${(r.name || "").trim().toLowerCase()}|${(r.country || "").trim().toLowerCase()}`,
  fieldTypes: {
    latitude: "number",
    longitude: "number",
    lower_elevation: "number",
    upper_elevation: "number",
    average_cost_per_night: "number",
    ski_pass_price: "number",
    total_piste_km: "number",
    blue_piste_km: "number",
    red_piste_km: "number",
    black_piste_km: "number",
    season_start_date: "date",
    season_end_date: "date",
    nearest_airports: "array",
    highlights: "array",
    airport_distances: "json",
    drive_times: "json",
    is_beginner_friendly: "boolean",
    has_kosher_option: "boolean",
    is_featured: "boolean",
    is_published: "boolean",
  },
  enumValues: {
    difficulty_level: ["מתחילים", "בינוניים", "מתקדמים", "כל הרמות"],
    budget_level: ["נמוך", "בינוני", "גבוה"],
  },
  zeroIsMissingFields: [
    "total_piste_km",
    "blue_piste_km",
    "red_piste_km",
    "black_piste_km",
    "lower_elevation",
    "upper_elevation",
  ],
};

// ── Airport ──

export const airportConfig = {
  entityName: "Airport",
  displayName: "שדות תעופה",
  contentFields: ["name", "code", "city", "country", "serves_destinations", "description"],
  systemFields: ["id", "created_date", "updated_date", "created_by_id"],
  requiredFields: ["name", "code", "city", "country"],
  naturalKey: (r) => (r.code || "").trim().toUpperCase(),
  fieldTypes: {
    serves_destinations: "array",
  },
};

// ── Equipment ──

export const equipmentConfig = {
  entityName: "Equipment",
  displayName: "ציוד סקי",
  contentFields: [
    "name", "category", "description", "importance",
    "rental_available", "estimated_price",
    "purchase_link", "image_url",
    "link_men", "link_women", "link_kids",
    "coupon_code",
  ],
  systemFields: ["id", "created_date", "updated_date", "created_by_id"],
  requiredFields: ["name", "category", "importance"],
  naturalKey: (r) =>
    `${(r.name || "").trim().toLowerCase()}|${(r.category || "").trim().toLowerCase()}`,
  fieldTypes: {
    rental_available: "boolean",
    estimated_price: "number",
  },
  enumValues: {
    category: ["ציוד גלישה", "בטיחות", "לבוש", "אביזרים"],
    importance: ["חובה", "מומלץ", "אופציונלי"],
  },
};

// ── SkiProduct ──

export const skiProductConfig = {
  entityName: "SkiProduct",
  displayName: "מוצרים / דילים",
  contentFields: [
    "name", "category_id",
    "image_url", "price", "link",
    "is_cheapest", "is_best_seller", "editors_pick",
    "description", "coupon_code",
  ],
  systemFields: ["id", "created_date", "updated_date", "created_by_id"],
  requiredFields: ["name", "category_id", "price", "link"],
  naturalKey: (r) =>
    `${(r.name || "").trim().toLowerCase()}|${r.category_id || ""}`,
  fieldTypes: {
    price: "number",
    is_cheapest: "boolean",
    is_best_seller: "boolean",
    editors_pick: "boolean",
  },
  virtualExportFields: ["category_name"],
  exportTransform: (record, extraData) => {
    const categories = extraData?.categories || [];
    const cat = categories.find((c) => c.id === record.category_id);
    return { category_name: cat?.name || "" };
  },
  importTransform: (record, extraData) => {
    const categories = extraData?.categories || [];
    if (!record.category_id && record.category_name) {
      const cat = categories.find(
        (c) => c.name.trim().toLowerCase() === record.category_name.trim().toLowerCase()
      );
      if (cat) return { ...record, category_id: cat.id };
    }
    return record;
  },
  importValidate: (record) => {
    if (!record.category_id) return "חסר קטגוריה תקינה (category_id או category_name)";
    return null;
  },
};

export const entityConfigs = {
  SkiDestination: skiDestinationConfig,
  Airport: airportConfig,
  Equipment: equipmentConfig,
  SkiProduct: skiProductConfig,
};