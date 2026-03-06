import Lottie from "lottie-react";
import animationData from "../../assests/authanimation.json";

function AnimatedBackground() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-black ml-5">
      <div className="w-[95%] h-[92vh] overflow-hidden bg-black rounded-xl relative">
        <Lottie
          animationData={animationData}
          loop
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  );
}

export default AnimatedBackground;