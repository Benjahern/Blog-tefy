import type { Book, ContentState, Genre, Review, Series, SiteSettings } from '@/types'

export const SEED_VERSION = 1

export const seedGenres: Genre[] = [
  { id: 'g_cf', name: 'Ciencia ficción', slug: 'ciencia-ficcion', description: 'Futuros posibles, desiertos lejanos y preguntas que todavía no sabemos responder.' },
  { id: 'g_fan', name: 'Fantasía', slug: 'fantasia', description: 'Magia, mapas antiguos y mundos que se sienten como volver a casa.' },
  { id: 'g_rom', name: 'Romance', slug: 'romance', description: 'Historias de amor lentas, torpes, valientes y profundamente humanas.' },
  { id: 'g_juv', name: 'Literatura juvenil', slug: 'literatura-juvenil', description: 'Crecer, elegir quién ser y descubrir que el mundo es más grande de lo que parecía.' },
  { id: 'g_mis', name: 'Misterio', slug: 'misterio', description: 'Pistas entre la niebla, secretos bien guardados y finales que obligan a releer.' },
  { id: 'g_gen', name: 'Literatura general', slug: 'literatura-general', description: 'Clásicos y novelas que no caben en una sola etiqueta.' },
]

export const seedSeries: Series[] = [
  { id: 's_dune', name: 'Crónicas de Dune', slug: 'cronicas-de-dune', description: 'La saga de Arrakis: política, ecología, religión y el peso de un destino que nadie pidió.' },
  { id: 's_hp', name: 'Harry Potter', slug: 'harry-potter', description: 'Siete años en Hogwarts. Una saga que acompañó a toda una generación de lectores.' },
  { id: 's_thg', name: 'Los juegos del hambre', slug: 'los-juegos-del-hambre', description: 'Panem, los distritos y una chica que se ofreció como tributo por amor a su hermana.' },
  { id: 's_kkc', name: 'Crónica del asesino de reyes', slug: 'cronica-del-asesino-de-reyes', description: 'La historia de Kvothe contada por él mismo, en una posada perdida al borde del mundo.' },
]

export const seedBooks: Book[] = [
  { id: 'b_dune', title: 'Dune', author: 'Frank Herbert', genreIds: ['g_cf'], seriesId: 's_dune', seriesOrder: 1, synopsis: 'Paul Atreides llega con su familia al planeta desértico Arrakis, única fuente de la especia más valiosa del universo. Entre traiciones, profecías y gusanos de arena colosales, deberá descubrir quién es realmente.' },
  { id: 'b_hp1', title: 'Harry Potter y la piedra filosofal', author: 'J. K. Rowling', genreIds: ['g_fan', 'g_juv'], seriesId: 's_hp', seriesOrder: 1, synopsis: 'Un niño que vive bajo una escalera descubre, el día de su undécimo cumpleaños, que es un mago y que tiene un lugar esperándolo en el Colegio Hogwarts de Magia y Hechicería.' },
  { id: 'b_hp2', title: 'Harry Potter y la cámara secreta', author: 'J. K. Rowling', genreIds: ['g_fan', 'g_juv'], seriesId: 's_hp', seriesOrder: 2, synopsis: 'En su segundo año en Hogwarts, mensajes escritos en las paredes y alumnos petrificados anuncian que la legendaria Cámara de los Secretos ha sido abierta.' },
  { id: 'b_thg1', title: 'Los juegos del hambre', author: 'Suzanne Collins', genreIds: ['g_juv', 'g_cf'], seriesId: 's_thg', seriesOrder: 1, synopsis: 'En Panem, cada año doce chicos y doce chicas son enviados a una arena televisada de la que solo uno puede salir con vida. Katniss Everdeen se ofrece voluntaria para salvar a su hermana.' },
  { id: 'b_thg2', title: 'En llamas', author: 'Suzanne Collins', genreIds: ['g_juv', 'g_cf'], seriesId: 's_thg', seriesOrder: 2, synopsis: 'Tras sobrevivir a los juegos, Katniss descubre que su gesto de desafío ha encendido algo en los distritos que el Capitolio no está dispuesto a tolerar.' },
  { id: 'b_pyp', title: 'Orgullo y prejuicio', author: 'Jane Austen', genreIds: ['g_rom', 'g_gen'], synopsis: 'Elizabeth Bennet, ingeniosa y orgullosa, y el señor Darcy, reservado y altivo, se juzgan mal desde el primer baile. Una comedia de costumbres sobre las primeras impresiones.' },
  { id: 'b_mar', title: 'Lo que el mar nos dejó', author: 'Antonia Ríos (autora ficticia)', genreIds: ['g_rom', 'g_juv'], synopsis: 'Novela de ejemplo: un verano en un pueblo costero del sur de Chile, dos adolescentes que no deberían haberse conocido y una carta que llega con diez años de retraso.' },
  { id: 'b_kkc1', title: 'El nombre del viento', author: 'Patrick Rothfuss', genreIds: ['g_fan'], seriesId: 's_kkc', seriesOrder: 1, synopsis: 'Kvothe, ahora un posadero discreto, acepta contar la verdadera historia de su vida: la compañía de artistas, la Universidad y la búsqueda de los Chandrian.' },
  { id: 'b_orient', title: 'Asesinato en el Orient Express', author: 'Agatha Christie', genreIds: ['g_mis', 'g_gen'], synopsis: 'Un tren detenido por la nieve, un pasajero asesinado y doce sospechosos. Hércules Poirot tiene una sola noche para encontrar la verdad.' },
  { id: 'b_cien', title: 'Cien años de soledad', author: 'Gabriel García Márquez', genreIds: ['g_gen'], synopsis: 'La historia de siete generaciones de la familia Buendía en el pueblo de Macondo, donde lo maravilloso es parte de la vida cotidiana.' },
]

