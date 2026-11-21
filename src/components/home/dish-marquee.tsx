const dishes = [
  "Sweet plantain",
  "Fried rice",
  "Egusi stew",
  "Grilled chicken",
  "Peppered fish",
  "Party jollof",
  "Pounded yam",
  "Zobo",
]

export function DishMarquee() {
  const loop = [...dishes, ...dishes]
  return (
    <div className="marquee border-y border-gold/40 bg-gold text-ink" aria-hidden="true">
      <div className="marquee-track items-center py-3">
        {loop.map((dish, index) => (
          <span key={`${dish}-${index}`} className="mx-3 flex items-center gap-3 font-heading text-xl whitespace-nowrap sm:text-2xl">
            {dish}
            <span className="text-tomato">●</span>
          </span>
        ))}
      </div>
    </div>
  )
}
