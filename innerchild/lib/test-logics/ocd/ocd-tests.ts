export interface OCDQuestion {
  id: number;
  section: "obsession" | "compulsion";
  title: string;
  options: { key: string; value: string }[];
}

const timeScale = [
  { key: "0", value: "Огт илрэхгүй" },
  { key: "1", value: "0–1 цаг" },
  { key: "2", value: "1–3 цаг" },
  { key: "3", value: "3–8 цаг" },
  { key: "4", value: "8-аас дээш цаг" },
];

const impactScale = [
  { key: "0", value: "Үгүй" },
  { key: "1", value: "Үл мэдэг нөлөөлдөг" },
  { key: "2", value: "Нөлөөлдөг боловч хянах боломжтой" },
  { key: "3", value: "Нэлээд их нөлөөлдөг" },
  { key: "4", value: "Маш их нөлөөлдөг" },
];

const discomfortScale = [
  { key: "0", value: "Үгүй" },
  { key: "1", value: "Бага зэрэг" },
  { key: "2", value: "Дунд зэрэг" },
  { key: "3", value: "Их" },
  { key: "4", value: "Бүхэл өдөр тааламжгүй" },
];

const resistanceScale = [
  { key: "0", value: "Байнга" },
  { key: "1", value: "Ихэнхдээ" },
  { key: "2", value: "Заримдаа" },
  { key: "3", value: "Хааяа" },
  { key: "4", value: "Үгүй" },
];

const insightScale = [
  { key: "0", value: "Бүрэн шүүмжлэлтэй хандана" },
  { key: "1", value: "Ихэнхдээ" },
  { key: "2", value: "Хааяа" },
  { key: "3", value: "Бага зэрэг" },
  { key: "4", value: "Шүүмжлэлгүй" },
];

export const OCDQuestions: OCDQuestion[] = [
  { id: 1, section: "obsession", title: "Танд таагүй бодол хоногт хэдэн цаг орчим үргэлжлэн илэрдэг вэ?", options: timeScale },
  { id: 2, section: "obsession", title: "Таны таагүй бодол нь өдөр тутмын үйл ажиллагаанд сөргөөр нөлөөлдөг үү?", options: impactScale },
  { id: 3, section: "obsession", title: "Та таагүй бодлын улмаас сэтгэл зүйн тааламжгүй байдалд ордог уу?", options: discomfortScale },
  { id: 4, section: "obsession", title: "Та таагүй улигт бодлоос салах оролдлого хийдэг үү?", options: resistanceScale },
  { id: 5, section: "obsession", title: "Та таагүй бодолдоо шүүмжлэлтэй ханддаг уу?", options: insightScale },
  { id: 6, section: "compulsion", title: "Та нэг албадмал үйлдэл хийхдээ хоногт хэдэн цаг зарцуулдаг вэ?", options: timeScale },
  { id: 7, section: "compulsion", title: "Таны албадмал үйлдэл өдөр тутмын амьдралд сөргөөр нөлөөлдөг үү?", options: impactScale },
  { id: 8, section: "compulsion", title: "Албадмал үйлдлийн улмаас сэтгэл зүйн тааламжгүй байдалд ордог уу?", options: discomfortScale },
  { id: 9, section: "compulsion", title: "Албадмал үйлдэл хийхээс салах оролдлого хийдэг үү?", options: resistanceScale },
  { id: 10, section: "compulsion", title: "Албадмал үйлдэл хийдэг байдалдаа шүүмжлэлтэй ханддаг уу?", options: insightScale },
];

export interface OCDScore {
  obsessionTotal: number;
  compulsionTotal: number;
  total: number;
}

export const calculateOCDScore = (answers: {
  [questionId: number]: string;
}): OCDScore => {
  let obsession = 0;
  let compulsion = 0;
  OCDQuestions.forEach((q) => {
    const a = answers[q.id];
    if (a !== undefined) {
      const n = parseInt(a, 10);
      if (!isNaN(n)) {
        if (q.section === "obsession") obsession += n;
        else compulsion += n;
      }
    }
  });
  return { obsessionTotal: obsession, compulsionTotal: compulsion, total: obsession + compulsion };
};
