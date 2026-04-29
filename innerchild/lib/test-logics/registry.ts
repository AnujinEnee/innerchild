import { TestMeta, TestSlug } from "./types";

export const TEST_REGISTRY: Record<TestSlug, TestMeta> = {
  "setgel-gutral": {
    slug: "setgel-gutral",
    dbTestId: "a0000001-0000-0000-0000-000000000001",
    name: "Сэтгэл гутрал (BDI)",
    description:
      "Сэтгэл гутралын түвшинг тодорхойлох Бекийн сорил (Beck Depression Inventory). Энэ тест нь таны сэтгэл гутралын шинж тэмдгийг 20 асуултаар үнэлнэ.",
    questionCount: 20,
    estimatedMinutes: 10,
    category: "Сэтгэл гутрал",
    uiType: "multi-choice",
    questionsPerPage: 5,
    icon: "💙",
  },
  anxiety: {
    slug: "anxiety",
    dbTestId: "a0000001-0000-0000-0000-000000000002",
    name: "Сэтгэл түгшилт (State & Trait)",
    description:
      "Сэтгэл түгшилтийн түвшинг үнэлэх хоёр хэсэгтэй сорил. Нөхцөл байдлын болон бие хүний түгшилтийг тус тусад нь хэмжинэ.",
    questionCount: 40,
    estimatedMinutes: 15,
    category: "Түгшүүр",
    uiType: "multi-choice",
    questionsPerPage: 10,
    icon: "🧘",
  },
  stress: {
    slug: "stress",
    dbTestId: "a0000001-0000-0000-0000-000000000003",
    name: "Стрессийг илрүүлэх тест",
    description:
      "Таны стрессийн түвшинг тодорхойлох 14 асуулттай тест. Стрессийн эх үүсвэр, нөлөөллийг тодорхойлно.",
    questionCount: 14,
    estimatedMinutes: 8,
    category: "Стресс",
    uiType: "multi-choice",
    questionsPerPage: 5,
    icon: "😤",
  },
  "zan-tuluv": {
    slug: "zan-tuluv",
    dbTestId: "a0000001-0000-0000-0000-000000000004",
    name: "Зан төлөв (Леонгард)",
    description:
      "97 асуултаар зан төлвийн 10 хэмжигдэхүүнийг тодорхойлох Леонгардын сорил. Таны зан төлвийн давамгай чиг хандлагыг илрүүлнэ.",
    questionCount: 97,
    estimatedMinutes: 25,
    category: "Зан төлөв",
    uiType: "yes-no",
    questionsPerPage: 10,
    icon: "🎭",
    price: 12900,
  },
  luscher: {
    slug: "luscher",
    dbTestId: "a0000001-0000-0000-0000-000000000005",
    name: "Люшерийн өнгөний сорил",
    description:
      "8 өнгөний сонголтоор таны сэтгэл зүйн одоогийн байдал, стрессийн түвшин, зан чанарыг тодорхойлно.",
    questionCount: 8,
    estimatedMinutes: 5,
    category: "Зан төлөв",
    uiType: "color-ranking",
    questionsPerPage: 8,
    icon: "🎨",
    price: 7900,
  },
  ocd: {
    slug: "ocd",
    dbTestId: "a0000001-0000-0000-0000-000000000006",
    name: "OCD (Y-BOCS)",
    description:
      "Улигт бодол ба албадмал үйлдлийн түвшинг тодорхойлох Yale-Brown хялбаршуулсан сорил. 10 асуулттай.",
    questionCount: 10,
    estimatedMinutes: 8,
    category: "OCD",
    uiType: "multi-choice",
    questionsPerPage: 5,
    icon: "🔄",
  },
  brain: {
    slug: "brain",
    dbTestId: "a0000001-0000-0000-0000-000000000007",
    name: "Тархины давамгай тал",
    description:
      "27 асуултаар зүүн/баруун тархины давамгай хөгжлийг тодорхойлно. Таны сэтгэлгээний хэв маягийг илрүүлнэ.",
    questionCount: 27,
    estimatedMinutes: 10,
    category: "Тархи",
    uiType: "abc-choice",
    questionsPerPage: 6,
    icon: "🧠",
    price: 4900,
  },
  dontolt: {
    slug: "dontolt",
    dbTestId: "a0000001-0000-0000-0000-000000000008",
    name: "Донтолт илрүүлэх тест",
    description:
      "Донтох бодисын хэрэглээний түвшинг тодорхойлох 28 асуулттай тест.",
    questionCount: 28,
    estimatedMinutes: 10,
    category: "Донтолт",
    uiType: "yes-no",
    questionsPerPage: 5,
    icon: "🛡️",
  },
};

export const ALL_TESTS = Object.values(TEST_REGISTRY);

export function getTestMeta(slug: string): TestMeta | undefined {
  return TEST_REGISTRY[slug as TestSlug];
}

export function getSlugByDbTestId(dbTestId: string): TestSlug | undefined {
  return ALL_TESTS.find((t) => t.dbTestId === dbTestId)?.slug;
}
