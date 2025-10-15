export interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: string
  category: string
}

export const testQuestions: Question[] = [
  {
    id: 1,
    question: "What is the time complexity of binary search in a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correctAnswer: "O(log n)",
    category: "Algorithms",
  },
  {
    id: 2,
    question: "Which data structure uses LIFO (Last In, First Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: "Stack",
    category: "Data Structures",
  },
  {
    id: 3,
    question: "What does SQL stand for?",
    options: ["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"],
    correctAnswer: "Structured Query Language",
    category: "Databases",
  },
  {
    id: 4,
    question: "In object-oriented programming, what is encapsulation?",
    options: [
      "The ability to create multiple instances of a class",
      "The process of hiding internal implementation details",
      "The ability to inherit from multiple classes",
      "The process of converting code to machine language",
    ],
    correctAnswer: "The process of hiding internal implementation details",
    category: "OOP",
  },
  {
    id: 5,
    question: "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
    correctAnswer: "Merge Sort",
    category: "Algorithms",
  },
  {
    id: 6,
    question: "What is the purpose of a hash table?",
    options: [
      "To store data in a sorted manner",
      "To provide fast insertion, deletion, and lookup operations",
      "To implement recursive algorithms",
      "To manage memory allocation",
    ],
    correctAnswer: "To provide fast insertion, deletion, and lookup operations",
    category: "Data Structures",
  },
  {
    id: 7,
    question: "Which of the following is NOT a programming paradigm?",
    options: ["Object-Oriented", "Functional", "Procedural", "Algorithmic"],
    correctAnswer: "Algorithmic",
    category: "Programming",
  },
  {
    id: 8,
    question: "What is the main advantage of using a linked list over an array?",
    options: [
      "Faster random access to elements",
      "Better cache locality",
      "Dynamic size allocation",
      "Lower memory usage",
    ],
    correctAnswer: "Dynamic size allocation",
    category: "Data Structures",
  },
  {
    id: 9,
    question: "In a relational database, what is a foreign key?",
    options: [
      "A key that uniquely identifies each row in a table",
      "A key that references the primary key of another table",
      "A key used for encryption",
      "A key that allows null values",
    ],
    correctAnswer: "A key that references the primary key of another table",
    category: "Databases",
  },
  {
    id: 10,
    question: "What is the space complexity of the recursive Fibonacci algorithm?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
    correctAnswer: "O(n)",
    category: "Algorithms",
  },
  {
    id: 11,
    question: "Which HTTP method is idempotent?",
    options: ["POST", "PUT", "PATCH", "All of the above"],
    correctAnswer: "PUT",
    category: "Web Development",
  },
  {
    id: 12,
    question: "What is polymorphism in object-oriented programming?",
    options: [
      "The ability to create multiple constructors",
      "The ability of objects to take multiple forms",
      "The process of creating abstract classes",
      "The technique of method overloading",
    ],
    correctAnswer: "The ability of objects to take multiple forms",
    category: "OOP",
  },
  {
    id: 13,
    question: "Which of the following is a characteristic of a good hash function?",
    options: [
      "It should always return the same value",
      "It should distribute keys uniformly across the hash table",
      "It should be slow to compute",
      "It should only work with string inputs",
    ],
    correctAnswer: "It should distribute keys uniformly across the hash table",
    category: "Data Structures",
  },
  {
    id: 14,
    question: "What is the primary purpose of version control systems like Git?",
    options: [
      "To compile source code",
      "To track changes in files and coordinate work among multiple people",
      "To debug applications",
      "To optimize code performance",
    ],
    correctAnswer: "To track changes in files and coordinate work among multiple people",
    category: "Software Engineering",
  },
  {
    id: 15,
    question: "In Big O notation, what does O(1) represent?",
    options: [
      "Linear time complexity",
      "Logarithmic time complexity",
      "Constant time complexity",
      "Quadratic time complexity",
    ],
    correctAnswer: "Constant time complexity",
    category: "Algorithms",
  },
]
