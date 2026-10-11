import { materials } from '@/lib/catalog';
export default function Page() {
  return (
    <article className="info-page section-width page-space">
      <div className="eyebrow">TODO LO QUE NECESITÁS SABER</div>
      <h1 className="page-title">Los detalles importan.</h1>
      <section id="envios">
        <h2>Envíos y entregas</h2>
        <p>
          iCases es una demostración local. Podés crear un pedido y consultar su resumen, pero no se
          procesan pagos ni se despachan productos. El costo de envío mostrado en esta demo es cero.
        </p>
      </section>
      <section id="materiales">
        <h2>Materiales y cuidados</h2>
        {materials.map((m) => (
          <div key={m.id}>
            <h3>{m.name}</h3>
            <p>{m.description}</p>
          </div>
        ))}
        <p>
          Para cuidar una funda, usá un paño suave apenas húmedo. Evitá solventes, abrasivos y calor
          intenso. Las representaciones de materiales y medidas de este MVP son ilustrativas; no
          constituyen especificaciones de fabricación.
        </p>
      </section>
      <section id="preguntas">
        <h2>Preguntas frecuentes</h2>
        {[
          [
            '¿Cómo sé cuál es mi modelo?',
            'En tu iPhone abrí Ajustes → General → Información y buscá el nombre del modelo.',
          ],
          [
            '¿Puedo guardar un diseño para después?',
            'Sí. El editor conserva un borrador en tu navegador. Guardar diseño crea una copia en el servidor y un enlace para recuperarla desde el mismo navegador. Al agregar al carrito se guarda otra copia independiente.',
          ],
          [
            '¿Dónde quedan mis fotos?',
            'Los archivos se guardan en el servidor local. No se utilizan rutas del dispositivo ni servicios externos.',
          ],
          [
            '¿El PNG sirve para fabricar la funda?',
            'Es una composición de referencia. Antes de fabricar hay que calibrar dimensiones, sangrado, resolución y perfiles de impresión para cada modelo.',
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section id="privacidad">
        <h2>Privacidad en esta demo</h2>
        <p>
          El carrito y el borrador se almacenan en tu navegador. Las imágenes, los diseños guardados
          y los pedidos se almacenan en la base de datos y el disco del servidor local. Una cookie
          técnica identifica tus diseños, sin crear una cuenta.
        </p>
        <p>
          Los enlaces de pedidos y archivos usan identificadores aleatorios. Tratá esos enlaces como
          privados: quien los tenga puede acceder a su contenido. No se incluyen datos de contacto
          en la página pública de resumen. Usá datos ficticios al probar; no ingreses datos
          bancarios.
        </p>
        <p>
          El administrador del entorno local puede eliminar los datos deteniendo la aplicación y
          retirando la base SQLite y la carpeta de archivos, según las instrucciones del README.
          Esta demo no tiene un servicio comercial de atención al cliente.
        </p>
      </section>
    </article>
  );
}
