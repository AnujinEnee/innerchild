"use client";

const partners = [
  { name: "Octolearn", logo: "/01.jpg" },
  { name: "As one Mongolia", logo: "/02.jpg" },
  { name: "Helios", logo: "/03.jpg" },
  { name: "Хаан хүнс ", logo: "/04.jpg" },
  { name: "Dentaris dental clinic ", logo: "/05.jpg" },
  { name: "Голомт консалтинг хуулийн фирм", logo: "/06.jpg" },
  { name: "Tumedu", logo: "/07.jpg" },
  { name: "Expontmind", logo: "/08.jpg" },
];

export default function Hamtragch() {
  return (
    <section
      className="relative overflow-hidden py-9"
      style={{
        background:
          "linear-gradient(135deg, #fff 30%, #f5c67a 60%, #e8943a 80%, #f0a040 100%)",
      }}
    >
      <p className="mb-6 text-center text-sm font-bold uppercase tracking-wider text-zinc-800 sm:mb-10 sm:text-base">
        Манай хамтрагч байгууллагууд
      </p>

      <div className="relative">
        {/* Fade edges */}

        {/* Scrolling track */}
        <div className="flex items-start animate-scroll">
          {[...partners, ...partners].map((partner, i) => (
            <div
              key={i}
              className="flex shrink-0 flex-col items-center gap-4 px-6 sm:px-10"
            >
              <div className="h-16 w-16 overflow-hidden rounded-full bg-white shadow-sm sm:h-20 sm:w-20">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="max-w-24 text-center text-[10px] font-bold uppercase leading-tight text-zinc-800 sm:max-w-28 sm:text-xs">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
