/* eslint-disable @typescript-eslint/no-empty-function */
import { FC } from "react";

interface HeroProps {
  title?: string;
  description?: string;
  buttonText?: string;
  subtitle?: string;
  backgroundImage?: string;
  onButtonClick?: () => void;
}

const Hero: FC<HeroProps> = ({
  title = "Hello there",
  description = "Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.",
  buttonText = "Get Started",
  subtitle = "Where Privacy Meets Transparency in Auctions",
  onButtonClick = () => {},
}) => {
  return (
    <div className="hero bg-base-200 p-8 lg:p-24">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">{title}</h1>
          <h2 className="text-xl font-bold">{subtitle}</h2>
          <p className="py-6">{description}</p>
          <button className="btn btn-primary" onClick={onButtonClick}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
