export interface GutralResultLevel {
  min: number;
  max: number;
  level: string;
  description: string[];
  color: string;
  icon: string;
}

export const GutralLevels: GutralResultLevel[] = [
  {
    min: 0,
    max: 10,
    level: "Сэтгэл гутралгүй",
    description: ["Та сэтгэл гутралгүй байна."],
    color: "text-green-600",
    icon: "😌",
  },
  {
    min: 11,
    max: 17,
    level: "Хөнгөн сэтгэл гутрал",
    description: [
      "Та хөнгөн сэтгэл гутралтай байна.",
      "Сэтгэл хөдлөлөө сэргээх үзвэр үйлчилгээ, дасгал, дотно хүнтэйгээ харилцахыг санал болгож байна.",
    ],
    color: "text-yellow-600",
    icon: "🙂",
  },
  {
    min: 18,
    max: 23,
    level: "Дунд зэргийн сэтгэл гутрал",
    description: [
      "Та дунд зэргийн сэтгэл гутралтай байна.",
      "Гүн сэтгэл гутралд орох эрсдэлтэй тул мэргэжлийн сэтгэл зүйчтэй уулзахыг зөвлөж байна.",
    ],
    color: "text-orange-600",
    icon: "😟",
  },
  {
    min: 24,
    max: 120,
    level: "Гүн сэтгэл гутрал",
    description: [
      "Та гүнзгий сэтгэл гутралтай байна.",
      "Сэтгэл зүйн дархлаа унах, амьдралын чанар алдагдсан байж болзошгүй тул яаралтай мэргэжлийн тусламж шаардлагатай.",
    ],
    color: "text-red-600",
    icon: "😞",
  },
];

export const getGutralLevel = (score: number): GutralResultLevel => {
  return (
    GutralLevels.find((l) => score >= l.min && score <= l.max) ||
    GutralLevels[0]
  );
};
