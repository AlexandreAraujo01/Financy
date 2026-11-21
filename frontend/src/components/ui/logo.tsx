import logo from '@/assets/logo.svg';
import logoSmall from '@/assets/logo-sm.svg';

export function Logo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return size === 'lg' ? (
    <img className="financy-logo" src={logo} alt="Financy" width={134} height={32} />
  ) : (
    <img className="financy-logo" src={logoSmall} alt="Financy" width={100} height={24} />
  );
}
