"use client";

interface CardProps {
  /** Album primary key from the API (`id`, not legacy `albumId`). */
  id: number;
  albumTitle: string;
  albumDescription: string | null | undefined;
  imgURL: string | null | undefined;
  buttonText?: string;
  onClick: (id: number, uri: string) => void;
}

export default function Card({
  id,
  albumTitle,
  albumDescription,
  imgURL,
  buttonText,
  onClick,
}: CardProps) {
  const handleButtonClick = (uri: string) => {
    onClick(id, uri);
  };

  return (
    <div className="card" style={{ width: "18rem" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote album art URLs */}
      <img src={imgURL ?? ""} className="card-img-top" alt={albumTitle} />
      <div className="card-body">
        <h5 className="card-title">{albumTitle}</h5>
        <p className="card-text">{albumDescription}</p>
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={() => handleButtonClick("/show/")}
        >
          {buttonText ?? "View"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleButtonClick("/edit/")}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
