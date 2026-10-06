export type Category = "drink" | "salad" | "starter" | "main";

/** Only for the little icon on a row; a wrong guess is harmless. */
export function categoryOf(name: string): Category {
  const n = name.toLowerCase();
  if (/salad|raita|slaw/.test(n)) return "salad";
  if (/mojito|mocktail|cocktail|long island|margarita|sangria|beer|wine|whisk|vodka|\brum\b|\bgin\b|lassi|chaas|juice|soda|cola|coke|water|shake|coffee|\btea\b|chai|latte|lemonade|cooler|cucumber mint|smoothie/.test(n)) return "drink";
  if (/satay|tikka|kebab|kabab|starter|fries|nachos|momo|wings|soup|pakora|65|manchurian|spring roll|bruschetta|dip/.test(n)) return "starter";
  return "main";
}
