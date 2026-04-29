export interface LuscherTestResult {
  firstSelection: number[];
  secondSelection: number[];
  groups: {
    symbol: string;
    colors: number[];
    interpretations: string[];
  }[];
  isIdentical: boolean;
  analysis: {
    emotionalFlexibility: "high" | "medium" | "low";
    stressLevel: "low" | "medium" | "high";
    personalityTraits: string[];
    recommendations: string[];
  };
}

export const generateLuscherAnalysis = (
  firstSelection: number[],
  secondSelection: number[],
  groups: Array<{ symbol: string; colors: number[]; interpretations: string[] }>
): LuscherTestResult["analysis"] => {
  // Calculate emotional flexibility based on changes
  const changes = firstSelection.filter(
    (color, idx) => secondSelection[idx] !== color
  ).length;
  let emotionalFlexibility: "high" | "medium" | "low";
  if (changes >= 6) emotionalFlexibility = "high";
  else if (changes >= 3) emotionalFlexibility = "medium";
  else emotionalFlexibility = "low";

  // Determine stress level based on color positions and groups
  let stressLevel: "low" | "medium" | "high" = "medium";
  const firstGroupSymbol = groups[0]?.symbol;
  const lastGroupSymbol = groups[groups.length - 1]?.symbol;

  if (firstGroupSymbol === "+" && lastGroupSymbol === "-") {
    stressLevel = "low";
  } else if (firstGroupSymbol === "-" || lastGroupSymbol === "+") {
    stressLevel = "high";
  }

  // Extract personality traits from interpretations
  const personalityTraits: string[] = [];
  groups.forEach((group) => {
    // Check if interpretations exist before trying to access them
    if (group.interpretations && Array.isArray(group.interpretations)) {
      group.interpretations.forEach((interp: string) => {
        if (interp.includes("идэвхтэй")) personalityTraits.push("Идэвхтэй");
        if (interp.includes("тайван")) personalityTraits.push("Тайван");
        if (interp.includes("уйгагүй")) personalityTraits.push("Уйгагүй");
        if (interp.includes("эмзэг")) personalityTraits.push("Эмзэг");
        if (interp.includes("тогтвортой")) personalityTraits.push("Тогтвортой");
      });
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (emotionalFlexibility === "low") {
    recommendations.push(
      "Сэтгэл хөдлөлийн уян хатан байдлыг сайжруулах шаардлагатай"
    );
  }

  if (stressLevel === "high") {
    recommendations.push("Стресс удирдах арга техникийг сурах хэрэгтэй");
    recommendations.push("Амрах, тайвшрах арга замыг олох");
  }

  if (personalityTraits.includes("Эмзэг")) {
    recommendations.push("Өөрийгөө хамгаалах арга замыг олох");
  }

  if (personalityTraits.includes("Идэвхтэй")) {
    recommendations.push("Идэвхээ зөв чиглүүлэх");
  }

  return {
    emotionalFlexibility,
    stressLevel,
    personalityTraits: [...new Set(personalityTraits)], // Remove duplicat`es
    recommendations,
  };
};

export const getLuscherGroupDescription = (symbol: string): string => {
  switch (symbol) {
    case "+":
      return "Одоогийн сэтгэл зүйн хэв шинж";
    case "X":
      return "Харьцаа болон сэтгэл зүй, Одоогийн нөхцөл байдал, эсвэл тухайн нөхцөл байдалд тохирсон зан үйл";
    case "=":
      return "Хязгаарлагдсан шинж чанарууд, эсвэл тухайн нөхцөл байдалд тохироогүй зан үйл";
    case "-":
      return "Үл зөвшөөрөгдсөн эсвэл дарангуйлагдсан шинж чанарууд, эсвэл түгшүүртэй холбоотой шинж чанарууд";
    default:
      return "";
  }
};
