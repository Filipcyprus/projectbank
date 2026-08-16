/* ---------------------------------------------------------------------------
 * Freeze enforcement.
 *
 * The security centre lets a citizen freeze their account or card; that is
 * only a real control if payment and identity-sharing screens actually check
 * it before calling the port. One place to check it, so the freeze card's own
 * claim ("suspends payments, identity sharing... until you unfreeze it")
 * stays true everywhere.
 * ------------------------------------------------------------------------- */

import type { SecuritySettings } from '../state/store';

export class FrozenError extends Error {}

export function assertPaymentsAllowed(security: Pick<SecuritySettings, 'accountFrozen' | 'cardFrozen'>, method: 'card' | 'account' = 'account') {
  if (security.accountFrozen) {
    throw new FrozenError('Your account is frozen. Unfreeze it in Security to send or pay.');
  }
  if (method === 'card' && security.cardFrozen) {
    throw new FrozenError('Your card is frozen. Unfreeze it in Security to pay with it.');
  }
}

export function assertSharingAllowed(security: Pick<SecuritySettings, 'accountFrozen'>) {
  if (security.accountFrozen) {
    throw new FrozenError('Identity sharing is suspended while your account is frozen. Unfreeze it in Security first.');
  }
}
