
export const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

/* Book styles */
.perspective {
  perspective: 1500px;
}

.book-spread {
  display: flex;
  align-items: center;
  gap: 0;
}

.book-left-page, .book-right-page {
  transition: all 0.5s ease;
  transform-style: preserve-3d;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.book-left-page {
  transform-origin: right center;
}

.book-right-page {
  transform-origin: left center;
}

.rotate-y-180 {
  transform: rotateY(0deg); /* Reset transform since we're using actual DOM elements side by side */
}

@media (max-width: 768px) {
  .book-spread {
    flex-direction: column;
  }
  
  .book-left-page, .book-right-page {
    max-width: 100% !important;
  }
}

/* Font styles for storybook look */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Comic+Neue:wght@300;400;700&display=swap');

.font-playfair {
  font-family: 'Playfair Display', serif;
}

.font-comic {
  font-family: 'Comic Neue', cursive;
}
`;
