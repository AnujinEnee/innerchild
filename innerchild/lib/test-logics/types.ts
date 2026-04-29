export type TestSlug =
  | "setgel-gutral"
  | "anxiety"
  | "stress"
  | "zan-tuluv"
  | "luscher"
  | "ocd"
  | "brain"
  | "dontolt";

export type TestUIType = "multi-choice" | "yes-no" | "color-ranking" | "abc-choice";

export interface TestMeta {
  slug: TestSlug;
  dbTestId: string;
  name: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
  category: string;
  uiType: TestUIType;
  questionsPerPage: number;
  icon: string;
  image?: string;
  price?: number;
}
