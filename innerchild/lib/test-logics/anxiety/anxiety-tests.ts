export type AnxietyDomain = "state" | "trait";

export interface AnxietyQuestion {
  id: number;
  domain: AnxietyDomain;
  question: string;
  options: { key: string; value: string }[];
}

const answersScale = [
  { key: "4", value: "Огт үгүй" },
  { key: "3", value: "Ихэнхдээ үгүй" },
  { key: "2", value: "Ихэнхдээ тийм" },
  { key: "1", value: "Үргэлж тийм" },
];

const reverseScale = [
  { key: "1", value: "Огт үгүй" },
  { key: "2", value: "Ихэнхдээ үгүй" },
  { key: "3", value: "Ихэнхдээ тийм" },
  { key: "4", value: "Үргэлж тийм" },
];

export const AnxietyQuestions: AnxietyQuestion[] = [
  // STATE (20)
  { id: 1, domain: "state", question: "Би тайван байна.", options: answersScale },
  { id: 2, domain: "state", question: "Надад заналхийлсэн зүйл алга.", options: answersScale },
  { id: 3, domain: "state", question: "Би дарамт бачимдалтай байна.", options: reverseScale },
  { id: 4, domain: "state", question: "Би дотоод зовиурт баригдчихаад байна.", options: reverseScale },
  { id: 5, domain: "state", question: "Би эрх чөлөөгөө мэдэрч байна.", options: answersScale },
  { id: 6, domain: "state", question: "Би ууртай байна.", options: reverseScale },
  { id: 7, domain: "state", question: "Учирч болзошгүй бүтэлгүйтэл намайг зовоож байна.", options: reverseScale },
  { id: 8, domain: "state", question: "Сэтгэлийнхээ амар тайвныг би мэдэрч байна.", options: answersScale },
  { id: 9, domain: "state", question: "Миний сэтгэл үймэрч байна.", options: reverseScale },
  { id: 10, domain: "state", question: "Би дотоод сэтгэлийн таашаалаа мэдэрч байна.", options: answersScale },
  { id: 11, domain: "state", question: "Би өөртөө итгэлтэй байна.", options: answersScale },
  { id: 12, domain: "state", question: "Би уур, бачимдалтай байна.", options: reverseScale },
  { id: 13, domain: "state", question: "Би байх суух газраа олж ядаж байна.", options: reverseScale },
  { id: 14, domain: "state", question: "Би дэвэрж хөөрчихөөд байна.", options: reverseScale },
  { id: 15, domain: "state", question: "Надад гутрал, бачимдал мэдрэгдэхгүй байна.", options: answersScale },
  { id: 16, domain: "state", question: "Би сэтгэл хангалуун байна.", options: answersScale },
  { id: 17, domain: "state", question: "Би сэтгэл зовж байна.", options: reverseScale },
  { id: 18, domain: "state", question: "Би хэтэрхий хөөрчихөөд биеэ барьж чадахааргүй байна.", options: reverseScale },
  { id: 19, domain: "state", question: "Би баяр хөөртэй байна.", options: answersScale },
  { id: 20, domain: "state", question: "Надад таатай байна.", options: answersScale },

  // TRAIT (20)
  { id: 21, domain: "trait", question: "Миний сэтгэл санаа өөдрөг байна.", options: answersScale },
  { id: 22, domain: "trait", question: "Би ууртай байх тохиолдол байдаг.", options: reverseScale },
  { id: 23, domain: "trait", question: "Би амархан уурладаг.", options: reverseScale },
  { id: 24, domain: "trait", question: "Би бусдын адил азтай байхыг хүсдэг.", options: reverseScale },
  { id: 25, domain: "trait", question: "Таагүй явдалд их зовж удаан мартдаг.", options: reverseScale },
  { id: 26, domain: "trait", question: 'Надад "бяр амтагдан" ажиллах хүсэл төрдөг.', options: answersScale },
  { id: 27, domain: "trait", question: "Би тайван, хүйтэндүү, биеэ барьж чаддаг хүн.", options: answersScale },
  { id: 28, domain: "trait", question: "Учирч болзошгүй бэрхшээл миний сэтгэлийг зовоодог.", options: reverseScale },
  { id: 29, domain: "trait", question: "Би яльгүй юманд сэтгэл ихэд зовдог.", options: reverseScale },
  { id: 30, domain: "trait", question: "Ихээхэн аз жаргалтай байх тохиолдлууд байдаг.", options: answersScale },
  { id: 31, domain: "trait", question: "Би бүхнийг чин сэтгэлээсээ хүлээн авдаг.", options: reverseScale },
  { id: 32, domain: "trait", question: "Өөртөө итгэх итгэл надад дутмаг байдаг.", options: reverseScale },
  { id: 33, domain: "trait", question: "Би хамгаалалтгүй юм шиг санагддаг.", options: reverseScale },
  { id: 34, domain: "trait", question: "Би төвөгтэй ээдрээтэй байдлаас зайлсхийхийг хичээдэг.", options: reverseScale },
  { id: 35, domain: "trait", question: "Надад шаналах сэтгэл төрдөг.", options: reverseScale },
  { id: 36, domain: "trait", question: "Би сэтгэл хангалуун байдаг.", options: answersScale },
  { id: 37, domain: "trait", question: "Ялихгүй зүйлс анхаарлыг сарниулж сэтгэл зовоодог.", options: reverseScale },
  { id: 38, domain: "trait", question: "Өөрийгөө азгүй хүн гэж бодох тохиолдол гардаг.", options: reverseScale },
  { id: 39, domain: "trait", question: "Би тайван тэнцвэртэй хүн.", options: answersScale },
  { id: 40, domain: "trait", question: "Ажил төрөл, үүргээ бодоход сэтгэл тавгүйрхдэг.", options: reverseScale },
];

export interface AnxietyScores {
  stateTotal: number;
  stateMean: number;
  traitTotal: number;
  traitMean: number;
}

export const calculateAnxietyScores = (answers: {
  [questionId: number]: string;
}): AnxietyScores => {
  let state = 0;
  let trait = 0;
  AnxietyQuestions.forEach((q) => {
    const a = answers[q.id];
    if (a) {
      const n = parseInt(a, 10);
      if (!isNaN(n)) {
        if (q.domain === "state") state += n;
        else trait += n;
      }
    }
  });
  return {
    stateTotal: state,
    stateMean: state / 20,
    traitTotal: trait,
    traitMean: trait / 20,
  };
};
