'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Algo no salió como esperábamos.</h1>
      <p>Revisá que la base de datos esté inicializada e intentá nuevamente.</p>
      <button className="button" onClick={reset}>
        Volver a intentar
      </button>
    </div>
  );
}