const d = (s: string) => new Date(s).toISOString()

export const seedReviews: Review[] = [
  {
    id: 'r_dune', bookId: 'b_dune', slug: 'dune', title: 'La arena también recuerda', rating: 4.8, status: 'published', featured: true,
    createdAt: d('2026-10-18T21:00:00'), updatedAt: d('2026-10-20T22:10:00'), publishedAt: d('2026-10-20T22:10:00'),
    excerpt: 'Dune no se lee: se habita. Es un libro lento, denso y a ratos abrumador, pero cuando por fin entiendes el ritmo del desierto, ya no quieres salir de Arrakis.',
    closingThought: 'Un libro para leer sin prisa, con una libreta al lado y el corazón dispuesto a perderse en la arena.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>Llegué a Dune con miedo. Me habían dicho que era difícil, que las primeras cien páginas eran un muro de nombres, casas nobles y palabras inventadas. Y es verdad: durante un buen rato me sentí como Paul recién llegado a Arrakis, rodeada de gente que sabía cosas que yo no.</p>
<p>Pero hay un momento —para mí fue la primera noche en el desierto— en que el libro cambia de respiración. Deja de ser un tratado sobre política intergaláctica y se convierte en una historia sobre sobrevivir, sobre escuchar la tierra que pisas y sobre el precio de convertirte en lo que otros necesitan que seas.</p>
<h2>Un mundo que se siente vivo</h2>
<p>Lo que más me impresionó fue la ecología. Herbert no inventa un planeta de fondo: inventa un sistema completo. El agua es moneda, religión y memoria. Los Fremen guardan cada gota como si fuera un recuerdo, y después de unos capítulos yo también empecé a mirar distinto mi vaso de agua en el velador.</p>
<blockquote>No conoceré el miedo. El miedo mata la mente.</blockquote>
<p>Esa letanía me acompañó toda la semana. Es curioso cómo una frase escrita en los sesenta puede sonar tan exacta un martes cualquiera en Santiago.</p>
<h2>Los personajes</h2>
<p>Lady Jessica es, sin duda, mi favorita. Dividida entre su lealtad a la Bene Gesserit y el amor por su hijo, es el personaje más humano de todo el libro. Paul, en cambio, me resultó fascinante y un poco inquietante: nunca sabes si estás leyendo el nacimiento de un héroe o el de algo mucho más peligroso.</p>
<div data-spoiler="true"><p>La escena en que Paul bebe el Agua de Vida y ve todos los futuros posibles me dejó helada. Entendí que el libro no celebra al mesías: te advierte sobre él.</p></div>
<h3>Lo que me costó</h3>
<ul><li>Los apéndices y el glosario son casi obligatorios al principio.</li><li>Algunos diálogos internos se repiten demasiado.</li><li>El final llega de golpe, casi sin aire.</li></ul>
<p>Aun así, cerré el libro con esa sensación rara de haber vuelto de un viaje largo. Le doy casi la puntuación completa solo porque sé que la próxima vez lo voy a disfrutar todavía más.</p>`,
  },
  {
    id: 'r_hp1', bookId: 'b_hp1', slug: 'harry-potter-y-la-piedra-filosofal', title: 'Volver a recibir la carta', rating: 4.5, status: 'published', featured: true,
    createdAt: d('2026-10-05T19:00:00'), updatedAt: d('2026-10-06T20:00:00'), publishedAt: d('2026-10-06T20:00:00'),
    excerpt: 'Releerlo de adulta fue como encontrar una carta que me escribí hace años. La magia sigue ahí, pero ahora también veo la soledad de un niño debajo de la escalera.',
    closingThought: 'Perfecto para una tarde de lluvia y una taza de té. O para recordarle a alguien que nunca es tarde para recibir su carta.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>Hay libros que no se releen: se visitan. Volví a la piedra filosofal en una semana gris, buscando refugio, y lo encontré casi intacto.</p>
<p>De niña me enamoré del Gran Comedor, de las escaleras que cambian de lugar y de las ranas de chocolate. Esta vez me detuve en otras cosas: en lo poco que Harry pide, en cómo agradece un suéter tejido, en lo enorme que puede ser un primer amigo.</p>
<blockquote>No es bueno dejarse llevar por los sueños y olvidarse de vivir.</blockquote>
<h2>Lo que sigue funcionando</h2>
<p>El ritmo es impecable. Cada capítulo abre una puerta nueva, y la autora sabe exactamente cuándo darte una sorpresa y cuándo dejarte respirar. El trío protagonista se forma de manera natural, con peleas, malentendidos y una aventura con un trol que todavía me hace reír.</p>
<div data-spoiler="true"><p>La revelación de que Quirrell, y no Snape, era quien buscaba la piedra me sorprendió de niña y me sigue pareciendo un giro elegante: todas las pistas estaban ahí.</p></div>
<p>Le quito medio picaflor porque algunas cosas se sienten menos cuidadas leídas hoy, pero como puerta de entrada a la lectura, pocas son tan luminosas.</p>`,
  },
  {
    id: 'r_hp2', bookId: 'b_hp2', slug: 'harry-potter-y-la-camara-secreta', rating: 3.7, status: 'published', featured: false,
    createdAt: d('2026-09-22T18:00:00'), updatedAt: d('2026-09-23T18:30:00'), publishedAt: d('2026-09-23T18:30:00'),
    excerpt: 'Más oscuro que el primero y con un misterio entretenido, aunque la mitad del libro avanza a pasos cortos. Dobby, eso sí, me robó el corazón.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>La cámara secreta siempre fue, para mí, el libro "del medio" de los primeros años. Lo disfruté, pero con menos asombro que el primero.</p>
<p>El misterio de las paredes escritas y los alumnos petrificados está bien construido, y me gustó que el libro empiece a hablar de prejuicios dentro del mundo mágico. Es la primera vez que la saga se pone seria.</p>
<p>Lo que me costó fue la parte central: muchas escenas de clase y pasillo que no suman tanto. Gilderoy Lockhart es divertido las primeras tres apariciones y luego se vuelve repetitivo.</p>
<div data-spoiler="true"><p>El diario de Tom Riddle es una de las ideas más inquietantes de toda la saga. Releerlo sabiendo lo que significa después le da otra capa.</p></div>
<p>Una lectura agradable, con un final que vale la pena.</p>`,
  },
  {
    id: 'r_thg1', bookId: 'b_thg1', slug: 'los-juegos-del-hambre', title: 'Una chispa en medio del ruido', rating: 4.6, status: 'published', featured: true,
    createdAt: d('2026-09-10T22:00:00'), updatedAt: d('2026-09-12T21:00:00'), publishedAt: d('2026-09-12T21:00:00'),
    excerpt: 'Lo leí en dos noches y con el estómago apretado. Katniss no es una heroína que quiera serlo, y por eso le creí todo.',
    closingThought: 'Para quienes buscan una distopía que no se olvida de que sus personajes tienen hambre, frío y miedo.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>Empecé este libro a las once de la noche "solo para ver de qué se trataba". Lo cerré a las tres de la mañana.</p>
<p>La voz de Katniss es seca, práctica, desconfiada. No pierde tiempo en describir vestidos si no le sirven para sobrevivir, y esa economía hace que cada momento de ternura —una canción, un pan, una flor— pese muchísimo.</p>
<h2>Lo que me hizo sentir</h2>
<p>Rabia, sobre todo. La crítica al espectáculo, a mirar el sufrimiento ajeno como entretenimiento, sigue siendo incómodamente actual. Y también una tristeza muy concreta por Rue.</p>
<div data-spoiler="true"><p>La muerte de Rue y el saludo de los tres dedos del Distrito 11 es una de las escenas que más me han conmovido en literatura juvenil.</p></div>
<h3>¿A quién se lo recomendaría?</h3>
<p>A cualquiera que piense que la literatura juvenil es "liviana". Este libro tiene más filo que muchas novelas para adultos.</p>`,
  },
  {
    id: 'r_thg2', bookId: 'b_thg2', slug: 'en-llamas', rating: 4.2, status: 'draft', featured: false,
    createdAt: d('2026-10-24T20:00:00'), updatedAt: d('2026-10-25T21:40:00'),
    excerpt: '',
    content: `<p>Borrador: todavía estoy ordenando las ideas. La segunda arena me pareció más ingeniosa que la primera, pero quiero hablar del Vasallaje y de Finnick…</p>`,
  },
  {
    id: 'r_pyp', bookId: 'b_pyp', slug: 'orgullo-y-prejuicio', title: 'Sobre las primeras impresiones', rating: 5.0, status: 'published', featured: true,
    createdAt: d('2026-08-28T17:00:00'), updatedAt: d('2026-08-30T19:00:00'), publishedAt: d('2026-08-30T19:00:00'),
    excerpt: 'Doscientos años después, Elizabeth Bennet sigue siendo la persona más ingeniosa de cualquier habitación. Un libro perfecto, y lo digo sin exagerar.',
    closingThought: 'Mi recomendación eterna: léelo en voz alta. Los diálogos de Austen fueron escritos para ser escuchados.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>No sé cuántas veces he leído Orgullo y prejuicio. Lo que sí sé es que cada vez encuentro una frase nueva que me hace reír sola en el metro.</p>
<p>Austen escribe con una ironía tan fina que es fácil pasarla por alto. Debajo de los bailes y las visitas hay una mirada muy lúcida sobre el dinero, el matrimonio y las pocas opciones que tenían las mujeres de su época.</p>
<blockquote>Podría perdonar fácilmente su orgullo, si él no hubiera mortificado el mío.</blockquote>
<h2>Elizabeth y Darcy</h2>
<p>Lo que me encanta de esta historia de amor es que ninguno de los dos cambia por el otro: cambian porque se dan cuenta de que estaban equivocados. Es un romance sobre aprender a mirar mejor.</p>
<p>Y los personajes secundarios son un regalo. La señora Bennet, el señor Collins, Lady Catherine: cada uno merece su propio libro.</p>
<div data-spoiler="true"><p>La carta de Darcy después de la primera declaración es, para mí, el verdadero centro de la novela. Ahí Elizabeth se lee a sí misma por primera vez.</p></div>
<p>Cinco picaflores completos. No hay otra opción.</p>`,
  },
  {
    id: 'r_mar', bookId: 'b_mar', slug: 'lo-que-el-mar-nos-dejo', rating: 4.2, status: 'published', featured: false,
    createdAt: d('2026-10-12T20:30:00'), updatedAt: d('2026-10-13T21:00:00'), publishedAt: d('2026-10-13T21:00:00'),
    excerpt: 'Un romance juvenil que huele a sal, a leña mojada y a veranos que parecían eternos. Dulce sin ser empalagoso.',
    content: `<p><em>Libro y reseña ficticios, creados como contenido de demostración.</em></p>
<p>Hay novelas que se leen con el cuerpo. Esta me devolvió a los veranos en el sur: el frío del agua, las tardes largas, la sensación de que todo podía pasar.</p>
<p>Lo mejor es el ritmo pausado. La historia de amor no tiene prisa, y la autora se toma el tiempo de mostrar cómo dos personas aprenden a confiar. Lo que menos me gustó fue el conflicto final, un poco forzado.</p>
<ul><li>Ideal para leer en vacaciones.</li><li>Perfecto si te gustan los romances lentos.</li><li>Ten pañuelos a mano para el último capítulo.</li></ul>`,
  },
  {
    id: 'r_kkc1', bookId: 'b_kkc1', slug: 'el-nombre-del-viento', title: 'Escuchar una historia junto al fuego', rating: 4.7, status: 'published', featured: false,
    createdAt: d('2026-08-10T21:00:00'), updatedAt: d('2026-08-12T22:00:00'), publishedAt: d('2026-08-12T22:00:00'),
    excerpt: 'La prosa de Rothfuss suena a música. Un libro largo que se siente corto, aunque sigo esperando la tercera parte como todos.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>Pocas veces una novela de fantasía me ha parecido tan bien escrita. Cada frase está pulida, como si Kvothe la hubiera ensayado mil veces antes de contarla.</p>
<p>Me encantó la estructura: un hombre en una posada contando su propia leyenda, sabiendo que la verdad es menos gloriosa que las canciones. La Universidad, las clases de simpatía, la pobreza constante de Kvothe… todo tiene textura.</p>
<blockquote>Es la pregunta lo que nos impulsa, no la respuesta.</blockquote>
<p>Mi única queja: Denna. Entiendo lo que el autor quería hacer con ella, pero muchas de sus escenas me sacaron del encanto.</p>`,
  },
  {
    id: 'r_orient', bookId: 'b_orient', slug: 'asesinato-en-el-orient-express', rating: 4.0, status: 'published', featured: false,
    createdAt: d('2026-07-20T19:00:00'), updatedAt: d('2026-07-21T19:30:00'), publishedAt: d('2026-07-21T19:30:00'),
    excerpt: 'Un misterio cerrado, elegante y con uno de los finales más atrevidos del género. Perfecto para una noche de invierno.',
    content: `<p><em>Esta reseña es contenido ficticio de demostración.</em></p>
<p>Corto, preciso y adictivo. Christie construye un rompecabezas en un espacio diminuto —un tren detenido por la nieve— y te deja jugar a la par de Poirot.</p>
<p>Los interrogatorios son el corazón del libro: cada pasajero tiene una coartada perfecta, y justamente por eso nada encaja.</p>
<div data-spoiler="true"><p>Que todos los pasajeros sean culpables es una solución que me pareció audaz y, a la vez, profundamente triste. Poirot elige la justicia por sobre la ley.</p></div>
<p>Le resto un picaflor porque algunos personajes son más caricatura que persona, pero el final lo compensa todo.</p>`,
  },
  {
    id: 'r_cien', bookId: 'b_cien', slug: 'cien-anos-de-soledad', rating: 4.5, status: 'draft', featured: false,
    createdAt: d('2026-10-27T22:00:00'), updatedAt: d('2026-10-28T23:15:00'),
    excerpt: '',
    content: `<p>Ideas sueltas: la lluvia de flores amarillas, los nombres que se repiten, la sensación de que el tiempo da vueltas en círculo…</p>`,
  },
]

