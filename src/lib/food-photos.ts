export type FoodPhoto = {
  src: string
  alt: string
  label: string
  credit: string
  href: string
  focus?: string
}

export const jollof: FoodPhoto = {
  src: "/images/jollof.jpg",
  alt: "Party jollof rice with grilled chicken skewers and fried fish",
  label: "Party jollof",
  credit: "Keesha's Kitchen",
  href: "https://www.pexels.com/photo/rice-with-fish-and-vegetables-on-a-serving-dish-13915043/",
}

export const friedRice: FoodPhoto = {
  src: "/images/jollof-platter.jpg",
  alt: "Fried rice and peppered chicken on a table in Abuja",
  label: "Fried rice",
  credit: "Harrun Muhammad",
  href: "https://www.pexels.com/photo/jollof-rice-and-chicken-meal-in-abuja-cafe-setting-37538487/",
  focus: "center 62%",
}

export const egusi: FoodPhoto = {
  src: "/images/egusi.jpg",
  alt: "Egusi soup in a red bowl, finished with chilli and herbs",
  label: "Egusi stew",
  credit: "Tim Yisa",
  href: "https://www.pexels.com/photo/spicy-nigerian-egusi-soup-in-red-bowl-35490114/",
  focus: "center 32%",
}

export const plantain: FoodPhoto = {
  src: "/images/plantain.jpg",
  alt: "Hands holding a bowl of sweet fried plantain",
  label: "Sweet plantain",
  credit: "PICHA",
  href: "https://www.pexels.com/photo/fried-plantains-and-corn-6210449/",
}

export const yamAndEgg: FoodPhoto = {
  src: "/images/yam-egg.jpg",
  alt: "Boiled yam with Nigerian egg sauce, eaten by a window",
  label: "Yam & egg",
  credit: "mk_photoz",
  href: "https://www.pexels.com/photo/nigerian-breakfast-with-yam-and-egg-dish-32634871/",
}

export const grilledFish: FoodPhoto = {
  src: "/images/grilled-fish.jpg",
  alt: "Peppered fried fish with chilli on a plate",
  label: "Peppered fish",
  credit: "Teguh S",
  href: "https://www.pexels.com/photo/delicious-grilled-fish-with-fresh-herbs-37081043/",
}

export const grilledChicken: FoodPhoto = {
  src: "/images/grilled-chicken.jpg",
  alt: "Grilled chicken legs with charred skin and green chilli",
  label: "Grilled chicken",
  credit: "kandhi bharata",
  href: "https://www.pexels.com/photo/delicious-grilled-chicken-with-green-peppers-37062599/",
}

export const foodPhotos = [jollof, friedRice, egusi, plantain, yamAndEgg, grilledFish, grilledChicken]

export const programmePhotos: Record<string, FoodPhoto> = {
  "hillside-youth-camp": grilledChicken,
  "city-of-light-convention": friedRice,
  "harbour-watchnight": grilledFish,
  "kings-table-carol": yamAndEgg,
  "grace-women-of-faith": egusi,
}
