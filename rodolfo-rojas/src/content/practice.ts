import type { PersonaId } from './personas'

export type PracticeStep = {
  title: string
  text: string
  sceneAlt: string
  cta: string
  code?: string
}

export type PracticeContent = {
  level1: { title: string; text: string; sceneAlt: string; recipient: string; code?: string }
  level2: { title: string; assetCode: string; steps: [PracticeStep, PracticeStep, PracticeStep, PracticeStep] }
}

export const PRACTICE: Record<PersonaId, PracticeContent> = {
  abuelita: {
    level1: {
      title: 'Mándele 1 XLM a Doña Rosa',
      text: 'Doña Rosa acaba de abrir su monedero. Mándele 1 XLM y fírmelo con su wallet, como cuando confirma un SINPE.',
      sceneAlt: 'La abuelita confirma en el celular el pago a Doña Rosa',
      recipient: 'Doña Rosa',
    },
    level2: {
      title: 'La Pulpería Chepe',
      assetCode: 'CHEPE',
      steps: [
        { title: 'Don Chepe abre su pulpería', text: 'Se crea una cuenta nueva que va a emitir los vales: la pulpería de Don Chepe.', sceneAlt: 'Don Chepe frente a su pulpería abierta', cta: 'Abrir la pulpería' },
        { title: 'Trustline: “yo acepto vales de Don Chepe”', text: 'Usted firma con su wallet que confía en los vales CHEPE.', sceneAlt: 'La abuelita y Don Chepe se dan la mano', cta: 'Confiar en Don Chepe' },
        { title: 'Mint: Don Chepe le imprime 100 vales', text: 'Don Chepe le manda 100 CHEPE recién impresos a su monedero.', sceneAlt: 'Una imprenta sacando 100 vales', cta: 'Imprimir 100 CHEPE' },
        { title: 'Burn: devuelve 10 vales y él los rompe', text: 'Le devuelve 10 vales a Don Chepe y dejan de existir.', sceneAlt: 'Unas tijeras cortando un vale', cta: 'Quemar 10 CHEPE' },
      ],
    },
  },
  rapero: {
    level1: {
      title: 'Pagale 1 XLM a DJ Pacho',
      text: 'DJ Pacho te hizo el beat, pagale lo justo,\n1 XLM firmado con tu wallet, sin susto.',
      sceneAlt: 'El rapero le paga al DJ Pacho por el beat',
      recipient: 'DJ Pacho',
    },
    level2: {
      title: 'Los tiquetes del toque',
      assetCode: 'TOQUE',
      steps: [
        { title: 'Se arma el toque', text: 'Una cuenta nueva va a emitir los tiquetes:\nla tarima del toque, lista pa sonar.', sceneAlt: 'Escenario con las luces encendidas y el micrófono listo', cta: 'Armar el toque' },
        { title: 'Trustline: entrás a la lista de backstage', text: 'Firmás que confiás en TOQUE,\nsin firma no hay pase, así es el bloque.', sceneAlt: 'La lista de backstage con el nombre del rapero marcado', cta: 'Entrar a la lista' },
        { title: 'Mint: se imprimen 100 tiquetes', text: 'El toque te manda 100 TOQUE calientitos,\nderechito a tu wallet, sin intermediarios ni gritos.', sceneAlt: 'Tres tiquetes azules apilados con el número 100', cta: 'Imprimir 100 TOQUE' },
        { title: 'Burn: en la puerta rompen 10 tiquetes', text: 'Devolvés 10 al issuer y ya no existen,\ntiquete usado no vuelve, por más que insisten.', sceneAlt: 'Unas tijeras partiendo un tiquete usado', cta: 'Quemar 10 TOQUE' },
      ],
    },
  },
  dev: {
    level1: {
      title: 'Fondeá a qa-bot con 1 XLM',
      text: 'qa-bot es una cuenta de pruebas que todavía no existe. Como no está en el ledger, el envío usa createAccount en vez de payment.',
      sceneAlt: 'Dos servidores conectados por una flecha',
      recipient: 'qa-bot',
      code: "Operation.createAccount({ destination: qaBot.publicKey(), startingBalance: '1' })",
    },
    level2: {
      title: 'Créditos de API: DEVCRED',
      assetCode: 'DEVCRED',
      steps: [
        { title: 'Crear la cuenta emisora', text: 'Un keypair nuevo será el issuer de DEVCRED. Lo fondeás con Friendbot.', sceneAlt: 'Un servidor nuevo con un signo más', cta: 'Crear issuer', code: "const issuer = Keypair.random()\nawait fetch('https://friendbot.stellar.org?addr=' + issuer.publicKey())" },
        { title: 'Trustline: changeTrust a DEVCRED', text: 'Tu cuenta opta por tener DEVCRED. Firmás con tu wallet.', sceneAlt: 'Un checkbox marcado sobre una lista', cta: 'Firmar changeTrust', code: 'Operation.changeTrust({ asset: devcred })' },
        { title: 'Mint: payment de 100 DEVCRED', text: 'El issuer te paga 100 DEVCRED: así nace la oferta.', sceneAlt: 'El número +100 en azul', cta: 'Mintear 100 DEVCRED', code: "Operation.payment({ destination: you, asset: devcred, amount: '100' })" },
        { title: 'Burn: devolver 10 DEVCRED al issuer', text: 'Pagarle al issuer saca esos 10 de circulación.', sceneAlt: 'Una llamita y el número −10 en rojo', cta: 'Quemar 10 DEVCRED', code: "Operation.payment({ destination: issuer, asset: devcred, amount: '10' })" },
      ],
    },
  },
}
