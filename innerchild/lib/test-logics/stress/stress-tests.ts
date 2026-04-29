export interface StressQuestion {
  id: number;
  question: string;
  options: { key: string; value: string }[];
}

export const StressQuestions: StressQuestion[] = [
  { id: 1, question: "Надад нойрны асуудал байна.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 2, question: "Би тайвширч, амарч чадахгүй байна.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 3, question: "Ямар нэгэн зүйл минийхээр болохгүй бол уур хүрдэг.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 4, question: "Анхаарлаа төвлөрүүлэхэд хэцүү болсон.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 5, question: "Сонирхолтой, таатай зүйлс хийх цаг надад байхгүй.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 6, question: "Бүх л өдрийн турш би ядарсан байдалтай байдаг.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 7, question: "Маш олон зүйлд санаа минь зовдог.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 8, question: "Маш их хичээл зүтгэл гаргадагаас болж эрүүл мэндэд асуудал тулгарсан.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 9, question: "Стрессээ даван туулахын тулд архи, тамхи, кофе хэрэглэдэг.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 10, question: "Инээж баярлах маань багасч байна.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 11, question: "Ихэнхидээ уйтгартай таагүй байдаг болсон.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 12, question: "Би бүх зүйлийг хяналтандаа байлгах дуртай.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 13, question: "Надад хангалттай цаг байхгүй.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
  { id: 14, question: "Би хуруугаа товшиж, гараа атгаж, хурууны үеэ дуугаргаж, үсээ эргүүлдэг зуршилтай болсон.", options: [{ key: "1", value: "Хэзээ ч үгүй" }, { key: "2", value: "Заримдаа" }, { key: "3", value: "Ихэнхдээ" }, { key: "4", value: "Үргэлж" }] },
];

export interface StressScore {
  totalScore: number;
}

export const calculateStressScore = (answers: {
  [questionId: number]: string;
}): StressScore => {
  let totalScore = 0;
  Object.values(answers).forEach((answer) => {
    const score = parseInt(answer);
    if (!isNaN(score)) totalScore += score;
  });
  return { totalScore };
};
