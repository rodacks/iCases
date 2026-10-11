import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Este diseño se nos escapó.</h1>
      <p>No encontramos la página que buscabas.</p>
      <Link className="button" href="/tienda">
        Volver a la tienda
      </Link>
    </div>
  );
}
