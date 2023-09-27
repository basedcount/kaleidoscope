type Fediseer = null | { endorsements: string[], hesitations: string[], censures: string[] };
type Filter = 'disabled' | 'moderate' | 'strict' | 'very-strict';

/*
  Disabled: no filtering, everything passes
  Moderate: remove content from censured instances
  Strict: remove content from censured and hesitated instances
  Very strict: only show content from endorsed instances

  Fediseer off => implicitly disabled filtering
*/

export function fediseerFilter(instance: string, fediseer: Fediseer, filter: Filter): boolean {
  const domain = new URL(instance).host;

  if (filter === 'disabled' || fediseer == null)
    return false

  if (filter === 'moderate' && fediseer.censures.includes(domain))
    return true;

  if (filter === 'strict' && (fediseer.hesitations.includes(domain) || fediseer.censures.includes(domain)))
    return true;

  if (filter === 'very-strict' && !fediseer.endorsements.includes(domain))
    return true;

  return false;
}
