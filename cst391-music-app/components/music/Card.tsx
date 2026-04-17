"use client";

interface CardProps {
  /** Album primary key from the API (`id`, not legacy `albumId`). */
  id: number;
  albumTitle: string;
  albumDescription: string | null | undefined;
  coverImage: string | null | undefined;
  buttonText?: string;
  onClick: (id: number, uri: string) => void;
}

export default function Card({
  id,
  albumTitle,
  albumDescription,
  coverImage,
  buttonText,
  onClick,
}: CardProps) {
  const handleButtonClick = (uri: string) => {
    onClick(id, uri);
  };

  return (
    <div className="card" style={{ width: "18rem" }}>
      {coverImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote album art URLs */}
          <img src={coverImage} className="card-img-top" alt={albumTitle} />
        </>
      ) : (
        <div
          className="card-img-top bg-light d-flex align-items-center justify-content-center text-muted"
          style={{ minHeight: 220 }}
          aria-hidden
        >
          No cover
        </div>
      )}
      <div className="card-body">
        <h5 className="card-title">{albumTitle}</h5>
        <p className="card-text">{albumDescription}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleButtonClick("/albums/")}
        >
          {buttonText ?? "View"}
        </button>
      </div>
    </div>
  );
}