export const seedSettings: SiteSettings = {
  siteName: 'Nia',
  tagline: 'Historias que encuentran su lugar.',
  heroTitle: 'Hay historias que permanecen contigo.',
  heroDescription: 'Un rincón entre libros, mundos imposibles y emociones que merecen ser compartidas.',
  aboutTitle: 'Leo de noche, cuando el mundo se queda quieto.',
  aboutText:
    'Soy Nia y este es mi cuaderno de lecturas. Aquí guardo lo que los libros me hacen sentir: los que me acompañaron en semanas difíciles, los que me hicieron reír en el metro y los que todavía no sé cómo explicar. No busco ser crítica literaria; solo quiero compartir historias que encontraron su lugar en mí, por si alguna también encuentra un lugar en ti.',
  profileName: 'Nia',
  biography:
    'Lectora de ciencia ficción, fantasía y romances lentos. Vivo en Chile, tomo demasiado té y nunca termino un libro sin subrayar algo.',
  social: {},
  metaDescription: 'Reseñas literarias de ciencia ficción, fantasía, romance y literatura juvenil, escritas con calma.',
  siteInfo: 'Las reseñas incluidas en esta versión de demostración son contenido ficticio de ejemplo.',
}

export const createSeedState = (): ContentState => ({
  version: SEED_VERSION,
  books: seedBooks,
  reviews: seedReviews,
  genres: seedGenres,
  series: seedSeries,
  settings: seedSettings,
})
