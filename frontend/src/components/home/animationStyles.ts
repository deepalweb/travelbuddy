export const homePageAnimationStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-80px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(80px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes message-in {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
  
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out both;
  }
  
  .animate-slide-in-left {
    animation: slide-in-left 1s ease-out both;
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 1s ease-out both;
  }
  
  .animate-message-in {
    animation: message-in 0.6s ease-out both;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 4s ease-in-out infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 6s ease-in-out infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .phone-tilt-container {
    perspective: 1000px;
  }
  
  .phone-tilt-container:hover > div {
    transform: rotateY(-5deg) rotateX(2deg) scale(1.02);
  }
`
