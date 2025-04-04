
export const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
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

/* 3D Page Turn Effect */
.rotate-y-180 {
  transform: rotateY(180deg);
}

.rotate-y-neg15 {
  transform: rotateY(-15deg);
}

.rotate-y-15 {
  transform: rotateY(15deg);
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

/* Enhanced Page Turn Effect with 3D */
@keyframes page-turn-3d {
  0% {
    transform: rotateY(0deg);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: rotateY(-90deg);
    box-shadow: 25px 5px 10px rgba(0, 0, 0, 0.05);
  }
  100% {
    transform: rotateY(-180deg);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
}

.page-turning-3d {
  animation: page-turn-3d 1s ease-in-out;
  transform-style: preserve-3d;
  backface-visibility: hidden;
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

/* Character bounce animation */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0) rotate(-3deg);
  }
  50% {
    transform: translateY(-20px) rotate(3deg);
  }
}

.animate-bounce-character {
  animation: bounce 2s ease-in-out infinite;
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
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%);
  border-radius: 0 0 0 10px;
  box-shadow: -2px -2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.corner-curl:hover::after {
  width: 40px;
  height: 40px;
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

/* Additional children's book styling */
.book-page {
  position: relative;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  overflow: hidden;
}

.book-page::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05));
}

/* Fun page number styling */
.fun-page-number {
  position: relative;
  width: 50px;
  height: 50px;
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

/* Children's book cover styles */
.childbook-cover {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.2),
    0 8px 10px rgba(0, 0, 0, 0.1);
}

.childbook-cover::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23FFFFFF' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.5;
}

.childbook-title {
  font-family: 'Bubblegum Sans', cursive;
  color: white;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
  font-size: 2.75rem;
  text-align: center;
  padding: 20px;
  position: relative;
  z-index: 10;
}

.childbook-author {
  font-family: 'Comic Neue', cursive;
  color: white;
  text-align: center;
  font-size: 1.4rem;
  padding: 10px;
  position: relative;
  z-index: 10;
}

.childbook-illustration {
  padding: 20px;
  text-align: center;
  position: relative;
  z-index: 10;
}

.childbook-illustration img {
  max-width: 85%;
  border-radius: 12px;
  border: 6px solid white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.childbook-illustration img:hover {
  transform: scale(1.02);
}

/* Book pages style */
.book-page-content {
  font-family: 'Patrick Hand', cursive;
  font-size: 1.4rem;
  line-height: 1.7;
  color: #333;
  padding: 25px;
  position: relative;
}

.book-illustration {
  text-align: center;
  margin: 25px 0;
  transition: transform 0.3s ease;
}

.book-illustration:hover {
  transform: scale(1.02);
}

.book-illustration img {
  max-width: 92%;
  border-radius: 12px;
  border: 6px solid white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* Book page number */
.book-page-number {
  position: absolute;
  bottom: 15px;
  right: 25px;
  font-family: 'Schoolbell', cursive;
  font-size: 1.75rem;
  color: #666;
}

/* Colorful decorative elements */
.childbook-decoration {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  opacity: 0.6;
  z-index: 0;
}

.decoration-1 {
  background-color: #FF9A8B;
  top: 10%;
  left: 10%;
}

.decoration-2 {
  background-color: #FFD8CB;
  bottom: 15%;
  right: 15%;
  width: 80px;
  height: 80px;
}

.decoration-3 {
  background-color: #A5FFD6;
  bottom: 20%;
  left: 20%;
  width: 50px;
  height: 50px;
}

.decoration-4 {
  background-color: #FFC3A0;
  top: 20%;
  right: 10%;
  width: 70px;
  height: 70px;
}

/* Day/Night reading mode */
.night-mode {
  background-color: #252836 !important;
  color: #e1e1e6 !important;
}

.night-mode .book-page {
  background-color: #2e3142 !important;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3) !important;
}

.night-mode .book-page-content {
  color: #e1e1e6 !important;
}

.night-mode .book-illustration img {
  border-color: #404352 !important;
}
`;
