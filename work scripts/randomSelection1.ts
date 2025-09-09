function getRandomElements<T>(arr: T[], count: number): T[] {
  // Create a shallow copy of the array to avoid modifying the original
  const shuffledArray = [...arr];

  // Fisher-Yates (Knuth) shuffle algorithm
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  // Return the first 'count' elements
  return shuffledArray.slice(0, count);
}

// Example usage:
const originalArray: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // Array from 1 to 100
const numberOfElementsToSelect = 45;

const randomElements = getRandomElements(originalArray, numberOfElementsToSelect);
console.log(randomElements); // This will output an array of 45 unique random numbers from the original array