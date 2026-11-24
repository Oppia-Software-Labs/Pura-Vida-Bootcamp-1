# Code Language Conventions

This governs the language used in code itself: identifiers, and the strings a piece of code produces at runtime, error messages above all, regardless of what language the team communicates in day to day.


## English in code, including error messages

- Every identifier is written in English.
- Every string a class or function throws, returns as an error or logs is written in English. An English class name does not make a non-English thrown string acceptable.


## Exception: visible UI copy

- The text a user reads on screen (labels, buttons, previews, notices) is Spanish, because the product's interface is Spanish-only.
- An error shown to the user is produced in two steps: the code throws or returns an English error, and the UI layer maps it to Spanish copy. The Spanish never lives inside the thrown error.


## Non-goals

- Says nothing about comments in conversation, commit messages or any artifact outside the code itself.
