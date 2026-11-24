import { StrKey } from '@stellar/stellar-sdk';
export function validAmount(value) { return /^(0|[1-9]\d*)(\.\d{1,7})?$/.test(value) && Number(value)>0 && Number(value)<=100000; }
export function validDestination(value) { return StrKey.isValidEd25519PublicKey(value); }
export function validatePayment(destination, amount, sender) {
 if(!validDestination(destination)) throw new Error('Ingresa una dirección Stellar válida (G…).');
 if(!validAmount(amount)) throw new Error('El monto debe ser mayor que 0, hasta 100.000 XLM y con máximo 7 decimales.');
 if(destination===sender) throw new Error('Usa una cuenta distinta a la del destinatario.');
}
