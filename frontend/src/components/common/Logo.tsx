import { Link } from 'react-router-dom';
import logoSvg from '../../assets/logo.svg';

const Logo = () => {
  return (
    <Link
      to="/"
      className="group relative inline-flex items-center gap-3 rounded-xl px-2 py-1 transition duration-200 hover:-translate-y-0.5"
    >
      <img
        src={logoSvg}
        alt="Creatures Inc logo"
        className="h-12 w-auto object-contain drop-shadow-sm"
        loading="lazy"
      />
    </Link>
  );
};

export default Logo;
