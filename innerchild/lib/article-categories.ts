export interface CategoryGroup {
  label: string;
  subcategories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "Сэтгэцийн эмгэг",
    subcategories: [
      "Сэтгэл гутрал",
      "Сэтгэл түгшилт",
      "Донтолт",
      "Нойргүйдэл ба Бие махбод",
      "Гэмтлийн дараах стресс",
    ],
  },
  {
    label: "Өөртөө туслах",
    subcategories: [
      "Стресс менежмент",
      "Сэтгэл хөдлөлөө удирдах",
      "Өөрийгөө хайрлах",
      "Медитаци ба Амьсгал",
    ],
  },
  {
    label: "Гэр бүл, Хайр дурлал, Харилцаа",
    subcategories: [
      "Гэр бүлийн харилцаа",
      "Хайр дурлал",
      "Хүүхэд хүмүүжил",
      "Салалт ба Алдалт",
    ],
  },
  {
    label: "Насны онцлог",
    subcategories: [
      "Хүүхэд наc",
      "Өсвөр нас",
      "Залуучууд",
      "Ахмад нас",
    ],
  },
  {
    label: "Мэргэжлийн булан",
    subcategories: [
      "Сэтгэл зүйн онол",
      "Кейс судалгаа",
      "Шинэ судалгаа",
    ],
  },
];

/** All main category labels */
export const MAIN_CATEGORIES = CATEGORY_GROUPS.map((g) => g.label);

/** All subcategories flat */
export const ALL_SUBCATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.subcategories);

/** Find which main category a subcategory belongs to */
export function getParentCategory(subcategory: string): string | null {
  for (const g of CATEGORY_GROUPS) {
    if (g.subcategories.includes(subcategory)) return g.label;
  }
  return null;
}

/** Get subcategories for a main category */
export function getSubcategories(mainCategory: string): string[] {
  return CATEGORY_GROUPS.find((g) => g.label === mainCategory)?.subcategories ?? [];
}
