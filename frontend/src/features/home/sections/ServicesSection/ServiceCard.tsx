import "./ServiceCard.css";

interface ServiceCardProps {
  label: string;
  description: string;
  image: string;
}

// Display-only card: picture, service name below it, description below that.
export default function ServiceCard({
  label,
  description,
  image,
}: ServiceCardProps) {
  return (
    <div className="service-card">
      <div className="service-card__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={label}
          draggable={false}
          className="service-card__img"
        />
      </div>
      <div className="service-card__name">{label}</div>
      <p className="service-card__desc">{description}</p>
    </div>
  );
}