import { FC } from "react";

interface AuctionCardProps {
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  onButtonClick: () => void;
}

const AuctionCard: FC<AuctionCardProps> = ({ title, description, imageUrl, buttonText, onButtonClick }) => {
  return (
    <div className="card bg-base-100 w-72 shadow-xl">
      <figure>
        <img
          src={imageUrl}
          alt={title}
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p>{description}</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={onButtonClick}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
