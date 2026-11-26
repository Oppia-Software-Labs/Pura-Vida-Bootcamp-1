type Photo = {
  src: string
  width: number
  height: number
  alt: string
  caption: string
  author: string
  license: string
  licenseUrl: string
  /** Página de la foto en Wikimedia Commons, con autoría y licencia. */
  source: string
}

const YERBAL: Photo = {
  src: '/misiones/yerbal.jpg',
  width: 1200,
  height: 900,
  alt: 'Hileras de plantas de yerba mate sobre tierra colorada, bajo un cielo despejado',
  caption: 'Un yerbal en Misiones, sobre la tierra colorada.',
  author: 'Loco085',
  license: 'CC BY-SA 2.5',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5/',
  source: 'https://commons.wikimedia.org/wiki/File:Yerba-mate-misiones.JPG',
}

const TAREFEROS: Photo = {
  src: '/misiones/tareferos.jpg',
  width: 800,
  height: 619,
  alt: 'Trabajadores de la cosecha caminando por un camino de tierra roja entre árboles',
  caption: 'Tareferos, los trabajadores de la cosecha, cerca de Yaboty.',
  author: 'Phillip Capper',
  license: 'CC BY 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  source:
    'https://commons.wikimedia.org/wiki/File:Itinerant_Yerba_Mate_harvesters_on_the_road_out_of_Yaboti,_Misiones,_Argentina,_Jan._2011_-_Flickr_-_PhillipC.jpg',
}

const MATE: Photo = {
  src: '/misiones/mate.jpg',
  width: 800,
  height: 944,
  alt: 'Un mate de calabaza con bombilla, lleno de yerba, junto a una pala de madera con yerba suelta',
  caption: 'El resultado: la yerba, lista para el mate.',
  author: 'Siarhei Besarab',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  source:
    'https://commons.wikimedia.org/wiki/File:Traditional_mate_set_calabash_gourd_with_La_Merced_yerba_mate.jpg',
}

const PHOTOS = [YERBAL, TAREFEROS, MATE]

const LINK =
  'rounded-sm py-1.5 underline underline-offset-4 outline-none sm:py-0 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'

function Figure({ photo, className }: { photo: Photo; className?: string }) {
  return (
    <figure className={`grid content-start gap-2 ${className ?? ''}`}>
      <img
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className="aspect-4/3 w-full rounded-xl border object-cover shadow-sm"
      />
      <figcaption className="text-sm text-pretty text-muted-foreground">
        {photo.caption}
      </figcaption>
    </figure>
  )
}

/** De dónde viene la yerba: contexto del fondo yerbatero para quien no lo conoce. */
export function MisionesSection() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 text-pretty">
        <p>
          <strong className="font-semibold">Misiones</strong> es una provincia
          del noreste de Argentina, entre Paraguay y Brasil, y la principal zona
          productora de yerba mate del país. Su tierra colorada y su clima
          cálido y húmedo son ideales para el cultivo. Los{' '}
          <strong className="font-semibold">yerbateros</strong> son los
          productores que la cultivan y la cosechan.
        </p>
        <p className="text-muted-foreground">
          El aporte del 5 % es una idea para sumar a esos productores: un fondo
          para mejorar la producción y la calidad de la yerba. Estamos
          contactando a productores yerbateros y a su federación para validarla.
          En esta demo, el aporte llega a una cuenta de prueba en Testnet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <Figure photo={YERBAL} className="col-span-2" />
        <Figure photo={TAREFEROS} />
        <Figure photo={MATE} />
      </div>

      <p className="text-sm leading-8 text-muted-foreground sm:text-xs sm:leading-normal">
        Fotos vía Wikimedia Commons:{' '}
        {PHOTOS.map((photo, index) => (
          <span key={photo.src}>
            <a
              className={LINK}
              href={photo.source}
              target="_blank"
              rel="noreferrer"
            >
              {photo.author}
            </a>{' '}
            (
            <a
              className={LINK}
              href={photo.licenseUrl}
              target="_blank"
              rel="noreferrer"
            >
              {photo.license}
            </a>
            ){index < PHOTOS.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </div>
  )
}
