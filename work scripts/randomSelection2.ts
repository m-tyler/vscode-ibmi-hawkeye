function getRandomElements<T>(arr: T[], numElements: number): T[] {
  // Handle edge cases: if numElements is greater than array length or negative
  if (numElements > arr.length || numElements < 0) {
    throw new RangeError("Number of elements to select is invalid.");
  }

  // Create a shallow copy of the array to avoid modifying the original
  const shuffledArr = [...arr];
  const result: T[] = [];
  let currentIndex = shuffledArr.length;
  let randomIndex: number;

  // While there are elements to select
  while (numElements > 0) {
    // Pick a remaining element
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--; // Decrement currentIndex as we "remove" an element

    // Swap the current element with the random element and add to result
    const temp = shuffledArr[currentIndex];
    shuffledArr[currentIndex] = shuffledArr[randomIndex];
    shuffledArr[randomIndex] = temp;

    result.push(shuffledArr[currentIndex]); // Add the "removed" element to the result
    numElements--; // Decrement the count of elements to select
  }

  return result;
}

// Example usage:
const originalArray: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // Array from 1 to 100
const selectedElements: number[] = getRandomElements(originalArray, 45);

console.log(selectedElements);
console.log(selectedElements.length); // Should be 45