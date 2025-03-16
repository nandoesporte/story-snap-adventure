
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

/* Page turn effect */
@keyframes page-turn {
  0% {
    transform: rotateY(0deg);
    box-shadow: -5px 5px 5px rgba(0, 0, 0, 0.1);
  }
  100% {
    transform: rotateY(-180deg);
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.1);
  }
}

.page-turning {
  animation: page-turn 1s ease-in-out;
}

/* Floating animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* Book page corner curl effect */
.corner-curl {
  position: relative;
}

.corner-curl::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25px;
  height: 25px;
  background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%);
  border-radius: 0 0 0 10px;
  box-shadow: -2px -2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.corner-curl:hover::after {
  width: 35px;
  height: 35px;
}

/* Book texture */
.book-paper-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
}
`;
