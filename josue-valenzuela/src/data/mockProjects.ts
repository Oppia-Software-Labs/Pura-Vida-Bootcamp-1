import { Project } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Smart Contract Soroban para Microcréditos P2P',
    company: 'Fintech Pura Vida',
    location: 'San José, Costa Rica',
    countryFlag: '🇨🇷',
    type: 'Bounty',
    category: 'Soroban',
    rewardXlm: 4500,
    description: 'Buscamos un desarrollador Rust/Soroban para crear un contrato inteligente que gestione préstamos comunitarios en Stellar Testnet con plazos fijos y amortización automática.',
    requirements: [
      'Dominio de Rust y Soroban SDK v22+',
      'Experiencia implementando tests unitarios en soroban-sdk',
      'Buenas prácticas de optimización de CPU/Memory footprints'
    ],
    publisherAddress: 'GBCXKY6K2W4L673U2T5O7Y3F2YQ6W254X42I2S7727EILR7GBLJVR74M',
    status: 'open',
    createdAt: '2026-11-15',
    applicants: [
      {
        id: 'app-1',
        developerAddress: 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVGAS',
        developerName: 'Carlos Méndez',
        developerContact: 'carlos.m@dev.cr',
        proposal: 'He desarrollado 3 smart contracts en Soroban para tokens personalizados y staking. Puedo entregar el contrato probado en 4 días.',
        portfolioUrl: 'https://github.com/carlosmendez-soroban',
        appliedAt: '2026-11-16',
        status: 'pending'
      }
    ]
  },
  {
    id: 'proj-2',
    title: 'Integración Pasarela de Pagos XLM para Comercio Electrónico',
    company: 'MercadoDigital LATAM',
    location: 'Bogotá, Colombia',
    countryFlag: '🇨🇴',
    type: 'Gig',
    category: 'Frontend',
    rewardXlm: 2800,
    description: 'Desarrollar un componente plug-and-play en React/Next.js que permita a los compradores pagar su carrito de compras en XLM o USDC nativo en Stellar usando Freighter o QR.',
    requirements: [
      'TypeScript, React y Tailwind CSS',
      'Conexión fluida con @stellar/freighter-api',
      'Manejo de códigos QR SEP-0007 / Stellar Web Checkout'
    ],
    publisherAddress: 'GDJ3M6K77I4XG89L6Y4M77E23L672J8846H29X572B2627E8923KJ892',
    status: 'open',
    createdAt: '2026-11-16',
    applicants: []
  },
  {
    id: 'proj-3',
    title: 'Auditoría de Seguridad y Optimización de Gas en Soroban',
    company: 'Stellar Security Labs',
    location: 'Buenos Aires, Argentina',
    countryFlag: '🇦🇷',
    type: 'Bounty',
    category: 'Security',
    rewardXlm: 6000,
    description: 'Revisión técnica de un protocolo de custodia multifirma (multisig) desarrollado sobre Stellar Soroban. Búsqueda de posibles vectores de reentrancia y optimización de TTL de almacenamiento.',
    requirements: [
      'Experiencia comprobada en auditorías de smart contracts Web3',
      'Profundo entendimiento del modelo de almacenamiento de Soroban (Instance, Persistent, Temporary)',
      'Capacidad para redactar un reporte técnico detallado en Markdown'
    ],
    publisherAddress: 'GAA8263K87265L628J7YTR5328JHG6289264JHG28652981652498762',
    status: 'open',
    createdAt: '2026-11-14',
    applicants: []
  },
  {
    id: 'proj-4',
    title: 'App Móvil de Remesas Transfronterizas con Stellar Anchor',
    company: 'RemesasYa',
    location: 'Ciudad de México, México',
    countryFlag: '🇲🇽',
    type: 'Full-time',
    category: 'Fullstack',
    rewardXlm: 12500,
    description: 'Liderar la arquitectura de nuestra app móvil híbrida (React Native / Flutter) que se conecta con anchors de Stellar (SEP-24/SEP-38) para transferencias instantáneas de bajo costo entre México y Centroamérica.',
    requirements: [
      'Conocimiento sólido de los estándares SEP de Stellar (SEP-10, SEP-24, SEP-38)',
      'Experiencia en aplicaciones móviles con biometría y custodia segura de claves',
      'Experiencia con APIs REST de Horizon'
    ],
    publisherAddress: 'GBB92735492863581726589126358912658912658912658912658912',
    status: 'open',
    createdAt: '2026-11-12',
    applicants: []
  },
  {
    id: 'proj-5',
    title: 'Visualizador de Liquidez en Tiempo Real para Stellar DEX',
    company: 'Andes Crypto Analytics',
    location: 'Santiago, Chile',
    countryFlag: '🇨🇱',
    type: 'Gig',
    category: 'Backend',
    rewardXlm: 3200,
    description: 'Crear un microservicio en Node.js o Go que consuma el stream de operaciones de Horizon (SSE) para calcular el volumen de trading, profundidad de libro de órdenes y spreads de los pares XLM/USDC y XLM/EURC.',
    requirements: [
      'Node.js o Go',
      'Consumo de APIs Streaming (Server-Sent Events / WebSockets)',
      'Comprensión del Automated Market Maker (AMM) y libro de órdenes de Stellar'
    ],
    publisherAddress: 'GCC82635491827364591827364591827364591827364591827364591',
    status: 'open',
    createdAt: '2026-11-17',
    applicants: []
  }
];
