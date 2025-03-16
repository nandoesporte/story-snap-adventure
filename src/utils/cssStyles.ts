
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
  transform: rotateY(0deg);
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
@import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&family=Bubblegum+Sans&family=Patrick+Hand&family=Schoolbell&display=swap');

.font-comic {
  font-family: 'Comic Neue', cursive;
}

.font-bubblegum {
  font-family: 'Bubblegum Sans', cursive;
}

.font-patrick {
  font-family: 'Patrick Hand', cursive;
}

.font-schoolbell {
  font-family: 'Schoolbell', cursive;
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

/* Book paper texture */
.book-paper-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
}

/* Doodle Pattern Backgrounds */
.bg-doodle-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.bg-stars-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ctitle%3Estars%3C/title%3E%3Cg fill='%23FFD700' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M12 18l-4 2 1-4.75L5 11.5l5-.5L12 7l2 4 5 .5-4 3.75L16 20z'/%3E%3C/g%3E%3C/svg%3E");
}

/* Rainbow gradient border */
.rainbow-border {
  position: relative;
}

.rainbow-border::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #ff0000, #ff9900, #ffff00, #33cc33, #3399ff, #cc33ff);
  border-radius: inherit;
  z-index: -1;
  animation: rainbow-border-animation 3s linear infinite;
}

@keyframes rainbow-border-animation {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

/* Childish handwriting underline */
.childish-underline {
  position: relative;
  display: inline-block;
}

.childish-underline::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 4px;
  background: url("data:image/svg+xml,%3Csvg width='100' height='8' viewBox='0 0 100 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,5 C15,2 35,8 50,5 C65,2 85,8 100,5 L100,8 L0,8 Z' fill='%23ff9900'/%3E%3C/svg%3E") repeat-x;
  background-size: 100px 8px;
}

/* Cloud shapes */
.cloud-shape {
  position: relative;
  background: white;
  border-radius: 50%;
}

.cloud-shape::before,
.cloud-shape::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
}

.cloud-shape::before {
  width: 60%;
  height: 80%;
  top: -30%;
  left: 10%;
}

.cloud-shape::after {
  width: 70%;
  height: 70%;
  top: -20%;
  right: 10%;
}

/* Cute book decorations */
.border-dots {
  border: 3px dotted;
}

.border-scalloped {
  position: relative;
}

.border-scalloped::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top left, transparent 15px, currentColor 0) top left,
              radial-gradient(circle at top right, transparent 15px, currentColor 0) top right,
              radial-gradient(circle at bottom right, transparent 15px, currentColor 0) bottom right,
              radial-gradient(circle at bottom left, transparent 15px, currentColor 0) bottom left;
  background-size: 50% 50%;
  background-repeat: no-repeat;
  pointer-events: none;
}

/* Fun page numbers */
.fun-page-number {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFD166;
  border-radius: 50%;
  font-weight: bold;
  color: #5a4b3e;
  border: 2px dashed #5a4b3e;
  transform: rotate(-5deg);
  box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
}
`;

