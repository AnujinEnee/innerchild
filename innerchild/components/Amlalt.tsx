import Link from "next/link";

const commitments = [
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-[#f97316]"
      >
        <rect x="8" y="6" width="32" height="36" rx="3" />
        <circle cx="24" cy="18" r="5" />
        <path d="M15 34c0-5 4-9 9-9s9 4 9 9" />
        <line x1="32" y1="10" x2="36" y2="10" strokeWidth="2" />
        <line x1="34" y1="8" x2="34" y2="12" strokeWidth="2" />
      </svg>
    ),
    title: "Чанд нууцлал ба аюулгүй орон зай",
    description:
      "Таны бидэнтэй хуваалцсан бүх мэдээлэл, яриа хуулийн хүрээнд чанд нууцлагдах болно. Бид танд ямар ч айдас, эргэлзээгүйгээр өөрийгөө чөлөөтэй илэрхийлэх 100% аюулгүй, тав тухтай орчныг бүрдүүлж өгнө.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-[#f97316]"
      >
        <circle cx="24" cy="16" r="10" />
        <path d="M18 14l4 4 6-8" />
        <path d="M12 30h24" />
        <path d="M16 36h16" />
        <path d="M20 42h8" />
        <line x1="24" y1="26" x2="24" y2="30" />
      </svg>
    ),
    title: "Шинжлэх ухаанд суурилсан, мэргэжлийн үйлчилгээ",
    description:
      "Манай төв нь зөвхөн олон улсад хүлээн зөвшөөрөгдсөн, үр дүн нь нотлогдсон сэтгэл заслын аргуудыг ашиглана. Мөн магистр дээш зэргийн мэргэжлийн өндөр ур чадвартай сэтгэл зүйч, сэтгэл засалч тасралтгүй хөгжиж буй мэргэжлийн багаар танд үйлчилнэ.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-[#f97316]"
      >
        <path d="M24 42s-16-10-16-22a10 10 0 0 1 16-8 10 10 0 0 1 16 8c0 12-16 22-16 22z" />
        <circle cx="24" cy="22" r="4" />
      </svg>
    ),
    title: "Зөвхөн танд зориулсан ганцаарчилсан хандлага",
    description:
      "Хүн бүрийн туулж буй амьдрал, сэтгэл зүйн онцлог дахин давтагдашгүй байдаг. Тиймээс бид бэлэн загвар ашиглахгүй бөгөөд зөвхөн таны хэрэгцээ, зорилгод бүрэн нийцсэн сэтгэл зүйн зөвлөгөө, заслын төлөвлөгөөг хамтдаа гаргах болно.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-[#f97316]"
      >
        <rect x="10" y="6" width="28" height="36" rx="3" />
        <line x1="16" y1="14" x2="32" y2="14" />
        <line x1="16" y1="20" x2="32" y2="20" />
        <line x1="16" y1="26" x2="28" y2="26" />
        <path d="M36 34a8 8 0 1 0-8 8" />
        <path d="M36 34v8h-8" />
      </svg>
    ),
    title: "Шинжлэх ухаанаар нотлогдсон, баримтаар хянагдсан нийтлэл",
    description:
      "Сэтгэл судлалын шинжлэх ухаан тасралтгүй хувьсан хөгжиж байдаг. Тиймээс бид өөрсдийн нийтлэл, мэдээллийн санг тогтмол хянаж, хамгийн сүүлийн үеийн судалгаа, эмчилгээний чиг хандлагад нийцүүлэн агуулгаа шинэчлэн редакторлож байх болно.",
  },
];

export default function Amlalt() {
  return (
    <section className="mx-6 my-4 rounded-2xl bg-[#1e1145] px-5 py-12 sm:mx-9 sm:my-6 sm:rounded-3xl sm:px-8 sm:py-24 md:mx-16 md:px-16 lg:mx-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-16">
          <p className="mb-2 text-[15px] font-bold tracking-[0.3em] text-[#f97316] sm:mb-3 sm:text-2xl">
            БИДНИЙ АМЛАЛТ
          </p>
          <h2 className="mx-auto mb-4 max-w-2xl text-lg font-semibold leading-relaxed text-white sm:mb-6 sm:text-2xl md:text-xl">
            Бид хувь хүн бүрд өөрийн дотоод хүүхдээ энэрч, өөрийгөө таньж
            мэдэхэд тань туслан, сэтгэл зүйн зөв боловсролоор дамжуулан
            сэтгэцийн эрүүл мэндийг тань хамгаална
          </h2>
          <Link
            href="/niitlel"
            className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 px-4 py-2 text-xs font-medium text-purple-200 transition-colors hover:bg-white/10 sm:px-6 sm:py-3 sm:text-sm"
          >
            БИДНИЙ ҮЙЛ ЯВЦЫН ТУХАЙ УНШИХ &rarr;
          </Link>
        </div>

        {/* Commitments grid */}
        <div className="grid gap-6 sm:gap-10 md:grid-cols-2">
          {commitments.map((item, i) => (
            <div key={i} className="flex gap-3 sm:gap-5">
              <div className="shrink-0 [&_svg]:h-8 [&_svg]:w-8 sm:[&_svg]:h-12 sm:[&_svg]:w-12">
                {item.icon}
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-white sm:mb-3 sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-purple-300/70 sm:text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
